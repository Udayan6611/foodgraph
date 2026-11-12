-- FoodGraph RLS policy performance and existing event-trigger hardening.
-- Preserves the original access predicates; auth.uid() is evaluated once per statement.
begin;

-- The existing Supabase-created event trigger remains registered and active.
-- Event trigger invocation is managed by PostgreSQL; public RPC execution is unnecessary.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

drop policy if exists users_read_self on public.users;
create policy users_read_self on public.users for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_read_self on public.user_profiles;
drop policy if exists profiles_insert_self on public.user_profiles;
drop policy if exists profiles_update_self on public.user_profiles;
create policy profiles_read_self on public.user_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_insert_self on public.user_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_update_self on public.user_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists privacy_read_self on public.user_privacy_settings;
drop policy if exists privacy_insert_self on public.user_privacy_settings;
drop policy if exists privacy_update_self on public.user_privacy_settings;
create policy privacy_read_self on public.user_privacy_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy privacy_insert_self on public.user_privacy_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy privacy_update_self on public.user_privacy_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_consents','user_preferences','taste_interactions','restaurant_comparisons',
    'restaurant_visits','taste_profile_snapshots','user_similarity_snapshots',
    'recommendation_runs'
  ] loop
    execute format('drop policy if exists owner_select on public.%I', t);
    execute format('drop policy if exists owner_insert on public.%I', t);
    execute format('create policy owner_select on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    if t <> 'user_consents' then
      execute format('drop policy if exists owner_update on public.%I', t);
      execute format('drop policy if exists owner_delete on public.%I', t);
      execute format('create policy owner_update on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
      execute format('create policy owner_delete on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
    end if;
  end loop;
end $$;

drop policy if exists food_lists_owner_select on public.food_lists;
drop policy if exists food_lists_owner_insert on public.food_lists;
drop policy if exists food_lists_owner_update on public.food_lists;
drop policy if exists food_lists_owner_delete on public.food_lists;
create policy food_lists_owner_select on public.food_lists for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy food_lists_owner_insert on public.food_lists for insert to authenticated
  with check (owner_user_id = (select auth.uid()));
create policy food_lists_owner_update on public.food_lists for update to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy food_lists_owner_delete on public.food_lists for delete to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists taste_circles_owner_select on public.taste_circles;
drop policy if exists taste_circles_owner_insert on public.taste_circles;
drop policy if exists taste_circles_owner_update on public.taste_circles;
drop policy if exists taste_circles_owner_delete on public.taste_circles;
create policy taste_circles_owner_select on public.taste_circles for select to authenticated
  using (owner_user_id = (select auth.uid()));
create policy taste_circles_owner_insert on public.taste_circles for insert to authenticated
  with check (owner_user_id = (select auth.uid()));
create policy taste_circles_owner_update on public.taste_circles for update to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy taste_circles_owner_delete on public.taste_circles for delete to authenticated
  using (owner_user_id = (select auth.uid()));

drop policy if exists circle_members_owner_select on public.taste_circle_members;
drop policy if exists circle_members_owner_insert on public.taste_circle_members;
create policy circle_members_owner_select on public.taste_circle_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.taste_circles c
      where c.id = circle_id and c.owner_user_id = (select auth.uid())
    )
  );
create policy circle_members_owner_insert on public.taste_circle_members for insert to authenticated
  with check (
    exists (
      select 1 from public.taste_circles c
      where c.id = circle_id and c.owner_user_id = (select auth.uid())
    )
  );

drop policy if exists follow_self_select on public.user_follows;
drop policy if exists follow_self_insert on public.user_follows;
drop policy if exists follow_self_delete on public.user_follows;
create policy follow_self_select on public.user_follows for select to authenticated
  using (follower_user_id = (select auth.uid()) or followed_user_id = (select auth.uid()));
create policy follow_self_insert on public.user_follows for insert to authenticated
  with check (follower_user_id = (select auth.uid()));
create policy follow_self_delete on public.user_follows for delete to authenticated
  using (follower_user_id = (select auth.uid()));

drop policy if exists block_self_select on public.user_blocks;
drop policy if exists block_self_insert on public.user_blocks;
drop policy if exists block_self_delete on public.user_blocks;
create policy block_self_select on public.user_blocks for select to authenticated
  using (blocker_user_id = (select auth.uid()));
create policy block_self_insert on public.user_blocks for insert to authenticated
  with check (blocker_user_id = (select auth.uid()));
create policy block_self_delete on public.user_blocks for delete to authenticated
  using (blocker_user_id = (select auth.uid()));

drop policy if exists food_list_items_owner_select on public.food_list_items;
drop policy if exists food_list_items_owner_insert on public.food_list_items;
drop policy if exists food_list_items_owner_update on public.food_list_items;
drop policy if exists food_list_items_owner_delete on public.food_list_items;
create policy food_list_items_owner_select on public.food_list_items for select to authenticated
  using (exists(select 1 from public.food_lists l where l.id = list_id and l.owner_user_id = (select auth.uid())));
create policy food_list_items_owner_insert on public.food_list_items for insert to authenticated
  with check (exists(select 1 from public.food_lists l where l.id = list_id and l.owner_user_id = (select auth.uid())));
create policy food_list_items_owner_update on public.food_list_items for update to authenticated
  using (exists(select 1 from public.food_lists l where l.id = list_id and l.owner_user_id = (select auth.uid())))
  with check (exists(select 1 from public.food_lists l where l.id = list_id and l.owner_user_id = (select auth.uid())));
create policy food_list_items_owner_delete on public.food_list_items for delete to authenticated
  using (exists(select 1 from public.food_lists l where l.id = list_id and l.owner_user_id = (select auth.uid())));

drop policy if exists recommendation_items_owner_select on public.recommendation_items;
create policy recommendation_items_owner_select on public.recommendation_items for select to authenticated
  using (exists(select 1 from public.recommendation_runs r where r.id = recommendation_run_id and r.user_id = (select auth.uid())));

drop policy if exists recommendation_feedback_owner_select on public.recommendation_feedback;
drop policy if exists recommendation_feedback_owner_insert on public.recommendation_feedback;
create policy recommendation_feedback_owner_select on public.recommendation_feedback for select to authenticated
  using (user_id = (select auth.uid()));
create policy recommendation_feedback_owner_insert on public.recommendation_feedback for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.recommendation_items i
      join public.recommendation_runs r on r.id = i.recommendation_run_id
      where i.id = recommendation_item_id and r.user_id = (select auth.uid())
    )
  );

commit;
