begin;
select plan(17);

select has_table('cities');
select has_table('restaurants');
select has_table('restaurant_locations');
select has_table('catalogue_sources');
select has_table('catalogue_claims');
select has_table('users');
select has_table('taste_interactions');
select has_table('restaurant_visits');
select has_table('food_lists');
select has_table('recommendation_runs');
select has_table('catalogue_import_rows');

select ok(
  (select relrowsecurity from pg_class where oid='public.restaurant_visits'::regclass),
  'restaurant_visits has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.product_analytics_events'::regclass),
  'product analytics has row level security enabled'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='restaurant_visits' and policyname='owner_select'),
  'visits have an owner-only read policy'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='public' and tablename='product_analytics_events'),
  'analytics has no client policy'
);
select ok(
  exists(select 1 from pg_indexes where schemaname='public' and indexname='taste_interactions_idempotency_uidx'),
  'interaction idempotency index exists'
);

select * from finish();
rollback;
