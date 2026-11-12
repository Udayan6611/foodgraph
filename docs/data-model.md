# FoodGraph canonical data model

**Status:** Product and architecture specification  
**Version:** 1.0  
**Date:** 12 November 2026  
**Scope:** Long-term FoodGraph model, with an explicit mapping from the current Pune prototype

This document defines the canonical information model for FoodGraph. It is the shared reference for product design, backend implementation, recommendation logic, analytics and privacy decisions.

It describes the system we intend to build. It does not mean these tables, accounts, social features or behavioural recommendations already exist in production.

## 1. Design principles

1. **People, places and dishes are first-class entities.** A restaurant is not just a string in a recommendation array.
2. **A physical location is distinct from a restaurant brand.** Visits, directions, neighbourhood and local availability belong to a specific venue.
3. **Preferences, opinions, visits and verified purchases are different facts.** Never store or score them as though they mean the same thing.
4. **Raw behaviour is preserved; taste profiles are derived.** Keep the source interaction and its timestamp so profile logic can be recalculated.
5. **Evidence travels with a claim.** A visit may be self-reported, location-supported, receipt-supported or transaction-supported. Store the source and review state.
6. **Privacy is enforced in the data model.** Personal diaries and detailed history are private by default. Sharing is explicit and scoped.
7. **Analytics is not the food graph.** Website visits, clicks and form submissions must never become restaurant visits.
8. **The graph is a logical model first.** Start with a relational database and derive graph relationships from its records. A graph database is not required just because the product is named FoodGraph.
9. **Cold start is a supported state.** Recommendations must remain honest and useful when there is little cross-user data.
10. **Do not collect future data early.** Financial data, continuous location and receipt images are not required for the first account-based product.

## 2. Conceptual graph

The core relationships are:

\`\`\`mermaid
erDiagram
  USER ||--|| USER_PROFILE : has
  USER ||--o{ USER_PREFERENCE : records
  USER ||--o{ TASTE_INTERACTION : creates
  USER ||--o{ RESTAURANT_VISIT : reports
  USER ||--o{ FOOD_LIST : owns
  USER ||--o{ USER_FOLLOW : follows
  USER ||--o{ USER_CONSENT : grants

  CITY ||--o{ AREA : contains
  CITY ||--o{ RESTAURANT_LOCATION : contains
  AREA ||--o{ RESTAURANT_LOCATION : groups
  RESTAURANT ||--o{ RESTAURANT_LOCATION : operates
  RESTAURANT_LOCATION ||--o{ RESTAURANT_CUISINE : offers
  CUISINE ||--o{ RESTAURANT_CUISINE : classifies
  RESTAURANT_LOCATION ||--o{ LOCATION_DISH : serves
  DISH ||--o{ LOCATION_DISH : appears_at

  RESTAURANT_LOCATION ||--o{ RESTAURANT_VISIT : receives
  RESTAURANT_VISIT ||--o{ VISIT_DISH : includes
  DISH ||--o{ VISIT_DISH : eaten_as
  RESTAURANT_VISIT ||--o{ VISIT_EVIDENCE : supported_by

  RESTAURANT_LOCATION ||--o{ TASTE_INTERACTION : target
  DISH ||--o{ TASTE_INTERACTION : target
  CUISINE ||--o{ TASTE_INTERACTION : target

  FOOD_LIST ||--o{ FOOD_LIST_ITEM : contains
  RESTAURANT_LOCATION ||--o{ FOOD_LIST_ITEM : saved_place
  DISH ||--o{ FOOD_LIST_ITEM : saved_dish

  USER ||--o{ RECOMMENDATION_RUN : receives
  RECOMMENDATION_RUN ||--o{ RECOMMENDATION_ITEM : contains
  RESTAURANT_LOCATION ||--o{ RECOMMENDATION_ITEM : recommends
  RECOMMENDATION_ITEM ||--o{ RECOMMENDATION_FEEDBACK : receives
\`\`\`

The diagram is conceptual. The table definitions below are authoritative where the diagram omits fields or implementation constraints.

## 3. Entity boundaries

### User and profile

A user is an authenticated FoodGraph account. A profile is the user-visible representation of that account. Keep authentication credentials with the authentication provider; FoodGraph stores the provider subject and product-specific profile data.

### Restaurant and location

- **Restaurant:** the canonical business or restaurant identity, such as a brand or independently operated restaurant.
- **Restaurant location:** one physical branch or venue. A user's visit must point to this entity.
- **Cuisine:** a controlled taxonomy. A venue may have multiple cuisines.
- **Dish:** a canonical dish concept. A location may serve many dishes, and a dish may be served at many locations.
- **Location dish:** the relationship between a particular venue and a dish. Availability, menu evidence and local naming belong here.

For independent restaurants, one restaurant may have one location. Do not force a chain/brand structure onto listings that do not need it.

### Taste and behaviour

- **Preference:** what a person says they like or want.
- **Interaction:** an action such as saving, liking, disliking, skipping or comparing a place or dish.
- **Visit:** a claim that a person actually visited a specific location at a particular time.
- **Visit evidence:** material or provider evidence that supports or weakens a visit claim.
- **Visit dish:** a dish associated with a visit. It may be self-reported and should retain that provenance.
- **Taste profile:** a derived representation computed from preferences and eligible behaviour. It is not the source record itself.

### Opinion and sharing

A personal note, star/rank, list or reaction is authored by a user and has a visibility setting. A private note must not become public just because it contributes to that user's recommendations.

### Recommendation

A recommendation run is an auditable request for a ranked result set. Each item stores its position, model version and reason codes. Feedback refers to the exact item shown to the user, not merely to a restaurant name.

## 4. Canonical schema

The field types below use PostgreSQL-friendly notation as a reference. They are logical specifications, not a migration script. UUIDs are primary keys unless stated otherwise. All timestamps are UTC **TIMESTAMPTZ**. Use foreign keys, indexes and database constraints in implementation.

### 4.1 Identity, profiles and consent

#### users

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| auth_subject | TEXT | Unique subject from the chosen authentication provider; never a password |
| status | TEXT | active, suspended, deletion_requested, deleted |
| created_at | TIMESTAMPTZ | Account creation time |
| updated_at | TIMESTAMPTZ | Last account update |
| deleted_at | TIMESTAMPTZ, nullable | Set during deletion workflow where a retained tombstone is required |

Unique constraint: auth_subject. Account deletion must trigger the deletion workflow described later.

#### user_profiles

| Field | Type | Rules / purpose |
|---|---|---|
| user_id | UUID | Primary key and FK to users |
| handle | TEXT | Unique, optional until chosen |
| display_name | TEXT | Public display name; not necessarily legal name |
| avatar_key | TEXT, nullable | Private-storage object key or approved image URL |
| home_city_id | UUID, nullable | FK to cities |
| home_area_id | UUID, nullable | FK to areas |
| bio | TEXT, nullable | User-authored profile description |
| profile_visibility | TEXT | private, connections, public; default private |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |

Email and authentication-provider details should not be included in the public profile record.

#### user_privacy_settings

| Field | Type | Rules / purpose |
|---|---|---|
| user_id | UUID | Primary key and FK to users |
| diary_visibility | TEXT | private, connections, selected_circles; default private |
| visits_visibility | TEXT | private, connections, selected_circles; default private |
| taste_profile_visibility | TEXT | private, connections, public; default private |
| allow_taste_matching | BOOLEAN | Default false until the person opts in |
| allow_activity_sharing | BOOLEAN | Default false |
| updated_at | TIMESTAMPTZ | Last change |

These settings govern display and discovery. They do not replace consent records where a distinct data-processing purpose requires consent.

#### user_consents

Append-only record of consent grants and withdrawals.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| purpose | TEXT | e.g. product_analytics, social_activity, location_checkin, receipt_processing, financial_data |
| status | TEXT | granted, withdrawn |
| notice_version | TEXT | Exact notice/policy version shown |
| captured_at | TIMESTAMPTZ | Time consent was recorded |
| withdrawn_at | TIMESTAMPTZ, nullable | Time withdrawn |
| capture_method | TEXT | UI surface or supported consent flow |
| metadata | JSONB, nullable | Minimal evidence of the consent interaction; never store secrets |

A new grant or withdrawal creates a new record. Do not overwrite history. A consent for one purpose must not silently authorise another purpose.

### 4.2 Geography and restaurant catalogue

#### cities

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Canonical city name |
| state_code | TEXT | State/region identifier |
| country_code | CHAR(2) | ISO country code |
| slug | TEXT | Unique canonical URL/search key |
| status | TEXT | active, inactive |

#### areas

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| city_id | UUID | FK to cities |
| name | TEXT | Canonical locality name |
| slug | TEXT | Unique within city |
| parent_area_id | UUID, nullable | Optional FK for broader locality grouping |
| centroid_lat / centroid_lng | NUMERIC, nullable | Approximate area centroid, not a user's location |
| status | TEXT | active, inactive |

Nearby-area relationships should eventually be explicit and reviewable (for example, a separate area_adjacencies table with a distance or relationship label). Do not infer exact travel time from a static adjacency list.

#### restaurants

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| canonical_name | TEXT | Canonical restaurant or brand name |
| brand_name | TEXT, nullable | Parent brand where relevant |
| description | TEXT, nullable | Sourced or editorial description |
| status | TEXT | active, closed, needs_review, merged |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |

This table does not hold a user's visit, rating or recommendation score.

#### restaurant_locations

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| restaurant_id | UUID | FK to restaurants |
| city_id | UUID | FK to cities |
| area_id | UUID, nullable | FK to areas |
| location_name | TEXT | Branch/venue name as shown to diners |
| address_text | TEXT, nullable | Human-readable address |
| latitude / longitude | NUMERIC, nullable | Venue coordinates |
| maps_provider | TEXT, nullable | Source of an external map identifier |
| maps_place_id | TEXT, nullable | Provider place ID, scoped by provider |
| price_min / price_max | NUMERIC, nullable | Indicative per-person range, with source and verification date elsewhere |
| status | TEXT | active, temporarily_closed, closed, unverified |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |

Recommended uniqueness: (maps_provider, maps_place_id) when both values exist. Do not use restaurant name alone as a unique key. Preserve alias/merge history when two records are identified as the same venue.

#### cuisines

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| name | TEXT | Canonical cuisine label |
| slug | TEXT | Unique |
| parent_cuisine_id | UUID, nullable | Optional taxonomy hierarchy |

#### restaurant_location_cuisines

| Field | Type | Rules / purpose |
|---|---|---|
| restaurant_location_id | UUID | FK to restaurant_locations |
| cuisine_id | UUID | FK to cuisines |
| is_primary | BOOLEAN | One primary cuisine at most per location |
| source_id | UUID, nullable | FK to source records when available |

Composite primary key: (restaurant_location_id, cuisine_id).

#### dishes

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| canonical_name | TEXT | Canonical dish name |
| cuisine_id | UUID, nullable | FK to cuisines |
| description | TEXT, nullable | Optional dish description |
| slug | TEXT | Unique canonical search key |
| status | TEXT | active, merged, inactive |

Dish variants, transliterations and aliases should be represented separately when needed; don't create duplicate canonical dishes merely because spelling differs.

#### location_dishes

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| restaurant_location_id | UUID | FK to restaurant_locations |
| dish_id | UUID | FK to dishes |
| menu_name | TEXT, nullable | Venue-specific menu wording |
| availability_status | TEXT | available, seasonal, unknown, unavailable |
| price | NUMERIC, nullable | Optional menu price |
| last_verified_at | TIMESTAMPTZ, nullable | When availability/details were last checked |
| source_id | UUID, nullable | Evidence/source record |

Unique constraint: (restaurant_location_id, dish_id, menu_name) where practical. Menu availability is time-sensitive.

#### catalogue_sources

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| source_type | TEXT | official_site, maps, directory, editorial, user_submission, other |
| source_name | TEXT | Human-readable publisher/provider |
| source_url | TEXT, nullable | URL used to check the claim |
| accessed_at | TIMESTAMPTZ | When the source was checked |
| reliability_note | TEXT, nullable | Internal quality note |
| created_at | TIMESTAMPTZ | Record creation |

Where a listing field is sourced from multiple places, keep field-level provenance in a separate catalogue_claims table in the implementation. Do not imply that one source validates every field on a listing.

### 4.3 Personal preferences and taste interactions

#### user_preferences

Stores explicit preference inputs and user corrections. It does not store inferred behaviour as though the user stated it.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| dimension | TEXT | cuisine, dish, dietary, budget, occasion, ambience, area |
| cuisine_id | UUID, nullable | FK when dimension is cuisine |
| dish_id | UUID, nullable | FK when dimension is dish |
| area_id | UUID, nullable | FK when dimension is area |
| value | JSONB | Dimension-specific value, such as price range or dietary constraint |
| preference | TEXT | likes, avoids, wants, neutral |
| strength | NUMERIC | Normalised explicit strength, range -1 to 1 |
| source | TEXT | onboarding, user_edit, import_with_consent |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |
| is_active | BOOLEAN | Retain history; deactivate rather than silently overwrite |

Validation must ensure the referenced entity matches the dimension. Budget and constraints should use structured values with currency and range boundaries, not free-form strings.

#### taste_interactions

Stores individual taste actions on a restaurant location, dish or cuisine. One row represents one action.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| restaurant_location_id | UUID, nullable | Target venue |
| dish_id | UUID, nullable | Target dish |
| cuisine_id | UUID, nullable | Target cuisine |
| interaction_type | TEXT | saved, unsaved, liked, disliked, skipped, tried, ranked |
| value | JSONB, nullable | Rank, optional reason tags or bounded action detail |
| source | TEXT | prototype, diary, discovery, import_with_consent |
| occurred_at | TIMESTAMPTZ | When the user action happened |
| recorded_at | TIMESTAMPTZ | When FoodGraph received it |
| visibility | TEXT | private, connections, selected_circles; default private |
| idempotency_key | TEXT, nullable | Prevent duplicate submissions from retries |

Exactly one target column must be set. Use a check constraint for that rule and foreign keys for each target. A unique idempotency key should be scoped to the user.

A saved place, a like and a reported visit are distinct. A like must not create a visit row.

#### restaurant_comparisons

For pairwise taste ranking, store the explicit comparison instead of trying to reconstruct it from a final score.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| preferred_location_id | UUID | FK to restaurant_locations |
| other_location_id | UUID | FK to restaurant_locations |
| context | JSONB, nullable | Optional comparison context |
| occurred_at | TIMESTAMPTZ | Comparison timestamp |

The two location IDs must be different. A comparison means "I prefer A to B in this context"; it is not an objective quality judgement.

### 4.4 Visits and verification evidence

#### restaurant_visits

This is the canonical dining-history record. Create it only when a user explicitly records or submits a visit through an approved flow.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| restaurant_location_id | UUID | FK to restaurant_locations |
| visited_at | TIMESTAMPTZ, nullable | User-reported visit time; retain whether estimated |
| time_precision | TEXT | exact, date_only, approximate, unknown |
| visit_source | TEXT | self_report, location_checkin, receipt, transaction, pos, import_with_consent |
| verification_status | TEXT | unverified, evidence_pending, partially_verified, verified, rejected |
| note | TEXT, nullable | Private by default |
| visibility | TEXT | private by default; explicit sharing required |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |
| deleted_at | TIMESTAMPTZ, nullable | Soft-delete marker while deletion workflow runs |

A user's visit history is not a public feed. The same user may have multiple visits to one venue; preserve them rather than overwriting a single visit count.

A "repeat visitor" signal must be derived from distinct accepted visit records, with duplicate and fraud checks. The interface must not claim repeat behaviour when records are only clicks, saves or unverified placeholders.

#### visit_dishes

| Field | Type | Rules / purpose |
|---|---|---|
| visit_id | UUID | FK to restaurant_visits |
| dish_id | UUID | FK to dishes |
| location_dish_id | UUID, nullable | FK to location_dishes |
| sentiment | TEXT, nullable | loved, liked, neutral, disliked |
| note | TEXT, nullable | Private by default |

Composite key can include visit_id and dish_id, with a surrogate ID if the user can record the same dish more than once during a visit.

#### visit_evidence

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| visit_id | UUID | FK to restaurant_visits |
| evidence_type | TEXT | user_statement, location_signal, receipt, transaction_reference, merchant_confirmation |
| status | TEXT | submitted, processing, accepted, rejected, expired |
| storage_key | TEXT, nullable | Private object-storage key; never a public URL |
| provider_reference | TEXT, nullable | Minimal external evidence reference |
| captured_at | TIMESTAMPTZ, nullable | When evidence originated |
| reviewed_at | TIMESTAMPTZ, nullable | Review time |
| reviewer_type | TEXT, nullable | automated_rule, staff, partner |
| rejection_reason | TEXT, nullable | Internal, controlled reason code |
| created_at | TIMESTAMPTZ | Record creation |

Keep raw evidence in restricted storage, separate from the ordinary visit record. Do not put receipt images, bank statements, account numbers, card numbers, UPI IDs, CVVs, passwords or full transaction payloads in analytics events or public profile tables.

Verification is a claim-specific assessment. A location signal can support presence but does not prove a purchase. A receipt can support a purchase but does not prove which account holder ate the meal. A transaction may identify a merchant but not the dishes. Do not compress these limitations into a universal "verified user" badge.

### 4.5 Social connections and collections

#### user_follows

| Field | Type | Rules / purpose |
|---|---|---|
| follower_user_id | UUID | FK to users |
| followed_user_id | UUID | FK to users |
| status | TEXT | pending, accepted, blocked where follow approval is required |
| created_at | TIMESTAMPTZ | Request/follow time |

Composite key: (follower_user_id, followed_user_id). Prevent self-follow. Blocks must override follows and sharing.

#### taste_circles

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| owner_user_id | UUID | FK to users |
| name | TEXT | Circle name |
| visibility | TEXT | private, invited_members |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |

#### taste_circle_members

| Field | Type | Rules / purpose |
|---|---|---|
| circle_id | UUID | FK to taste_circles |
| user_id | UUID | FK to users |
| role | TEXT | owner, member |
| joined_at | TIMESTAMPTZ | Membership time |

Composite key: (circle_id, user_id).

#### food_lists

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| owner_user_id | UUID | FK to users |
| title | TEXT | List title |
| description | TEXT, nullable | Optional context |
| visibility | TEXT | private by default, connections, selected_circles, public |
| created_at / updated_at | TIMESTAMPTZ | Audit timestamps |

#### food_list_items

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| list_id | UUID | FK to food_lists |
| restaurant_location_id | UUID, nullable | Saved venue |
| dish_id | UUID, nullable | Saved dish |
| position | INTEGER | User-defined order |
| note | TEXT, nullable | Private unless list is shared |
| added_at | TIMESTAMPTZ | Time added |

Exactly one of restaurant_location_id or dish_id must be set. Lists may be ranked or unranked; preserve whether order is meaningful.

A social feed should be derived from activities the author has chosen to share. Do not copy every private diary action into a public feed table.

### 4.6 Editorial discovery

#### editorial_collections

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| slug | TEXT | Unique |
| title | TEXT | Collection title |
| summary | TEXT | Editorial introduction |
| city_id | UUID | FK to cities |
| occasion | TEXT, nullable | Date night, coffee run, group outing, etc. |
| author_type | TEXT | founder, editor, community |
| status | TEXT | draft, published, archived |
| published_at | TIMESTAMPTZ, nullable | Publication time |
| reviewed_at | TIMESTAMPTZ, nullable | Last editorial review |

#### editorial_collection_items

Stores ordered restaurant and dish entries with editorial context.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| collection_id | UUID | FK to editorial_collections |
| restaurant_location_id | UUID, nullable | Venue entry |
| dish_id | UUID, nullable | Dish entry |
| position | INTEGER | Display order |
| recommendation_type | TEXT | get, skip, consider, featured |
| reason | TEXT | Clear editorial explanation |
| source_note | TEXT, nullable | Internal provenance |
| reviewed_at | TIMESTAMPTZ, nullable | Last re-check |

Exactly one target must be set. Editorial advice must show its source/author context and should be reviewed because menus and venues change.

### 4.7 Taste profiles and similarity

#### taste_profile_snapshots

A computed profile is a versioned projection, not the raw source of truth.

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| profile_version | INTEGER | Monotonically increasing per user |
| model_version | TEXT | Version of feature/weight logic |
| feature_vector | JSONB | Structured taste features and normalised strengths |
| input_watermark | TIMESTAMPTZ | Latest source record included |
| generated_at | TIMESTAMPTZ | Computation time |
| quality_state | TEXT | cold_start, sparse, usable, mature |

Only eligible preferences and interactions may contribute. Private visibility controls what can be disclosed; the profile engine must not expose raw private notes or diary entries.

#### user_similarity_snapshots

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_a_id / user_b_id | UUID | FKs to users; store one canonical order |
| similarity_score | NUMERIC, nullable | Only after a defined and validated calculation |
| similarity_model_version | TEXT | Exact model version |
| overlap_summary | JSONB | Safe, explainable overlap categories |
| computed_at | TIMESTAMPTZ | Calculation time |
| eligible_for_discovery | BOOLEAN | Both users permit the relevant use |

Do not calculate similarity from only city, age, onboarding selections or social popularity. Use meaningful dining patterns and confidence-aware features. Respect each person's matching and privacy settings.

Avoid displaying scores such as "91% taste match" until the metric has a documented definition, is validated against useful outcomes and has enough evidence. Before that, use grounded explanations of the actual overlap.

### 4.8 Recommendations and evaluation

#### recommendation_runs

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID, nullable | FK to users; null for anonymous prototype requests |
| anonymous_visitor_id | TEXT, nullable | Temporary analytics linkage only, not account identity |
| request_context | JSONB | Area, budget, occasion, dietary constraints and other request inputs |
| model_version | TEXT | Exact ranking version |
| candidate_count | INTEGER | Number of eligible candidates |
| created_at | TIMESTAMPTZ | Request time |

#### recommendation_items

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| recommendation_run_id | UUID | FK to recommendation_runs |
| restaurant_location_id | UUID | FK to restaurant_locations |
| rank_position | INTEGER | Display order |
| score_components | JSONB | Explainable component values, not only a total |
| reason_codes | TEXT[] | Structured reasons supporting display explanation |
| evidence_summary | JSONB | Counts and evidence-quality summary safe for the user |
| created_at | TIMESTAMPTZ | Item creation |

Unique constraint: (recommendation_run_id, rank_position) and (recommendation_run_id, restaurant_location_id).

#### recommendation_feedback

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| recommendation_item_id | UUID | FK to recommendation_items |
| user_id | UUID, nullable | Account user where available |
| feedback_type | TEXT | useful, not_for_me, visited, saved, dismissed |
| reason_code | TEXT, nullable | Optional structured explanation |
| created_at | TIMESTAMPTZ | Feedback time |

A feedback record is tied to the exact recommendation item so the system can evaluate what was shown and why. visited in this table is a feedback claim and must not be treated as verified. A canonical visit record is created only through the visit-recording flow.

### 4.9 Product analytics and early-access signups

#### product_analytics_events

Product analytics is a separate system from dining records.

The current Events Google Sheet contains events such as:

- visit_start
- page_view
- discover_cta_click
- join_cta_click
- taste_submit
- result_view
- restaurant_click
- feedback
- signup_form_view
- signup_success

These are interactions with the website. restaurant_click means a user opened a map link; it does not mean they travelled to or visited the restaurant. feedback means the user reacted to a recommendation; it is not a verified meal.

The future backend may ingest analytics into a product_analytics_events table or a dedicated analytics service with a schema such as:

| Field | Type | Rules / purpose |
|---|---|---|
| id | UUID | Primary key |
| event_name | TEXT | Controlled event taxonomy |
| visitor_id | TEXT, nullable | Anonymous browser ID |
| visit_session_id | TEXT, nullable | Per-tab/session identifier |
| user_id | UUID, nullable | Only when signed in and permitted |
| occurred_at | TIMESTAMPTZ | Client event time, validated |
| received_at | TIMESTAMPTZ | Server receive time |
| route | TEXT | Page/route |
| properties | JSONB | Allowlisted non-sensitive event attributes |
| consent_state | TEXT | Relevant analytics consent state |

Do not store raw form fields, full URLs with personal query parameters, receipt images, financial payloads or unbounded free text in analytics.

#### early_access_signups

The existing Google Sheets Signups tab is a separate pre-account lead store. A signup does not automatically create a user account. When accounts are introduced, do not silently convert the early-access list into public profiles or social graph nodes. Obtain the necessary notice and consent before linking records.

## 5. Important relationships and cardinality

| Relationship | Cardinality | Meaning |
|---|---|---|
| User → preferences | 1 to many | A user can express many explicit preferences |
| User → taste interactions | 1 to many | Actions are preserved individually |
| Restaurant → locations | 1 to many | A brand can operate many physical venues |
| Location → cuisines | many to many | Venues can represent multiple cuisines |
| Location → dishes | many to many | A dish can be available at multiple venues |
| User → visits | 1 to many | Each distinct reported visit is retained |
| Visit → evidence | 1 to many | A visit can have different supporting evidence |
| Visit → dishes | many to many | A visit can include multiple dishes |
| User → follows | many to many | Social connections are user-controlled |
| User → lists | 1 to many | Lists belong to one owner |
| Recommendation run → items | 1 to many | Each run records the shown ranking |
| Recommendation item → feedback | 1 to many | Feedback is tied to what the user saw |

## 6. Source of truth and evidence rules

Every important claim should be traceable to a source record.

| Claim | Source of truth |
|---|---|
| User explicitly likes Japanese cuisine | Active user preference |
| User saved a restaurant | Taste interaction |
| User says they visited a restaurant | Restaurant visit with self_report source |
| User uploaded a receipt | Visit evidence record |
| User revisited a restaurant | Multiple distinct visit records after dedupe checks |
| User clicked a Google Maps link | Product analytics event only |
| Three similar diners chose a restaurant | Eligible visit and taste records from those diners, subject to privacy rules |
| Restaurant currently serves a particular dish | Location-dish record with recent source evidence |
| Restaurant has a particular rating | Source-labelled catalogue claim with capture date |

Evidence quality should not be reduced to a single universal verified boolean. Store evidence type, state, source, capture time and review outcome. Ranking may use a confidence feature, but the UI should describe the underlying evidence plainly.

## 7. Recommendation data flow

\`\`\`text
Explicit preferences ────────────┐
Taste interactions ──────────────┤
Accepted visit records ──────────┤
Dish-level experiences ──────────┤
Eligible social taste signals ───┤
                                 ▼
                    Versioned taste profile
                                 │
                    Similarity (when eligible)
                                 │
Restaurant + dish catalogue ────┤
Editorial context ───────────────┤
Area / budget / occasion ────────┤
Evidence confidence / recency ──┘
                                 ▼
                       Eligibility filters
                                 ▼
                       Candidate ranking
                                 ▼
                 Recommendation run + reasons
                                 ▼
                      User's shortlist
                                 ▼
                    Recommendation feedback
                                 ▼
             New interaction or visit record
\`\`\`

Hard constraints (for example, a user-marked dietary exclusion) are applied before soft ranking. A strong social signal cannot override a hard constraint.

A recommendation should be explainable by stored reason codes and relevant source records. Avoid opaque "AI says so" explanations.

## 8. Privacy, access and deletion

### Default visibility

| Data | Default |
|---|---|
| Email and auth identity | Private |
| Taste profile | Private |
| Personal food diary | Private |
| Visits and visit notes | Private |
| Receipt/transaction evidence | Restricted private storage |
| Taste interactions | Private unless the user shares |
| Lists | Private |
| User profile | Private until configured |
| Editorial collections | Public only after publication |
| Product analytics | Restricted to authorised operators |

### Access rules

- A user can read and change their own private records.
- Connections can only see the specific profile, visit, list or activity that the owner made visible to them.
- Selected circles can only see records shared with those circles.
- Public visitors can only see explicitly public profile and content.
- Blocks override follows, circle membership and feed visibility.
- Administrative access to raw evidence is restricted and audited.
- Recommendation services may use only signals allowed for that purpose. A private diary entry must not become public explanation text.

### Deletion and correction

Account deletion must be a workflow, not a single row delete:

1. Disable sign-in and new activity.
2. Revoke active sessions/tokens and stop future processing for the account.
3. Remove or irreversibly anonymise profile identifiers and private content according to the approved retention policy.
4. Delete private visit notes and evidence objects, including receipt files, where retention is not otherwise required.
5. Remove social connections, circle memberships and public sharing.
6. Invalidate taste profile and similarity snapshots that include the user.
7. Recompute or invalidate recommendations whose derived output depends on deleted data.
8. Retain only minimal audit/tombstone records where a documented legal or security purpose requires it.
9. Record completion and ensure backups expire under a defined schedule.

A user changing a preference should not erase the original interaction history if it is legitimately retained; the current derived profile must be recomputed from the current eligible inputs. A user withdrawing consent must stop the associated processing and trigger deletion or suppression of data as required by the purpose-specific policy.

## 9. Data quality and integrity constraints

These rules should be enforced in the database or domain service, not left to UI convention.

1. All visit records reference a specific restaurant location, not only a free-text name.
2. A restaurant location belongs to one city and may belong to one canonical area.
3. A dish interaction references a canonical dish. Aliases map to that dish rather than duplicating it.
4. A comparison references two different restaurant locations.
5. One interaction has exactly one target entity.
6. A visit is not created from a page view, map click, saved place or generic recommendation feedback.
7. Duplicate visit submissions are detected using an idempotency key and review rules. Never merge visits solely because they happened on the same day.
8. User-visible counts are computed from eligible records, with privacy thresholds where needed.
9. A user's private records cannot be used as public social proof.
10. Closed, merged or unverified venues must be handled explicitly in discovery.
11. Rating and price fields retain provenance and capture/verification dates.
12. Unknown values remain unknown. Do not replace missing prices, ratings, visit dates or dishes with guesses.
13. Derived profiles and similarity values record model versions and input watermarks.
14. Deletion, consent withdrawal and visibility changes apply to downstream derived data and cached feeds.
15. All external identifiers are scoped by provider; do not assume a Google Place ID or another provider ID is a universal FoodGraph identity.

## 10. Migration from the current prototype

The current app must keep working while the canonical model is introduced. No existing record should be reinterpreted as a stronger claim than it contains.

| Current item | Canonical destination / treatment |
|---|---|
| restaurants_v6.js row | Import as a restaurant location, with restaurant parent and normalized cuisine/area links |
| Restaurant name string | Resolve to a stable location UUID; names are labels, not IDs |
| Area string | Map to a canonical area in Pune |
| Cuisine string | Split, normalize and map to canonical cuisine IDs |
| Vibe string | Map to controlled occasion/ambience tags only after taxonomy review |
| Rating and review count | Source-labelled catalogue claims, with source and capture time if known |
| Indicative price tier | Catalogue price claim; unknown stays null |
| Source URL and rating evidence label | Catalogue provenance, not proof of a user's visit |
| foodgraph_area, cuisines, vibes, budget in LocalStorage | Current anonymous prototype inputs; later become explicit user preferences only after account opt-in |
| foodgraph_behavior_v1 in LocalStorage | Prototype-only feedback state; not a visit history and not cross-user training data |
| visitor_id | Anonymous analytics identifier; do not convert automatically into a person account |
| session_id / visit ID | Anonymous tab/session analytics identifier |
| Events sheet | Product analytics only |
| Signups sheet | Separate early-access lead records, not user accounts |
| Useful / Not for me | Taste interaction and/or recommendation feedback, once tied to a specific shown item |
| Google Maps click | Product analytics event only; never a visit |
| Current fit score | Prototype ranking output; preserve model version if recorded, but do not treat it as an enduring taste score |

### Restaurant catalogue import

The current dataset uses rows shaped approximately like:

\`\`\`text
[name, area, cuisine, vibe, rating, priceTier,
 reviews?, sourceUrl?, ratingEvidence?]
\`\`\`

There are 162 current Pune entries across 28 areas. A one-time import should:

1. Create canonical city and area records.
2. Normalize cuisine labels and controlled tags.
3. Create restaurant and restaurant_location records.
4. Attach known external place IDs only when they have been checked.
5. Preserve original source URLs, rating labels and unknown values.
6. Flag likely duplicates for review instead of merging automatically by similar name.
7. Produce an import report with created, matched, duplicate-candidate and rejected rows.

Do not rename or rewrite the current JavaScript dataset as part of the data-model design task. It remains the source for the current prototype until a separately tested migration replaces it.

## 11. Minimum viable backend boundary

The first backend should not attempt to deliver every long-term feature at once. The smallest useful account-based foundation is:

- Users and private profiles.
- Explicit taste preferences.
- Canonical Pune restaurants and physical locations.
- Taste interactions.
- Self-reported restaurant visits.
- Private visit notes and optional dish associations.
- Purpose-specific consent and privacy settings.
- Recommendation runs and item-level feedback.
- Product analytics kept separately.

Social follows, circles, public sharing, receipt files, transaction data, similarity snapshots and advanced graph analytics can be added after the foundation and privacy model are working.

However, the schema should reserve clear entity boundaries for these later capabilities so they do not require turning one overloaded table into an entire product.

### Suggested first API boundaries

These are logical resource boundaries, not implemented endpoints:

| Resource | Responsibility |
|---|---|
| /me/profile | Read and update private profile |
| /me/preferences | Manage explicit preferences |
| /restaurants and /restaurants/:id | Search and read restaurant locations |
| /dishes | Search canonical dishes |
| /me/interactions | Record taste actions |
| /me/visits | Record and manage private visit history |
| /recommendations | Generate a recommendation run and return reason codes |
| /recommendations/:id/feedback | Record feedback for a shown item |
| /me/privacy and /me/consents | Manage visibility and purpose-specific consent |

Every endpoint must enforce authentication, ownership, visibility and input validation on the server. Hiding a button in the frontend is not access control.

## 12. Implementation decisions still open

The domain model is defined here; the following implementation choices should be made separately and recorded before backend development:

- Authentication provider and account recovery process.
- PostgreSQL hosting/provider and backup strategy.
- Migration tooling and schema versioning.
- Private object storage for receipt evidence, if receipts are introduced.
- Restaurant catalogue source and update workflow.
- Moderation and manual review process for user submissions.
- Data retention periods for analytics, visits and evidence.
- Exact similarity algorithm and evaluation method.
- Whether any external transaction-data provider is legally and commercially feasible.

The default technical recommendation is a relational PostgreSQL-compatible database with explicit foreign keys and constraints. Start with ordinary relational tables and indexed joins. Add materialized views or derived similarity tables only when measured query needs justify them.

## 13. Build order

1. Freeze this domain model as the shared reference.
2. Review the fields and terminology against actual diner testing.
3. Design SQL migrations and seed data for cities, areas, cuisines, restaurants and locations.
4. Build account, profile, consent and preference records.
5. Build private interactions and visit history.
6. Build recommendation runs and feedback.
7. Add editorial collections and dish-level discovery.
8. Add social relationships and similarity only after privacy controls and enough real activity exist.
9. Add stronger verification only when the user value and operating cost are proven.

**Do not start by adding a graph database, a payment integration or an AI model. Start by recording the right facts with the right ownership, meaning, evidence and privacy.**

---

This model is intended to prevent FoodGraph from drifting back into a restaurant filter. The product's core data should describe people, taste, restaurants, dishes, real dining experiences and the evidence behind them.
