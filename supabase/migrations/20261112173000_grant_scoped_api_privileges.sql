-- Least-privilege SQL grants complement the RLS row predicates.
begin;
grant select on public.editorial_collections, public.editorial_collection_items to anon, authenticated;
grant select on public.users to authenticated;
grant select, insert, update on public.user_profiles, public.user_privacy_settings to authenticated;
grant select, insert on public.user_consents to authenticated;
grant select, insert, update, delete on
  public.user_preferences, public.taste_interactions, public.restaurant_comparisons,
  public.restaurant_visits, public.food_lists, public.food_list_items, public.taste_circles
to authenticated;
grant select, insert on public.taste_circle_members to authenticated;
grant select, insert, delete on public.user_follows, public.user_blocks to authenticated;

drop policy if exists owner_insert on public.taste_profile_snapshots;
drop policy if exists owner_update on public.taste_profile_snapshots;
drop policy if exists owner_delete on public.taste_profile_snapshots;
drop policy if exists owner_insert on public.user_similarity_snapshots;
drop policy if exists owner_update on public.user_similarity_snapshots;
drop policy if exists owner_delete on public.user_similarity_snapshots;
drop policy if exists owner_insert on public.recommendation_runs;
drop policy if exists owner_update on public.recommendation_runs;
drop policy if exists owner_delete on public.recommendation_runs;
grant select on public.taste_profile_snapshots, public.user_similarity_snapshots,
  public.recommendation_runs, public.recommendation_items to authenticated;
grant select, insert on public.recommendation_feedback to authenticated;

grant all privileges on all tables in schema public to service_role;
alter default privileges for role postgres in schema public grant all privileges on tables to service_role;
commit;
