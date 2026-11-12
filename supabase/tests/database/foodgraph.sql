begin;
select plan(21);

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

-- Minimal fixtures for real PostgreSQL constraint tests (the whole test file rolls back).
insert into public.cities(id,name,state_code,country_code,slug)
values ('00000000-0000-4000-8000-000000000001','pgTAP City','MH','IN','pgtap-test-city');
insert into public.restaurants(id,canonical_name,status)
values ('00000000-0000-4000-8000-000000000002','pgTAP Restaurant','active');
insert into public.restaurant_locations(id,restaurant_id,city_id,location_name,maps_provider,maps_place_id)
values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','pgTAP location','google','pgtap-place');

insert into public.early_access_signups(name,email_normalized,legal_acknowledged,legal_version,legal_acknowledged_at)
values ('pgTAP','pgtap@example.invalid',true,'test',now());
select throws_ok(
  $q$insert into public.early_access_signups(name,email_normalized,legal_acknowledged,legal_version,legal_acknowledged_at)
    values ('pgTAP duplicate','pgtap@example.invalid',true,'test',now())$q$,
  '23505', null, 'duplicate signup email is rejected'
);

insert into public.catalogue_import_rows(id,source_file,source_row_number,content_sha256,raw_row,import_status)
values ('00000000-0000-4000-8000-000000000005','pgtap-duplicate-test',1,'abc','{}','imported');
select throws_ok(
  $q$insert into public.catalogue_import_rows(id,source_file,source_row_number,content_sha256,raw_row,import_status)
    values ('00000000-0000-4000-8000-000000000006','pgtap-duplicate-test',1,'def','{}','imported')$q$,
  '23505', null, 'duplicate source row is rejected by the import ledger'
);

select throws_ok(
  $q$insert into public.restaurant_locations(id,restaurant_id,city_id,location_name,latitude)
    values ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','invalid latitude',91)$q$,
  '23514', null, 'latitude outside geographic bounds is rejected'
);

select throws_ok(
  $q$insert into public.restaurant_locations(id,restaurant_id,city_id,location_name,maps_provider,maps_place_id)
    values ('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','duplicate provider place','google','pgtap-place')$q$,
  '23505', null, 'duplicate external place ID is rejected'
);

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
  position('unverified' in coalesce((select qual from pg_policies where schemaname='public' and tablename='restaurant_locations' and policyname='catalogue_locations_read'),'')) = 0,
  'unreviewed catalogue locations are not public'
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
