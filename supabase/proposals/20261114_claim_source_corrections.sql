-- FoodGraph catalogue source reassignment proposal
-- Prepared: 14 November 2026 (Asia/Kolkata)
-- PURPOSE: Reassign four rating claims to the provider evidence they match.
-- SAFETY: This proposal intentionally ends with ROLLBACK. It has NOT been
-- executed on hosted Supabase. Do not change ROLLBACK to COMMIT as part of review.
-- SCOPE: source rows + source_id on four rating claims only.
-- EXPLICITLY NOT CHANGED: rating values, review counts, legacy price tiers,
-- verification_state, observed_at, valid_until, restaurant/location statuses.

BEGIN;

INSERT INTO public.catalogue_sources
  (id, source_type, source_name, source_url, accessed_at, reliability_note)
VALUES
  (
    '9c82a84c-21c6-5e23-a20b-091937f7d0a1',
    'maps',
    'Google reviews',
    'https://www.google.com/maps/search/?api=1&query=Cafe+Vanah+Aundh+Pune&query_place_id=ChIJqdU46b-_wjsRvRrrcpxcmq0',
    TIMESTAMPTZ '2026-11-14 22:01:00+05:30',
    'Exact Google Maps place ID and Aundh address returned by structured business lookup on 2026-11-14. Returned rating/count 4.7 / 1,657 exactly match the imported rating claim. Source reassignment only; claim remains unreviewed.'
  ),
  (
    '0c39d8a8-531d-5c16-bad9-0d73fbbe3b2e',
    'maps',
    'Google reviews',
    'https://www.google.com/maps/search/?api=1&query=Maratha+Samrat+Baner+Pune&query_place_id=ChIJyxac7RW_wjsRe7tLMZomjmY',
    TIMESTAMPTZ '2026-11-14 22:01:00+05:30',
    'Exact Google Maps place ID and Modi Square, Baner address returned by structured business lookup on 2026-11-14. Returned rating/count 4.3 / 8,240 exactly match the imported rating claim. District currently shows a different rating/count. Source reassignment only; claim remains unreviewed.'
  ),
  (
    '2c577d4f-e9ba-5eb8-b9c7-6788f167dbd8',
    'maps',
    'Google reviews',
    'https://www.google.com/maps/search/?api=1&query=Yakii+Deccan+Gymkhana+Pune&query_place_id=ChIJB1gASCXBwjsR6ml0fauXNhs',
    TIMESTAMPTZ '2026-11-14 22:01:00+05:30',
    'Exact Google Maps place ID and Ground Floor, next to R-Deccan Mall, Deccan Gymkhana address returned by structured business lookup on 2026-11-14. Returned rating/count 4.6 / 2,474 exactly match the imported rating claim. District currently shows 4.5 / 2,442. Source reassignment only; claim remains unreviewed.'
  ),
  (
    '35a2bd27-eccd-5fd4-a81c-52eb7dbf1ea6',
    'other',
    'Tripadvisor ratings and reviews',
    'https://www.tripadvisor.in/Restaurant_Review-g297654-d1075345-Reviews-George_Restaurant-Pune_Pune_District_Maharashtra.html',
    TIMESTAMPTZ '2026-11-14 22:01:00+05:30',
    'Direct Tripadvisor George Restaurant page returned 4.1 / 316 reviews on 2026-11-14, exactly matching the imported rating claim. District currently shows 4.1 / 3,528 ratings; Google has a much larger count. Source reassignment only; claim remains unreviewed.'
  )
ON CONFLICT (source_url) DO UPDATE
SET source_type = EXCLUDED.source_type,
    source_name = EXCLUDED.source_name,
    accessed_at = EXCLUDED.accessed_at,
    reliability_note = EXCLUDED.reliability_note;

WITH proposed_sources (
  claim_id, current_source_id, proposed_source_id, expected_field_value
) AS (
  VALUES
    (
      '5d285879-fe5c-5ec0-8bdf-bd5ff5e4087b'::uuid,
      'eb0a5f06-64b1-5005-9864-7df4bd07e5ff'::uuid,
      '9c82a84c-21c6-5e23-a20b-091937f7d0a1'::uuid,
      '{"value":4.7,"review_count":1657}'::jsonb
    ),
    (
      'e30e3efe-c9a6-5c70-b2aa-f270c56197e3'::uuid,
      '20783e1b-8eaf-5d86-8f85-634a2f84e11c'::uuid,
      '0c39d8a8-531d-5c16-bad9-0d73fbbe3b2e'::uuid,
      '{"value":4.3,"review_count":8240}'::jsonb
    ),
    (
      '2baf13b1-8e4c-515b-b9b9-3478602d64d1'::uuid,
      'fa5efe58-0d4d-5ce5-ae4e-4d3d1d1857a3'::uuid,
      '2c577d4f-e9ba-5eb8-b9c7-6788f167dbd8'::uuid,
      '{"value":4.6,"review_count":2474}'::jsonb
    ),
    (
      'dcbd3f4b-62b9-5ff0-8619-d5992fcb5a32'::uuid,
      '93a5d395-7416-56eb-bf3e-accf7c5070dd'::uuid,
      '35a2bd27-eccd-5fd4-a81c-52eb7dbf1ea6'::uuid,
      '{"value":4.1,"review_count":316}'::jsonb
    )
)
UPDATE public.catalogue_claims AS claim
SET source_id = proposal.proposed_source_id
FROM proposed_sources AS proposal
WHERE claim.id = proposal.claim_id
  AND claim.source_id = proposal.current_source_id
  AND claim.field_key = 'rating'
  AND claim.field_value = proposal.expected_field_value
  AND claim.verification_state = 'unreviewed';

-- Review the affected claims before the transaction is rolled back.
SELECT
  restaurant.canonical_name,
  claim.id AS claim_id,
  claim.field_value,
  source.source_type,
  source.source_name,
  source.source_url,
  claim.verification_state,
  claim.observed_at
FROM public.catalogue_claims AS claim
JOIN public.restaurant_locations AS location
  ON location.id = claim.restaurant_location_id
JOIN public.restaurants AS restaurant
  ON restaurant.id = location.restaurant_id
JOIN public.catalogue_sources AS source
  ON source.id = claim.source_id
WHERE claim.id IN (
  '5d285879-fe5c-5ec0-8bdf-bd5ff5e4087b'::uuid,
  'e30e3efe-c9a6-5c70-b2aa-f270c56197e3'::uuid,
  '2baf13b1-8e4c-515b-b9b9-3478602d64d1'::uuid,
  'dcbd3f4b-62b9-5ff0-8619-d5992fcb5a32'::uuid
)
ORDER BY restaurant.canonical_name;

-- Deliberate: this is a review-only preview and must not persist.
ROLLBACK;
