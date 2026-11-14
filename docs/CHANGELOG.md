# FoodGraph changelog

This log records changes supported by repository commits or directly verified checks. Conversation claims without repository evidence are labelled historical, not implementation entries.

## 12 November 2026 — Project continuity documentation

- **Branch:** `docs/project-continuity-2026-11-12`, created from audited `main` HEAD `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`.
- **Scope:** Documentation only. No application code, Apps Script, catalogue, GitHub Pages configuration, CNAME or production branch was modified.
- **Added:** `docs/WORKING_STATE.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`.
- **Updated:** `README.md` with links to the four supporting documents and the permanent continuity/update protocol. README update commit: `4fe0e15e1eca51b19e13a3667a7e8be46611612c`.
- **Retained:** Existing `docs/data-model.md` (46 KB canonical logical schema). It already documents entity boundaries, privacy, evidence, analytics separation, migration mapping and build order; it was not duplicated or rewritten.
- **Verification at audit start:** `main` HEAD `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`; repository tree inspected; branch search returned only `main`; targeted redesign branch search returned none.
- **CI:** Latest observed Pages run #112 succeeded on parent commit `8adb9e40db3ae15e8a089ebe30682611db3402bf`. No Actions run was returned for exact audited HEAD `bdccf8b...`; exact-head CI is not claimed as passing.
- **Deployment:** No deployment initiated by this documentation change. No production deployment claim is made.

## Verified repository history before this initialization

| Date (UTC) | Commit | Verified repository change |
|---|---|---|
| 12 Nov 2026 08:42:02 | `bdccf8bf6147ffe22a20974fd9b86af2b0432e93` | Fixed Markdown diagram/code-fence formatting in `docs/data-model.md`. |
| 12 Nov 2026 08:40:59 | `8adb9e40db3ae15e8a089ebe30682611db3402bf` | Tightened constraints in canonical data-model specification. |
| 12 Nov 2026 08:38:44 | `c1c06fe17216fbef7483af1f4d4922e1b70b98d1` | Added canonical FoodGraph logical data model. |
| 12 Nov 2026 08:20:46 | `80ffc4e232199ed9514cc829a905038c6d899ee2` | Updated product vision README and referral routing. |
| 9 Nov 2026 15:08:02 | `41aac17312d3169c644be3e922fe4234ac2eef6d` | Updated restaurant dataset count. |
| 9 Nov 2026 15:07:59 | `5186bf9fac98a923291f222a934cb378bee8b1cc` | Refreshed discovery page dataset. |
| 9 Nov 2026 15:07:37 | `692874f1c3c979e712f261a373dfca62c595eba7` | Expanded Pune restaurant coverage in underserved neighbourhoods. |
| 9 Nov 2026 14:42:55 | `4aacb2f50935ad41e42e5304dbff9e317fa2dda0` | Added signup funnel event tracking. |
| 9 Nov 2026 14:42:51 | `09b34c8f570803ee2121ae04d77051c8f82d8fbe` | Added disclosures for visit/homepage funnel analytics. |

## Historical-only notes

The recovery PDF describes a React redesign experiment, a temporary Vercel preview and subsequent rollback. The current audited repository contains no React/Vite redesign app and no redesign branch. These are historical events, not current implementation.

The PDF also records prior manual signup tests and a founder-reported Apps Script deployment. The current source contains legal-consent validation and signup/event handlers, but the currently deployed Apps Script version and a fresh production round trip were not re-verified in this initialization.


## 12 November 2026 — Isolated Supabase backend foundation

- **Branch:** `backend/supabase-foundation`, created from `docs/project-continuity-2026-11-12` at `a36083851923fcbb91e0d512dfaf88e9cd5e14fa`; not merged to `main`.
- **Added:** `supabase/config.toml`; initial canonical PostgreSQL migration; deterministic `scripts/import_restaurants.py`; Python contract/import/integration tests; pgTAP schema/RLS tests; backend CI workflow; `requirements-dev.txt`; `docs/SUPABASE_BACKEND.md`.
- **Catalogue audit:** 162 rows / 28 areas; row shapes are 105 × 6 columns and 57 × 9 columns; 57 rows carry URL/evidence metadata; no duplicate normalized name+area keys.
- **Safety:** Importer defaults to dry-run. Remote database was not inspected or modified. No app/frontend, Apps Script, Pages or CNAME files changed.
- **CI:** Initial workflow runs failed in the Python contract-test step (incorrect assertions for SQL comments and inline unique constraints; cleanup also attempted to stop a CLI that had not been installed). These were corrected. A new run was observed in progress; final conclusion must be verified before this entry is updated to passing.
- **Hosted Supabase:** No CLI link, account authorization, GitHub integration or remote migration was verified. User-reported project status is not treated as database verification.


- **Importer refinement:** Unattributed six-column rows now create an explicitly unknown-source catalogue source and rating/legacy-tier claims; raw rows and hashes remain preserved. Duplicate name+area candidates use occurrence-aware IDs rather than being collapsed. Integration tests assert claim idempotency and transaction rollback.
- **CI correction:** Initial pgTAP calls selected an ambiguous overload of `has_table`; calls were changed to the single-argument form. A new isolated CI run is pending/in progress; do not claim the complete suite passes until the latest branch-head run succeeds.

- **Database tests expanded:** pgTAP now exercises actual PostgreSQL uniqueness/check constraints and catalogue visibility/RLS; the local CI stack excludes nonessential services to reduce startup overhead. Latest branch-head CI has passed the Python unit/contract step; full database/import integration remains in progress.


## 12 November 2026 — Hosted Supabase migrations, permissions and catalogue initialization

- **Project verified:** `foodgraph-prod`, ref `nylpnvdnbqxhwlxjmboz`, region Mumbai (`ap-south-1`), PostgreSQL 17.11, Supabase Free. Before migration, the public application schema had 0 tables and 0 migration records; `pgcrypto` was already installed.
- **Applied migrations:** `20261112165935_initial_foodgraph_schema`, `20261112171452_harden_rls_policy_performance`, `20261112174902_complete_canonical_schema_fields`, `20261112174905_grant_scoped_api_privileges`.
- **Hosted schema:** 39 application tables, all 39 RLS-enabled.
- **Hosted catalogue:** 1 Pune city; 28 areas; 162 restaurant candidates; 162 locations; 47 cuisines; 443 location-cuisine links; 57 sources (56 distinct URLs and 1 unattributed legacy source); 286 unreviewed claims (155 rating + 131 legacy price-tier claims); 162 imported source-row ledger entries.
- **Review state:** all restaurants are `needs_review`; all locations are `unverified`; all catalogue claims remain `unreviewed`. Anonymous queries can see the city/area/cuisine taxonomy but currently see 0 restaurants and 0 locations. No user accounts or visits were seeded.
- **Import execution:** hosted seed ran as one atomic SQL transaction through the connected Supabase database interface using the committed importer's deterministic UUIDv5 identity, source, claim, digest and ledger rules. The Python importer itself remains the maintained command-line tool; CI tested its repeat-run idempotency and transaction rollback on a disposable PostgreSQL database.
- **Permissions:** explicit deny-by-default table grants, with curated catalogue and published editorial reads restored; private owner operations are RLS-scoped; computed taste/similarity/recommendation records are client-read-only; analytics, signup, evidence, provenance and import internals are service-only. The existing auto-RLS event trigger remains enabled but is no longer callable as a client RPC.
- **CI:** [run #43273068820](https://github.com/Udayan6611/foodgraph/actions/runs/43273068820) passed all 14 steps on exact branch HEAD `17a4c7aa3f6151005b786f2f253914865f3f42c7`, including Python tests, all four migrations, 29 pgTAP assertions, importer idempotency and rollback.
- **Advisors:** 10 informational RLS-enabled/no-policy findings for intentionally service-only tables; no warning-level security findings. Performance advisor reports 45 unindexed foreign keys and 13 unused indexes (informational/follow-up); health advisor has no findings.
- **Production preservation:** `main` remains at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`; backend work is not merged. No website, Pages, CNAME, Apps Script or Google Sheets files were modified.


## 13 November 2026 — Read-only catalogue API and Auth design

- Added a standalone GET-only Supabase Data API adapter at `assets/js/foodgraph-catalogue-api.js`. It requires runtime URL + modern `sb_publishable_` key, validates inputs, filters active restaurants/locations, paginates deterministically and has no mutation methods.
- Added Node tests with mocked fetch for publishable-key validation, HTTPS, read-only requests, query filters, paging and PostgREST errors.
- CI now runs browser adapter tests using Node 22 on the isolated backend branch.
- Added `docs/READ_ONLY_CATALOGUE_API.md` and `docs/AUTHENTICATION_DESIGN.md`.
- No hosted schema/migration/data change, no Auth user/provider/SMTP configuration, no website integration, no Pages/CNAME/Apps Script change and no merge to `main`.
- The adapter is not loaded by Discover: active-only RLS correctly hides all 162 unverified locations until curation promotes them. Project-level Data API exposure and a live HTTP smoke test remain open release gates.


## 13 November 2026 — Read-only catalogue client CI verification

- The initial Node test run caught an incorrect synchronous assertion for an async validation path; changed the test to `assert.rejects`. Workflow cleanup is now guarded on successful local Supabase startup so a skipped CLI setup does not create a secondary cleanup failure.
- Updated the anonymous Data API adapter to send the modern publishable key only in the `apikey` header. It no longer puts a publishable key in `Authorization: Bearer`; that header is reserved for the user's Auth JWT when signed in.
- CI run [#43475351185](https://github.com/Udayan6611/foodgraph/actions/runs/43475351185) passed all steps on commit `57a9ec504da6d4c285c33215e03cc97af4b60d14`: Python tests, Node 22 client tests, four migration chain, pgTAP, importer idempotency/rollback and local stack cleanup.
- Live REST smoke test was attempted but could not resolve the Supabase hostname from this execution environment; no HTTP request reached the project. Project-level Data API enablement/exposed schema and real HTTP response remain unverified.
- No hosted schema/data/Auth setting was changed; no user account was created; current Discover page and production `main` were left unchanged.


## 14 November 2026 — Main-based Supabase preview integration

- Created `enhancement/supabase-discover-preview` from production `main` at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`; the live branch was not moved.
- Reconciled all four tracked migration SQL bodies against `supabase_migrations.schema_migrations`. The last two SQL bodies match the hosted statements exactly; the new branch uses the hosted version identifiers `20261112174902` and `20261112174905`.
- Added an additive `discover-preview/` static route and read-only page controller. Existing `discover/index.html`, `app.js`, `restaurants_v6.js`, early-access signup, Apps Script, Sheets, CNAME and legal routes are not modified.
- Added a public-only browser config with the modern `sb_publishable_` key. No secret/service-role key, Auth flow or mutation API is shipped.
- Updated the Node test workflow to exercise both catalogue-client and preview-page tests on the enhancement branch.
- Hosted Supabase schema/data were not changed. The current 162 locations remain unverified and are not exposed by the public preview.
- Live REST HTTP smoke test remains unverified because DNS resolution failed from the execution environment before any request reached Supabase. The branch's CI and actual preview route need their own verification before merging.


## 14 November 2026 — Enhancement branch CI verification

- CI run [#43486922759](https://github.com/Udayan6611/foodgraph/actions/runs/43486922759) passed on enhancement code commit `7a040520440e2fd6b535934635d9c245257f33de`.
- Verification completed: Python importer/migration contract suite; all 12 Node tests (9 adapter + 3 preview); disposable local Supabase startup; all four migrations; pgTAP schema/RLS tests; repeatable catalogue import; all three importer database integration checks (idempotency, unattributed-provenance/legacy-tier retention, and transaction rollback); stack cleanup.
- The first branch CI attempt exposed a test assertion that incorrectly rejected safety-comment text rather than inspecting the configured key value. The assertion was narrowed to the actual configured key and secret-key fields; the corrected run passed.
- Hosted Supabase was not modified. The live browser-to-hosted-REST HTTP request remains an open check because DNS resolution from the execution environment failed before the request reached the project.


## 14 November 2026 — Live hosted API smoke test added

- Added `scripts/supabase-live-smoke.cjs`, which uses the real read-only adapter and public preview config to query the hosted Supabase Data API from GitHub Actions.
- Added an OPTIONS CORS preflight check for the production GitHub Pages origin `https://foodgraph.dpdns.org`, including the exact `apikey` and `accept-profile` request headers.
- Added an independent `live-api-smoke` CI job. It performs no writes (OPTIONS + GET only), does not require GitHub secrets and does not change hosted database settings.
- Extended workflow path filters so future adapter/script changes trigger validation.
- Result of the new live job is pending; do not treat REST/CORS as verified until that job succeeds.


## 14 November 2026 — Live Supabase REST and CORS verification passed

- [Push CI run #43579061660](https://github.com/Udayan6611/foodgraph/actions/runs/43579061660) and [PR CI run #43579065426](https://github.com/Udayan6611/foodgraph/actions/runs/43579065426) both passed all jobs.
- Live read-only checks from GitHub Actions confirmed the production GitHub Pages origin `https://foodgraph.dpdns.org` passes CORS preflight with the adapter's `apikey` and `accept-profile` headers.
- Hosted API returned Pune, 28 active areas and 47 cuisines. The active restaurant-location query returned 0 public rows, consistent with all 162 imported locations remaining unverified.
- The live query exercised the exact adapter and its PostgREST relationship select. No hosted data or schema was changed.
- The local validation job also passed Python/Node tests, all four migrations on a disposable Supabase stack, pgTAP, importer idempotency and rollback, and cleanup.
- Preview remains isolated and the PR remains draft. No production merge or Pages deployment occurred.


## 14 November 2026 — Hosted catalogue completeness audit (read-only)

- Verified all 162 location candidates have an area link and 443 cuisine links span 47 cuisines.
- Found 0 / 162 locations with address text, coordinate pair, external Maps place ID or numeric price range; 0 / 162 parent restaurants have brand name or description.
- Confirmed 286 claims remain unreviewed (155 rating, 131 legacy price tier); none has observation or validity/expiry timestamp.
- Confirmed 0 active restaurant/location records. The API's empty public location result is therefore the correct RLS behavior, not a connectivity issue.
- No hosted rows, claims, sources, statuses or schema were changed. Next step is source-aware catalogue enrichment/QA, not bulk activation.

## 14 November 2026 — Automated catalogue QA foundation

- Added `scripts/audit_catalogue.py`: explicit PostgreSQL READ ONLY transaction; snapshots restaurant/location identity, physical fields, cuisines, sources, claims and import ledger; computes Unicode-aware duplicate candidates and field-completeness flags; exports JSON and CSV for batch review.
- Added `tests/test_catalogue_qa.py` for Unicode-normalized identity keys, Google Maps search-pointer classification, and review-state prioritisation.
- Added `docs/CATALOGUE_QA.md` with the verified hosted snapshot, execution instructions, evidence rules and initial external source checks.
- Read-only SQL reconfirmed 162 location candidates, zero physical address/coordinate/Maps-ID/price coverage, zero parent brand/description coverage, 443 cuisine links across 47 cuisines, 57 sources (28 directory, 25 Maps, 4 other; 56 URL-bearing), 286 unreviewed claims, no observation/validity timestamps, and zero active locations. Of 160 locations with claims, 55 have a URL on at least one claim and 105 have no URL; 2 locations have no claims.
- External sampling found provider/source discrepancies and unresolved branch identity cases for Cafe Vanah, Hotel Chul Mutton, Malaka Spice and Le Plaisir. These remain research notes; they were not written to the hosted database.
- No hosted data/schema/Auth/Pages or production website change. The QA utility is a report generator only; it cannot activate candidates.
- CI run [#43584157165](https://github.com/Udayan6611/foodgraph/actions/runs/43584157165) passed on QA code head `02ea6aa24be2a725351eec10a93e60b524362330`: all Python/Node fast tests, local Supabase startup, all four migrations, pgTAP schema/RLS tests, repeat-import/idempotency/rollback checks and cleanup; live REST/CORS smoke also passed. An earlier run caught a defaultdict side effect that counted a candidate with no claims as having a claim; switched to non-mutating `.get()` lookups and added a regression assertion.
