-- FoodGraph canonical PostgreSQL foundation.
-- Apply only to the newly created foodgraph-prod Supabase project after review.
-- Existing website / Apps Script data is not migrated or modified by this migration.

begin;

create extension if not exists pgcrypto with schema extensions;

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state_code text not null,
  country_code char(2) not null check (country_code = upper(country_code)),
  slug text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (name, state_code, country_code)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  name text not null,
  slug text not null,
  parent_area_id uuid references public.areas(id) on delete set null,
  centroid_lat numeric check (centroid_lat between -90 and 90),
  centroid_lng numeric check (centroid_lng between -180 and 180),
  status text not null default 'active' check (status in ('active','inactive')),
  unique (city_id, slug),
  unique (city_id, name)
);

create table public.area_adjacencies (
  from_area_id uuid not null references public.areas(id) on delete cascade,
  to_area_id uuid not null references public.areas(id) on delete cascade,
  relationship text not null check (relationship in ('adjacent','commonly_considered_nearby','same_district')),
  distance_km numeric check (distance_km >= 0),
  reviewed_at timestamptz,
  primary key (from_area_id, to_area_id),
  check (from_area_id <> to_area_id)
);

create table public.catalogue_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('official_site','maps','directory','editorial','user_submission','other')),
  source_name text not null,
  source_url text,
  accessed_at timestamptz,
  reliability_note text,
  created_at timestamptz not null default now(),
  unique (source_url) 
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null check (length(trim(canonical_name)) > 0),
  brand_name text,
  description text,
  status text not null default 'active' check (status in ('active','closed','needs_review','merged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_aliases (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  alias text not null check (length(trim(alias)) > 0),
  locale text,
  source_id uuid references public.catalogue_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  city_id uuid not null references public.cities(id) on delete restrict,
  area_id uuid references public.areas(id) on delete set null,
  location_name text not null,
  address_text text,
  latitude numeric check (latitude between -90 and 90),
  longitude numeric check (longitude between -180 and 180),
  maps_provider text,
  maps_place_id text,
  price_min numeric check (price_min >= 0),
  price_max numeric check (price_max >= 0),
  status text not null default 'unverified' check (status in ('active','temporarily_closed','closed','unverified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (price_min is null or price_max is null or price_max >= price_min),
  check ((maps_provider is null) = (maps_place_id is null))
);
create unique index restaurant_locations_external_place_uidx
  on public.restaurant_locations(maps_provider, maps_place_id)
  where maps_provider is not null and maps_place_id is not null;

create table public.cuisines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_cuisine_id uuid references public.cuisines(id) on delete set null
);

create table public.restaurant_location_cuisines (
  restaurant_location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  cuisine_id uuid not null references public.cuisines(id) on delete restrict,
  is_primary boolean not null default false,
  source_id uuid references public.catalogue_sources(id) on delete set null,
  primary key (restaurant_location_id, cuisine_id)
);
create unique index one_primary_cuisine_per_location_uidx
  on public.restaurant_location_cuisines(restaurant_location_id) where is_primary;

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  cuisine_id uuid references public.cuisines(id) on delete set null,
  description text,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','merged','inactive'))
);
create table public.dish_aliases (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  alias text not null,
  locale text,
  source_id uuid references public.catalogue_sources(id) on delete set null
);
create table public.location_dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict,
  menu_name text,
  availability_status text not null default 'unknown' check (availability_status in ('available','seasonal','unknown','unavailable')),
  price numeric check (price >= 0),
  last_verified_at timestamptz,
  source_id uuid references public.catalogue_sources(id) on delete set null,
  unique (restaurant_location_id, dish_id, menu_name)
);

create table public.catalogue_claims (
  id uuid primary key default gen_random_uuid(),
  restaurant_location_id uuid references public.restaurant_locations(id) on delete cascade,
  location_dish_id uuid references public.location_dishes(id) on delete cascade,
  field_key text not null,
  field_value jsonb not null,
  source_id uuid not null references public.catalogue_sources(id) on delete restrict,
  observed_at timestamptz,
  valid_until timestamptz,
  verification_state text not null default 'unreviewed' check (verification_state in ('unreviewed','accepted','rejected','stale')),
  check (num_nonnulls(restaurant_location_id, location_dish_id) = 1)
);

-- Supabase Auth owns credentials. This table stores only the product-side account identity.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  auth_subject text not null unique,
  status text not null default 'active' check (status in ('active','suspended','deletion_requested','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, auth_subject) values (new.id, new.id::text)
  on conflict (id) do nothing;
  insert into public.user_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  insert into public.user_privacy_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create table public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_key text,
  home_city_id uuid references public.cities(id) on delete set null,
  home_area_id uuid references public.areas(id) on delete set null,
  bio text,
  profile_visibility text not null default 'private' check (profile_visibility in ('private','connections','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_privacy_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  diary_visibility text not null default 'private' check (diary_visibility in ('private','connections','selected_circles')),
  visits_visibility text not null default 'private' check (visits_visibility in ('private','connections','selected_circles')),
  taste_profile_visibility text not null default 'private' check (taste_profile_visibility in ('private','connections','public')),
  allow_taste_matching boolean not null default false,
  allow_activity_sharing boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  purpose text not null,
  status text not null check (status in ('granted','withdrawn')),
  notice_version text not null,
  captured_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  capture_method text not null,
  metadata jsonb,
  check ((status = 'withdrawn') = (withdrawn_at is not null))
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  dimension text not null check (dimension in ('cuisine','dish','dietary','budget','occasion','ambience','area')),
  cuisine_id uuid references public.cuisines(id) on delete restrict,
  dish_id uuid references public.dishes(id) on delete restrict,
  area_id uuid references public.areas(id) on delete restrict,
  value jsonb not null,
  preference text not null check (preference in ('likes','avoids','wants','neutral')),
  strength numeric not null default 0 check (strength between -1 and 1),
  source text not null check (source in ('onboarding','user_edit','import_with_consent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  check (num_nonnulls(cuisine_id,dish_id,area_id) <= 1),
  check (
    (dimension = 'cuisine' and cuisine_id is not null and dish_id is null and area_id is null) or
    (dimension = 'dish' and dish_id is not null and cuisine_id is null and area_id is null) or
    (dimension = 'area' and area_id is not null and cuisine_id is null and dish_id is null) or
    (dimension in ('dietary','budget','occasion','ambience') and num_nonnulls(cuisine_id,dish_id,area_id) = 0)
  )
);

create table public.taste_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  restaurant_location_id uuid references public.restaurant_locations(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete cascade,
  cuisine_id uuid references public.cuisines(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('saved','unsaved','liked','disliked','skipped','ranked')),
  value jsonb,
  source text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  visibility text not null default 'private' check (visibility in ('private','connections','selected_circles')),
  idempotency_key text,
  check (num_nonnulls(restaurant_location_id,dish_id,cuisine_id) = 1)
);
create unique index taste_interactions_idempotency_uidx
  on public.taste_interactions(user_id,idempotency_key) where idempotency_key is not null;

create table public.restaurant_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  first_location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  second_location_id uuid not null references public.restaurant_locations(id) on delete cascade,
  preferred_location_id uuid references public.restaurant_locations(id) on delete set null,
  reason_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (first_location_id <> second_location_id),
  check (preferred_location_id is null or preferred_location_id in (first_location_id,second_location_id))
);

create table public.restaurant_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  restaurant_location_id uuid not null references public.restaurant_locations(id) on delete restrict,
  visited_at timestamptz,
  visit_status text not null default 'self_reported' check (visit_status in ('self_reported','evidence_pending','verified','rejected')),
  notes text,
  visibility text not null default 'private' check (visibility in ('private','connections','selected_circles')),
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index restaurant_visits_idempotency_uidx
  on public.restaurant_visits(user_id,idempotency_key) where idempotency_key is not null;

create table public.visit_dishes (
  visit_id uuid not null references public.restaurant_visits(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict,
  note text,
  source text not null default 'self_reported',
  primary key (visit_id,dish_id)
);
create table public.visit_evidence (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.restaurant_visits(id) on delete cascade,
  evidence_type text not null,
  storage_key text,
  provider_reference text,
  review_state text not null default 'unreviewed' check (review_state in ('unreviewed','accepted','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.user_follows (
  follower_user_id uuid not null references public.users(id) on delete cascade,
  followed_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','pending')),
  created_at timestamptz not null default now(),
  primary key (follower_user_id,followed_user_id),
  check (follower_user_id <> followed_user_id)
);
create table public.user_blocks (
  blocker_user_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id,blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);
create table public.taste_circles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id,name)
);
create table public.taste_circle_members (
  circle_id uuid not null references public.taste_circles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  membership_status text not null default 'invited' check (membership_status in ('invited','active','removed')),
  created_at timestamptz not null default now(),
  primary key (circle_id,user_id)
);

create table public.food_lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private','connections','selected_circles','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.food_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.food_lists(id) on delete cascade,
  restaurant_location_id uuid references public.restaurant_locations(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete cascade,
  note text,
  position integer,
  created_at timestamptz not null default now(),
  check (num_nonnulls(restaurant_location_id,dish_id) = 1),
  unique (list_id,position)
);

create table public.editorial_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  author_user_id uuid references public.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.editorial_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.editorial_collections(id) on delete cascade,
  restaurant_location_id uuid references public.restaurant_locations(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete cascade,
  position integer not null,
  advice text,
  source_id uuid references public.catalogue_sources(id) on delete set null,
  check (num_nonnulls(restaurant_location_id,dish_id) = 1),
  unique (collection_id,position)
);

create table public.taste_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  model_version text not null,
  profile jsonb not null,
  input_watermark timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.user_similarity_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  similar_user_id uuid not null references public.users(id) on delete cascade,
  model_version text not null,
  similarity numeric not null check (similarity between 0 and 1),
  input_watermark timestamptz not null,
  created_at timestamptz not null default now(),
  check (user_id <> similar_user_id),
  unique (user_id,similar_user_id,model_version)
);

create table public.recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  model_version text not null,
  request_context jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.recommendation_items (
  id uuid primary key default gen_random_uuid(),
  recommendation_run_id uuid not null references public.recommendation_runs(id) on delete cascade,
  restaurant_location_id uuid not null references public.restaurant_locations(id) on delete restrict,
  rank_position integer not null check (rank_position > 0),
  reason_codes text[] not null default '{}',
  score numeric,
  unique (recommendation_run_id,rank_position),
  unique (recommendation_run_id,restaurant_location_id)
);
create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  recommendation_item_id uuid not null references public.recommendation_items(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  feedback text not null check (feedback in ('useful','not_useful','saved','skipped')),
  created_at timestamptz not null default now()
);

create table public.product_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text,
  visitor_id text,
  referrer_id text,
  source text,
  campaign text,
  landing_path text,
  event_data jsonb not null default '{}',
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create table public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_normalized text not null unique,
  area_text text,
  product_updates_consent boolean not null default false,
  legal_acknowledged boolean not null,
  legal_version text not null,
  legal_acknowledged_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Import ledger preserves every original source row, including rows with incomplete provenance.
create table public.catalogue_import_rows (
  id uuid primary key,
  source_file text not null,
  source_row_number integer not null check (source_row_number > 0),
  content_sha256 text not null,
  raw_row jsonb not null,
  restaurant_location_id uuid references public.restaurant_locations(id) on delete set null,
  import_status text not null check (import_status in ('imported','rejected','needs_review')),
  imported_at timestamptz not null default now(),
  unique (source_file,source_row_number)
);

create index areas_city_idx on public.areas(city_id);
create index restaurant_locations_city_area_idx on public.restaurant_locations(city_id,area_id);
create index restaurant_locations_status_idx on public.restaurant_locations(status);
create index restaurant_location_cuisines_cuisine_idx on public.restaurant_location_cuisines(cuisine_id);
create index catalogue_claims_target_idx on public.catalogue_claims(restaurant_location_id,field_key);
create index user_preferences_user_active_idx on public.user_preferences(user_id,is_active);
create index taste_interactions_user_time_idx on public.taste_interactions(user_id,occurred_at desc);
create index restaurant_visits_user_time_idx on public.restaurant_visits(user_id,visited_at desc);
create index visit_evidence_visit_idx on public.visit_evidence(visit_id);
create index food_lists_owner_idx on public.food_lists(owner_user_id);
create index recommendation_runs_user_time_idx on public.recommendation_runs(user_id,created_at desc);
create index product_analytics_events_time_idx on public.product_analytics_events(occurred_at desc);

-- Enable RLS on every application table. Public read access is limited to the curated catalogue
-- and explicitly published editorial collections. Private user data is owner-only in v1.
do $$
declare t text;
begin
  foreach t in array array[
    'cities','areas','area_adjacencies','catalogue_sources','restaurants','restaurant_aliases',
    'restaurant_locations','cuisines','restaurant_location_cuisines','dishes','dish_aliases',
    'location_dishes','catalogue_claims','users','user_profiles','user_privacy_settings',
    'user_consents','user_preferences','taste_interactions','restaurant_comparisons',
    'restaurant_visits','visit_dishes','visit_evidence','user_follows','user_blocks',
    'taste_circles','taste_circle_members','food_lists','food_list_items','editorial_collections',
    'editorial_collection_items','taste_profile_snapshots','user_similarity_snapshots',
    'recommendation_runs','recommendation_items','recommendation_feedback',
    'product_analytics_events','early_access_signups','catalogue_import_rows'
  ] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

grant select on public.cities,public.areas,public.restaurants,public.restaurant_locations,
  public.cuisines,public.restaurant_location_cuisines,public.dishes,public.location_dishes
  to anon, authenticated;
create policy catalogue_cities_read on public.cities for select to anon,authenticated using (status='active');
create policy catalogue_areas_read on public.areas for select to anon,authenticated using (status='active');
create policy catalogue_restaurants_read on public.restaurants for select to anon,authenticated using (status='active');
create policy catalogue_locations_read on public.restaurant_locations for select to anon,authenticated using (status='active');
create policy catalogue_cuisines_read on public.cuisines for select to anon,authenticated using (true);
create policy catalogue_location_cuisines_read on public.restaurant_location_cuisines for select to anon,authenticated using (true);
create policy catalogue_dishes_read on public.dishes for select to anon,authenticated using (status='active');
create policy catalogue_location_dishes_read on public.location_dishes for select to anon,authenticated using (availability_status in ('available','seasonal','unknown'));

-- Self-service policies. No social sharing policy is enabled until block-aware authorization is implemented.
create policy users_read_self on public.users for select to authenticated using (id=auth.uid());
create policy profiles_read_self on public.user_profiles for select to authenticated using (user_id=auth.uid());
create policy profiles_insert_self on public.user_profiles for insert to authenticated with check (user_id=auth.uid());
create policy profiles_update_self on public.user_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy privacy_read_self on public.user_privacy_settings for select to authenticated using (user_id=auth.uid());
create policy privacy_insert_self on public.user_privacy_settings for insert to authenticated with check (user_id=auth.uid());
create policy privacy_update_self on public.user_privacy_settings for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'user_consents','user_preferences','taste_interactions','restaurant_comparisons',
    'restaurant_visits','taste_profile_snapshots','user_similarity_snapshots',
    'recommendation_runs'
  ] loop
    execute format('create policy owner_select on public.%I for select to authenticated using (user_id=auth.uid())',t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (user_id=auth.uid())',t);
    if t <> 'user_consents' then
      execute format('create policy owner_update on public.%I for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
      execute format('create policy owner_delete on public.%I for delete to authenticated using (user_id=auth.uid())',t);
    end if;
  end loop;
end $$;

create policy food_lists_owner_select on public.food_lists for select to authenticated using (owner_user_id=auth.uid());
create policy food_lists_owner_insert on public.food_lists for insert to authenticated with check (owner_user_id=auth.uid());
create policy food_lists_owner_update on public.food_lists for update to authenticated using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid());
create policy food_lists_owner_delete on public.food_lists for delete to authenticated using (owner_user_id=auth.uid());

create policy taste_circles_owner_select on public.taste_circles for select to authenticated using (owner_user_id=auth.uid());
create policy taste_circles_owner_insert on public.taste_circles for insert to authenticated with check (owner_user_id=auth.uid());
create policy taste_circles_owner_update on public.taste_circles for update to authenticated using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid());
create policy taste_circles_owner_delete on public.taste_circles for delete to authenticated using (owner_user_id=auth.uid());

create policy circle_members_owner_select on public.taste_circle_members for select to authenticated
  using (user_id=auth.uid() or exists(select 1 from public.taste_circles c where c.id=circle_id and c.owner_user_id=auth.uid()));
create policy circle_members_owner_insert on public.taste_circle_members for insert to authenticated
  with check (exists(select 1 from public.taste_circles c where c.id=circle_id and c.owner_user_id=auth.uid()));
create policy follow_self_select on public.user_follows for select to authenticated
  using (follower_user_id=auth.uid() or followed_user_id=auth.uid());
create policy follow_self_insert on public.user_follows for insert to authenticated with check (follower_user_id=auth.uid());
create policy follow_self_delete on public.user_follows for delete to authenticated using (follower_user_id=auth.uid());
create policy block_self_select on public.user_blocks for select to authenticated using (blocker_user_id=auth.uid());
create policy block_self_insert on public.user_blocks for insert to authenticated with check (blocker_user_id=auth.uid());
create policy block_self_delete on public.user_blocks for delete to authenticated using (blocker_user_id=auth.uid());

create policy food_list_items_owner_select on public.food_list_items for select to authenticated
  using (exists(select 1 from public.food_lists l where l.id=list_id and l.owner_user_id=auth.uid()));
create policy food_list_items_owner_insert on public.food_list_items for insert to authenticated
  with check (exists(select 1 from public.food_lists l where l.id=list_id and l.owner_user_id=auth.uid()));
create policy food_list_items_owner_update on public.food_list_items for update to authenticated
  using (exists(select 1 from public.food_lists l where l.id=list_id and l.owner_user_id=auth.uid()))
  with check (exists(select 1 from public.food_lists l where l.id=list_id and l.owner_user_id=auth.uid()));
create policy food_list_items_owner_delete on public.food_list_items for delete to authenticated
  using (exists(select 1 from public.food_lists l where l.id=list_id and l.owner_user_id=auth.uid()));

create policy recommendation_items_owner_select on public.recommendation_items for select to authenticated
  using (exists(select 1 from public.recommendation_runs r where r.id=recommendation_run_id and r.user_id=auth.uid()));
create policy recommendation_feedback_owner_select on public.recommendation_feedback for select to authenticated using (user_id=auth.uid());
create policy recommendation_feedback_owner_insert on public.recommendation_feedback for insert to authenticated
  with check (user_id=auth.uid() and exists(
    select 1 from public.recommendation_items i
    join public.recommendation_runs r on r.id=i.recommendation_run_id
    where i.id=recommendation_item_id and r.user_id=auth.uid()
  ));
create policy editorial_published_read on public.editorial_collections for select to anon,authenticated using (status='published');
create policy editorial_items_published_read on public.editorial_collection_items for select to anon,authenticated
  using (exists(select 1 from public.editorial_collections c where c.id=collection_id and c.status='published'));

-- Analytics, signups, evidence and import ledger are service-role only. No client policies.
commit;
