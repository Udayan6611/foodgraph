-- Complete canonical FoodGraph domain fields while retaining pre-foundation columns for compatibility.
begin;
alter table public.restaurant_comparisons alter column first_location_id drop not null, alter column second_location_id drop not null;
alter table public.restaurant_comparisons drop constraint if exists restaurant_comparisons_preferred_location_id_fkey;
alter table public.restaurant_comparisons
  add column other_location_id uuid references public.restaurant_locations(id) on delete restrict,
  add column context jsonb,
  add column occurred_at timestamptz not null default now();
update public.restaurant_comparisons
set other_location_id = case
  when preferred_location_id = first_location_id then second_location_id
  when preferred_location_id = second_location_id then first_location_id
  else null
end
where other_location_id is null;
alter table public.restaurant_comparisons
  alter column preferred_location_id set not null,
  alter column other_location_id set not null,
  add constraint restaurant_comparisons_preferred_fk
    foreign key (preferred_location_id) references public.restaurant_locations(id) on delete restrict,
  add constraint restaurant_comparisons_canonical_pair_check
    check (preferred_location_id <> other_location_id);
create index restaurant_comparisons_other_location_idx on public.restaurant_comparisons(other_location_id);

alter table public.restaurant_visits
  add column time_precision text,
  add column visit_source text,
  add column verification_status text,
  add column note text,
  add column deleted_at timestamptz;
update public.restaurant_visits
set time_precision='unknown', visit_source='self_report',
    verification_status=case visit_status
      when 'evidence_pending' then 'evidence_pending'
      when 'verified' then 'verified'
      when 'rejected' then 'rejected'
      else 'unverified' end,
    note=notes;
alter table public.restaurant_visits
  alter column time_precision set default 'unknown',
  alter column time_precision set not null,
  alter column visit_source set default 'self_report',
  alter column visit_source set not null,
  alter column verification_status set default 'unverified',
  alter column verification_status set not null,
  add constraint restaurant_visits_time_precision_check check (time_precision in ('exact','date_only','approximate','unknown')),
  add constraint restaurant_visits_source_check check (visit_source in ('self_report','location_checkin','receipt','transaction','pos','import_with_consent')),
  add constraint restaurant_visits_verification_status_check check (verification_status in ('unverified','evidence_pending','partially_verified','verified','rejected'));

alter table public.visit_dishes
  add column location_dish_id uuid references public.location_dishes(id) on delete set null,
  add column sentiment text;
alter table public.visit_dishes add constraint visit_dishes_sentiment_check
  check (sentiment is null or sentiment in ('loved','liked','neutral','disliked'));
create index visit_dishes_location_dish_idx on public.visit_dishes(location_dish_id);

alter table public.visit_evidence
  add column status text,
  add column captured_at timestamptz,
  add column reviewer_type text,
  add column rejection_reason text,
  add column created_at timestamptz;
update public.visit_evidence
set status=case review_state when 'accepted' then 'accepted' when 'rejected' then 'rejected' else 'submitted' end,
    captured_at=submitted_at, created_at=submitted_at;
alter table public.visit_evidence
  alter column status set default 'submitted',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  add constraint visit_evidence_status_check check (status in ('submitted','processing','accepted','rejected','expired'));

update public.user_follows set status='accepted' where status='active';
alter table public.user_follows
  alter column status set default 'accepted',
  drop constraint if exists user_follows_status_check,
  add constraint user_follows_status_check check (status in ('pending','accepted','blocked'));
alter table public.user_blocks add column reason_code text;

alter table public.taste_circles
  add column visibility text not null default 'private',
  add column updated_at timestamptz not null default now();
alter table public.taste_circles add constraint taste_circles_visibility_check
  check (visibility in ('private','invited_members'));
alter table public.taste_circle_members
  add column role text not null default 'member',
  add column joined_at timestamptz;
update public.taste_circle_members m
set role=case when m.user_id=c.owner_user_id then 'owner' else 'member' end,
    joined_at=m.created_at
from public.taste_circles c where c.id=m.circle_id;
update public.taste_circle_members set joined_at=now() where joined_at is null;
alter table public.taste_circle_members
  alter column joined_at set default now(),
  alter column joined_at set not null,
  add constraint taste_circle_members_role_check check (role in ('owner','member'));

alter table public.food_list_items add column added_at timestamptz;
update public.food_list_items set added_at=created_at where added_at is null;
alter table public.food_list_items alter column added_at set default now(), alter column added_at set not null;

alter table public.editorial_collections
  add column summary text,
  add column city_id uuid references public.cities(id) on delete restrict,
  add column occasion text,
  add column author_type text not null default 'founder',
  add column reviewed_at timestamptz;
update public.editorial_collections
set summary=coalesce(description,'Editorial summary pending review'),
    city_id=(select id from public.cities where slug='pune' limit 1)
where summary is null or city_id is null;
alter table public.editorial_collections
  alter column summary set not null,
  add constraint editorial_collections_author_type_check check (author_type in ('founder','editor','community'));
create index editorial_collections_city_status_idx on public.editorial_collections(city_id,status);
alter table public.editorial_collection_items
  add column recommendation_type text not null default 'featured',
  add column reason text,
  add column source_note text,
  add column reviewed_at timestamptz;
update public.editorial_collection_items set reason=coalesce(advice,'Editorial explanation pending review') where reason is null;
alter table public.editorial_collection_items
  alter column reason set not null,
  add constraint editorial_collection_items_recommendation_type_check check (recommendation_type in ('get','skip','consider','featured'));

alter table public.taste_profile_snapshots
  add column profile_version integer,
  add column feature_vector jsonb,
  add column generated_at timestamptz,
  add column quality_state text;
with versioned as (
  select id,row_number() over(partition by user_id order by created_at,id)::integer version_no
  from public.taste_profile_snapshots
)
update public.taste_profile_snapshots t
set profile_version=v.version_no, feature_vector=coalesce(t.profile,'{}'::jsonb),
    generated_at=t.created_at, quality_state='cold_start'
from versioned v where v.id=t.id;
alter table public.taste_profile_snapshots
  alter column profile_version set not null,
  alter column feature_vector set default '{}'::jsonb,
  alter column feature_vector set not null,
  alter column generated_at set default now(),
  alter column generated_at set not null,
  alter column quality_state set default 'cold_start',
  alter column quality_state set not null,
  alter column profile drop not null,
  add constraint taste_profile_snapshots_version_check check (profile_version > 0),
  add constraint taste_profile_snapshots_quality_check check (quality_state in ('cold_start','sparse','usable','mature'));
create unique index taste_profile_snapshots_user_version_uidx on public.taste_profile_snapshots(user_id,profile_version);

alter table public.user_similarity_snapshots
  add column user_a_id uuid,
  add column user_b_id uuid,
  add column similarity_score numeric,
  add column similarity_model_version text,
  add column overlap_summary jsonb,
  add column computed_at timestamptz,
  add column eligible_for_discovery boolean;
update public.user_similarity_snapshots
set user_a_id=least(user_id,similar_user_id), user_b_id=greatest(user_id,similar_user_id),
    similarity_score=similarity, similarity_model_version=model_version,
    overlap_summary='{}'::jsonb, computed_at=created_at, eligible_for_discovery=false;
alter table public.user_similarity_snapshots
  alter column user_id drop not null,
  alter column similar_user_id drop not null,
  alter column model_version drop not null,
  alter column similarity drop not null,
  alter column input_watermark drop not null,
  alter column user_a_id set not null,
  alter column user_b_id set not null,
  alter column similarity_model_version set not null,
  alter column overlap_summary set default '{}'::jsonb,
  alter column overlap_summary set not null,
  alter column computed_at set default now(),
  alter column computed_at set not null,
  alter column eligible_for_discovery set default false,
  alter column eligible_for_discovery set not null,
  add constraint user_similarity_canonical_order_check check (user_a_id < user_b_id);
create unique index user_similarity_pair_model_uidx on public.user_similarity_snapshots(user_a_id,user_b_id,similarity_model_version);

alter table public.recommendation_runs
  add column anonymous_visitor_id text,
  add column candidate_count integer not null default 0,
  add constraint recommendation_runs_candidate_count_check check (candidate_count >= 0);
alter table public.recommendation_items
  add column score_components jsonb not null default '{}'::jsonb,
  add column evidence_summary jsonb not null default '{}'::jsonb,
  add column created_at timestamptz not null default now();

alter table public.recommendation_feedback
  alter column user_id drop not null,
  alter column feedback drop not null,
  add column feedback_type text,
  add column reason_code text;
update public.recommendation_feedback
set feedback_type=case feedback when 'not_useful' then 'not_for_me' when 'skipped' then 'dismissed' else feedback end
where feedback_type is null;
alter table public.recommendation_feedback
  alter column feedback_type set not null,
  add constraint recommendation_feedback_type_check check (feedback_type in ('useful','not_for_me','saved','dismissed'));

alter table public.product_analytics_events
  add column visit_session_id text,
  add column user_id uuid references public.users(id) on delete set null,
  add column route text,
  add column properties jsonb,
  add column consent_state text;
update public.product_analytics_events
set visit_session_id=session_id, route=landing_path,
    properties=coalesce(event_data,'{}'::jsonb), consent_state='unknown';
alter table public.product_analytics_events
  alter column properties set default '{}'::jsonb,
  alter column properties set not null,
  alter column consent_state set default 'unknown',
  alter column consent_state set not null;

create unique index location_dishes_no_menu_uidx
  on public.location_dishes(restaurant_location_id,dish_id) where menu_name is null;
alter table public.taste_interactions add constraint taste_interactions_source_check
  check (source in ('prototype','diary','discovery','import_with_consent'));
commit;
