# FoodGraph working state

**Current checkpoint:** 14 November 2026 (Asia/Kolkata)  
**Production baseline:** `main` at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`  
**Current enhancement branch:** `enhancement/supabase-discover-preview` (created from the production baseline)  
**Backend reference branch:** `backend/supabase-foundation` (not merged wholesale)

## Current checkpoint — verified facts

- The new enhancement branch starts from live `main`; no production commit, Pages setting or live route has been changed.
- The current site remains a static GitHub Pages site. The existing `/discover/` route continues to load `restaurants_v6.js` and `app.js`; the optional early-access signup remains a separate no-account-required flow.
- Supabase project `foodgraph-prod` (ref `nylpnvdnbqxhwlxjmboz`) is `ACTIVE_HEALTHY`, Mumbai, PostgreSQL 17.11.
- The hosted migration ledger contains four versions: `20261112165935`, `20261112171452`, `20261112174902`, `20261112174905`.
- All four tracked migration SQL bodies were compared with their stored hosted statements and matched exactly. The two files with mismatched local timestamps are copied in this enhancement branch under the recorded hosted version names. No migration was re-run.
- Hosted application schema has 39 public tables, all with RLS enabled. Current catalogue facts: 162 restaurants in `needs_review`, 162 locations `unverified`. Anonymous clients must not see these candidates.
- The public preview client uses the project's `sb_publishable_` key only. No secret/service-role key is used in browser code.
- A separate `/discover-preview/` route is being added as a read-only integration preview. It requests active city/areas/cuisines/locations only. The live Discover route and its dataset/ranking code are kept intact.
- The preview does not create accounts, write data, or alter the optional early-access signup.
- Enhancement branch CI [run #43486922759](https://github.com/Udayan6611/foodgraph/actions/runs/43486922759) passed on code commit `7a040520440e2fd6b535934635d9c245257f33de`: 20 fast Python tests (3 DB tests appropriately deferred until the disposable database exists), 12/12 Node tests, disposable local Supabase startup, all four migration applications, pgTAP, and all three database importer tests for repeatability, provenance retention and transaction rollback. Cleanup also passed.
- The assistant execution environment's DNS still cannot resolve Supabase, but this is now superseded for release verification by successful live requests from GitHub Actions. The live API/CORS job and complete local database validation both passed on the latest tested code.
- Read-only hosted catalogue completeness audit: all 162 location rows have an area link and 443 cuisine links span 47 cuisines. However, 0 / 162 have an address, latitude/longitude pair, external Maps place ID or numeric price. 0 / 162 parent restaurants have a brand name or description. All 286 claims remain unreviewed (155 ratings, 131 legacy price tiers); none has `observed_at` or `valid_until`. There are 0 active restaurant/location records. These remain candidate records, not publication-ready location profiles.

## Current delivery guardrails

- Start new enhancements from current `main`, not from `backend/supabase-foundation`.
- Keep production `main`, current Discover, optional signup, Apps Script, Sheets, CNAME and legal routes intact.
- Do not apply hosted migrations as part of the static preview integration.
- Do not enable Auth or introduce email/password signup now.
- Do not activate the imported restaurant candidates in bulk. QA and activation are separate data-governance work.
- Do not merge or deploy until the isolated branch checks and route review pass.

---

**Last verified:** 12 November 2026 (UTC)  
**Repository:** https://github.com/Udayan6611/foodgraph  
**Production branch:** `main`  
**Documentation baseline:** `docs/project-continuity-2026-11-12` at `a36083851923fcbb91e0d512dfaf88e9cd5e14fa`  
**Backend branch:** `backend/supabase-foundation` (isolated; not merged)  
**Audited main HEAD:** `bdccf8bf6147ffe22a20974fd9b86af2b0432e93` (unchanged at backend branch creation)

## Executive status

FoodGraph is a Pune-first behavioural food discovery network in the building and validation stage. The public GitHub Pages website, early-access signup and browser-based discovery prototype exist. The four-pillar vision is documented. The canonical logical data model exists in `docs/data-model.md`.

The repository has an isolated backend foundation on `backend/supabase-foundation`. Its four PostgreSQL migrations are applied to the verified Supabase Free project and the 162-row Pune catalogue is loaded with provenance. The branch is not merged to `main`; the website and Apps Script remain unchanged. No frontend integration, live account flow, social graph service or behavioural recommendation engine is shipped.

The current app is a static HTML/CSS/vanilla-JavaScript website with browser-side rules-based restaurant ranking. It uses a Pune catalogue, browser storage and a Google Apps Script web app connected to Google Sheets for product events and early-access signups.

## Repository and branches

- Default branch: `main`.
- Latest main commit at audit: `bdccf8bf6147ffe22a20974fd9b86af2b0432e93` — “Fix data model markdown diagram formatting” (12 Nov 2026 08:42:02 UTC).
- Preceding model commits: `8adb9e40db3ae15e8a089ebe30682611db3402bf` (“Tighten FoodGraph data model constraints”) and `c1c06fe17216fbef7483af1f4d4922e1b70b98d1` (“Define canonical FoodGraph data model”).
- Branch search returned `main`; targeted search for `redesign` returned no branch. Historical `redesign/2026-premium-rebuild` is absent from the current branch listing.
- Isolated documentation branch `docs/project-continuity-2026-11-12` was created from the audited main HEAD. This branch is for docs only; do not merge without review/approval.

## Verified current implementation

### Website and discovery
- Homepage: `index.html`; shared CSS: `styles.css`; homepage behavior/tracking: `app.js`.
- Discovery: `discover/index.html`; dataset: `restaurants_v6.js`.
- Signup: `join/index.html`.
- Legal: `privacy/index.html`, `terms/index.html`, `legal.css`.
- Referral shortcuts: `brand/index.html`, `udayan/index.html`; fallback: `404.html`; custom domain file: `CNAME`.
- No `package.json`, React/Vite/TypeScript app or app-specific build configuration exists in the audited tree. This is a static site with no package-manager build step.
- README documents 162 listings across 28 Pune areas. Catalogue accuracy/freshness and individual claims still need QA.

The prototype collects area, cuisine, budget and dining vibe, ranks the catalogue using browser-side heuristics, stores a small Useful / Not for me feedback signal in browser storage, and can open a restaurant in Google Maps. Its fit score is not a probability or validated taste measure. It is not a production AI/ML engine.

### Events and signup
- `apps-script/Code.gs` contains `doGet` event collection and `doPost` signup handling.
- Events and Signups are separate sheets. Event fields include visitor/session IDs, referral attribution, selected preferences, result names/scores and actions.
- Signup source validates mandatory legal acknowledgement, records policy version/timestamp, treats product-update consent as optional, normalizes email and checks duplicates under a script lock.
- `apps-script/SETUP.md` says to retain the existing web-app URL and update the existing deployment with a new version after source changes.
- Source confirms the contract; it does not prove the currently deployed Apps Script version or a fresh production round trip.

### Legal and privacy
Privacy Policy and Terms pages exist. Website events are interaction records, not dining visits. Browser feedback is not a shared social taste graph. A Maps click is not a visit; a self-reported visit is not a verified purchase; a private diary is not automatically social data.

## Product direction to preserve

FoodGraph is a behavioural food discovery network, not a restaurant directory, review site, filter-only search tool, clone of reference products or generic AI chatbot.

1. **Taste intelligence:** evolving food identity from preferences and actual dining behaviour, rankings, favourite dishes, cuisines, budget/occasion patterns and a private diary.
2. **Social taste network:** connect diners through overlapping dining behaviour, trusted relationships, shared experiences and explainable taste similarity.
3. **Editorial and contextual discovery:** local guides, occasions, cuisine/dish discovery, GET/SKIP, what to order, who a place suits, caveats and reader contributions. This pillar can create value before the network reaches scale.
4. **Behavioural food graph:** connect people, restaurants/branches, dishes, visits and evidence; support confidence-aware intelligence and personalised discovery.

Beli is a reference for taste identity, FavHiker for connecting people through overlapping diaries, and BLR Cuts for editorial discovery. Borrow principles, not copy products. The current prototype is an entry point, not the product definition.

## Supabase backend foundation (isolated branch; hosted schema initialized)

- Backend branch: `backend/supabase-foundation`. Latest code/migration commit validated by green CI: `17a4c7aa3f6151005b786f2f253914865f3f42c7`; the current branch also has a later documentation-only continuity commit. Production `main` remains at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`; no merge or force-push occurred.
- Four timestamped migrations are committed and applied to the verified Supabase Free project `foodgraph-prod` (ref `nylpnvdnbqxhwlxjmboz`, Mumbai, PostgreSQL 17.11): initial schema, RLS hardening, canonical field completion and scoped API privileges.
- Hosted schema: 39 application tables, all 39 RLS-enabled. The migration history reports all four versions. Existing `pgcrypto` was already installed before the first migration.
- Hosted catalogue: 1 Pune city, 28 areas, 162 restaurant candidates/locations, 47 cuisines, 443 location-cuisine links, 57 sources (56 URLs + 1 unattributed legacy source), 286 unreviewed claims (155 ratings + 131 legacy price tiers), and 162 import-ledger rows.
- All imported restaurants remain `needs_review`; all locations remain `unverified`; all claims remain `unreviewed`. Anonymous checks confirmed zero restaurants/locations visible until review. No users or visits were created.
- Access model: public read grants cover curated catalogue and published editorial tables only; row policies gate restaurant/location activation. Owner data is private and owner-scoped. Computed taste/similarity/recommendation artifacts are read-only to clients. Claims, evidence, raw import records, analytics and signup leads remain service-only.
- Grant hardening begins by revoking inherited table privileges for `PUBLIC`, `anon` and `authenticated`, then grants only the approved operations. The pre-existing `public.rls_auto_enable()` event trigger remains enabled, but its RPC EXECUTE privilege is revoked from client roles.
- Supabase security advisor now has only 10 informational RLS-enabled/no-policy findings for intentionally service-only tables. Performance advisor reports 45 unindexed foreign keys and 13 unused indexes (informational; review later against actual query paths). Health advisor reports no findings.
- Dataset source audit: 162 rows, 28 areas; 105 six-column rows and 57 nine-column rows; 57 rows have URL/evidence metadata; no duplicate normalized name+area keys. One source URL repeats, so the source table stores 56 distinct URLs plus one unattributed legacy source.
- Importer: `scripts/import_restaurants.py` remains dry-run by default, uses deterministic UUIDv5 identities, parameterized writes and one transaction. Hosted seed was executed as one atomic SQL block via the connected Supabase database interface using the same deterministic identity/provenance/upsert semantics on the exact tracked rows. The Python `--apply` command was not used against the hosted database. Its idempotency and rollback behavior passed in CI.
- CI run [#43273068820](https://github.com/Udayan6611/foodgraph/actions/runs/43273068820) passed on the exact branch HEAD. This validates the disposable local stack, all four migrations, 29 pgTAP checks, Python contracts and importer repeatability/rollback. CI has no hosted database credentials.
- The website, Pages deployment, CNAME, Apps Script endpoint and Google Sheets were not changed. The backend branch is not merged. No Supabase GitHub integration is assumed or required.
- Not shipped: website-to-Supabase integration, account UI/session flow, user-generated diary/visit experience, social sharing, block-aware feeds, storage/evidence workflow, editorial tooling, server-side taste profiles or recommendation engine.

## Architecture

**Current:** static HTML/CSS/vanilla JS on GitHub Pages; JavaScript restaurant catalogue; LocalStorage/SessionStorage; Google Apps Script and Google Sheets for events/signup; Google Maps links; static legal pages. No deployed PostgreSQL database or backend API was found in the repository.

**Target, not implemented:** PostgreSQL-compatible relational model in `docs/data-model.md`; provider-backed authentication; private profiles/preferences/interactions/visits/evidence; lists/editorial collections; auditable recommendation records; explicit consent and Row Level Security; explainable, evidence-aware recommendations with cold-start behavior.

Supabase Free is the selected and currently used PostgreSQL host for the backend foundation. No paid resources or plan upgrades have been introduced. Re-check plan limits and costs before adding services.

## CI and deployment

- Latest observed Pages workflow: run **#112**, completed **success**, on commit `8adb9e40db3ae15e8a089ebe30682611db3402bf` (12 Nov 2026 08:42:06 UTC).
- This is not the audited latest main HEAD `bdccf8b...`. An exact-HEAD Actions query returned zero runs; the exact-HEAD status endpoint reported `pending` with no status entries. CI is therefore **not verified for the exact audited HEAD**.
- No checked-in `.github/workflows` file was present in the inspected tree; the observed workflow is GitHub Pages build/deployment.
- Repository metadata identifies `main` as default and `CNAME` exists. A successful Pages run on the preceding commit does not prove the exact latest HEAD is deployed or that the custom domain is healthy now.
- Apps Script deployment is external to GitHub Actions and cannot be inferred from source commits.

## Historical context (not current verification)

The PDF records a React/Vite/Tailwind/Motion redesign, CI runs, a temporary Vercel preview and rollback. The current tree has no React/Vite app and no redesign branch. The PDF also records founder-reported 25+ face-to-face conversations; it contains no verbatim transcripts. Historical Instagram follower/view snapshots are not current metrics. Prior manual signup tests and a reported Apps Script deployment are historical claims; they were not re-tested here.

The PDF's statement that FoodGraph had not publicly launched as a full product and had only a live landing page, signup and rules-based prototype is consistent with the current README and tree.

## Blockers and unresolved questions

- No frontend integration, application server or user sign-in/account experience has been connected to the hosted database.
- Social sharing, block-aware access, public profiles, evidence storage, moderation, deletion orchestration and recommendation computation remain deferred.
- Catalogue entries need brand/branch resolution, source review, freshness checks and an editorial activation process before becoming public.
- Performance advisor reports 45 unindexed foreign keys and 13 unused indexes; review indexes against intended query patterns before scale.
- Current custom-domain health and deployed Apps Script version/fresh signup round trip were not re-tested in this backend session.
- Current deployed Apps Script version and a fresh signup round trip were not independently checked.
- Product validation evidence is qualitative and partly founder-held; do not invent transcripts, findings or current traction.

## Immediate next engineering task

Complete browser-to-hosted-REST connectivity verification for the separate `/discover-preview/` route from a network with working DNS, then review the preview against the existing live flow. The current CI validates the adapter with mocked fetch and the database locally; it is not a live hosted HTTP integration test. Keep account creation, social sharing and write workflows deferred. The current optional early-access signup is not an account flow.

## Must not change without explicit approval

- Do not merge/deploy redesign or replace the production website.
- Do not change main production behavior, Pages source/custom domain, `CNAME`, fallback/referral routing or attribution without review.
- Do not change the Apps Script URL/access settings, replace its endpoint, or rename/delete Events and Signups sheets.
- Do not discard ranking/feedback, catalogue, legal pages, referral shortcuts or layered CSS without proving they are unused and obtaining approval.
- Do not redefine the four pillars or reduce FoodGraph to a directory/filter/review product.
- Do not expose private diaries, default to social sharing, equate analytics with visits, or invent verification/similarity/repeat-visit claims.
- Do not add continuous location, financial-data aggregation, receipts, payments or paid infrastructure as an MVP assumption.
- Keep budget at ₹0 unless the founder approves an expense and billing risk.
- Never claim launch, traction, AI, tests, deployment or customer findings without verification.

## Resume protocol

At each new session: read this file, then relevant sections of `README.md`, `docs/data-model.md` and `docs/DECISIONS.md`; inspect current GitHub branch/HEAD/tree and CI/deployment again. This is a timestamped checkpoint, not a substitute for live verification.


## Supabase project access and deployment boundary

- Verified connected project: `foodgraph-prod`, ref `nylpnvdnbqxhwlxjmboz`, URL `https://nylpnvdnbqxhwlxjmboz.supabase.co`, Mumbai (`ap-south-1`), PostgreSQL 17.11, Supabase Free.
- Four migrations are recorded on the hosted database: `20261112165935`, `20261112171452`, `20261112174902`, `20261112174905`.
- The schema and catalogue seed were applied through the connected Supabase database interface. No database password or service-role key was shared in chat or committed.
- Repository does not depend on Supabase GitHub integration. It was not assumed to be connected; migrations were applied directly and CI remains isolated/local-only.
- Do not rerun/reapply the four current migration files manually. Use additive migrations for future changes, verify locally/CI first, and get explicit approval before later production schema changes or data imports.
- Never run remote reset, remote seed or destructive rollback commands against this project. See `docs/SUPABASE_BACKEND.md`.


## Read-only catalogue client and Auth design checkpoint (13 Nov 2026)

- Current backend branch head before this checkpoint: `bacd6df0bd8cc407c98078024ed237e4c7467c49`. Production `main` remains at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`.
- Verified Supabase project still healthy, PostgreSQL 17.11, 39 public tables, all RLS-enabled, and the same four migrations remain recorded.
- Supabase Auth trigger `auth.users -> public.handle_new_auth_user()` exists and is registered. Auth users, product users, profiles and privacy settings all remain empty. No test user or production Auth setting was changed.
- Added a standalone read-only Data API adapter at `assets/js/foodgraph-catalogue-api.js`. It requires a runtime `sb_publishable_` key and URL, exposes five GET-only reads, uses only active catalogue filters and has no write methods.
- Added mocked-fetch Node tests at `tests/catalogue-api.test.cjs` and added them to isolated backend CI using Node 22. The API adapter is not yet loaded by the current Discover page.
- Added `docs/READ_ONLY_CATALOGUE_API.md` and `docs/AUTHENTICATION_DESIGN.md`. No signup UI, Auth provider, SMTP provider, frontend wiring or hosted database change was made in this step.
- Important current-data behavior: all 162 locations remain unverified and their parent restaurants remain `needs_review`. The active-only Data API adapter therefore returns zero restaurant candidates until a separate review/activation process is completed. It must not bypass RLS or fall back to service-role queries.
- Supabase's current Data API docs distinguish SQL grants from RLS and document an October 2026 change to public-schema exposure defaults. Our explicit grants are present, but the actual project-level Data API exposure setting and a live HTTP REST smoke test still need confirmation before the adapter is wired into a page.
- CI for this new adapter will validate browser-safe configuration, URL construction, GET-only behavior, active filters, pagination and error handling with mocked fetch. The earlier four-migration/29-pgTAP run remains green on code commit `17a4c7aa3f6151005b786f2f253914865f3f42c7`.

## Immediate next step

Verify the hosted Data API REST round trip with the publishable key supplied securely at runtime, then build a separate catalogue-preview page that consumes only active rows. Do not replace the Discover page until curation/activation provides public rows and the preview is accepted. Keep Auth UI separate until email delivery, confirmation/recovery, consent and private-default RLS flows are tested.


## Read-only client CI verification update (13 Nov 2026)

- Latest code/test commit: `57a9ec504da6d4c285c33215e03cc97af4b60d14`.
- CI run [#43475351185](https://github.com/Udayan6611/foodgraph/actions/runs/43475351185) completed **successfully** on that exact commit. Python unit/contract checks, Node 22 adapter tests, disposable Supabase startup, all four migrations, 29 pgTAP assertions, importer idempotency/rollback and stack cleanup all passed.
- The browser adapter sends modern `sb_publishable_` keys only in the `apikey` header for anonymous reads. It deliberately does not send `Authorization: Bearer <publishable-key>`; a signed-in client must use the actual user Auth JWT in that header.
- The live Data API HTTP smoke test remains **unverified**. An external HTTPS request from this execution environment failed at DNS resolution (`Could not resolve host: nylpnvdnbqxhwlxjmboz.supabase.co`) before reaching Supabase. This is an environment connectivity limitation, not evidence that the project's REST endpoint is disabled or broken.
- No Supabase database migration, seed, Auth configuration, user creation, preview deployment or static site change was made during the read-only client work.
- Current branch remains isolated from production `main`. The adapter is not imported by `discover/index.html`.

## Catalogue QA checkpoint — 14 November 2026

- The enhancement PR remains open and draft. Production `main` remains at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`; the isolated preview branch is ahead and has not been merged or deployed.
- CI run [#43584157165](https://github.com/Udayan6611/foodgraph/actions/runs/43584157165) passed on the QA code head `02ea6aa24be2a725351eec10a93e60b524362330`: fast Python/Node tests, Supabase CLI local stack, all four migrations, pgTAP/RLS tests, importer repeatability/idempotency/rollback and cleanup; the live API/CORS smoke test also passed. The preceding run #43583955103 exposed a regression in how the QA summary counted candidates with no claims; `.get()` lookups fixed it and a regression test now passes.
- Added `scripts/audit_catalogue.py`, which reads candidates, claims, sources, cuisine links and import provenance inside an explicit PostgreSQL READ ONLY transaction. It can export a full JSON evidence snapshot and a one-row-per-location CSV.
- Added unit tests for Unicode-aware identity matching, Google Maps search-pointer detection and review-state prioritisation. The script does not create claims, change statuses, activate rows or scrape websites.
- Rechecked hosted data on 14 Nov: 162 locations; 0 addresses, coordinate pairs, Maps place IDs or numeric price ranges; 0 parent brand names/descriptions; 443 cuisine links across 47 cuisines; 57 source records (28 directory, 25 Maps, 4 other; 56 URLs); 286 unreviewed claims (155 ratings, 131 legacy price tiers); no claim observation or validity timestamps; 0 active locations. Of 160 locations with claims, 55 have at least one claim URL and 105 have none; 2 locations have no claims.
- Sampled current public evidence: Cafe Vanah's imported rating is attached to a District URL whose current rating/review count differs from the stored pair, while a separate Google listing matches the stored pair; Hotel Chul Mutton has a current District closure notice and a competing Baner outlet address; Malaka Spice's official site confirms three Pune branches; Le Plaisir has provider-specific rating differences. See `docs/CATALOGUE_QA.md`.
- These are evidence-review findings only. No hosted data, claims, source rows, statuses, schema, Auth, Pages settings, production route or `main` commit was changed.
- Next gate: re-run CI on the audit utility, inspect its exact-head results, and continue branch/field evidence checks. Do not bulk-activate or publish any candidate.
