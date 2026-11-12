# FoodGraph working state

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

**Build the first backend application boundary without touching the live website.**

1. Define and test read-only catalogue query endpoints for city/area/cuisine/restaurant discovery using the now-hosted schema and existing RLS.
2. Design the Auth sign-up/session flow and test profile bootstrap on a disposable account before enabling any real user onboarding.
3. Add account-owned preferences/interactions/visits only after the UI and consent copy are ready; keep diary and visits private by default.
4. Keep social sharing, blocks/circles and similarity matching disabled until their block-aware policies and consent semantics are implemented and tested.
5. Prototype frontend integration on a separate preview/branch; do not change production Pages, Apps Script, CNAME or `main` without approval.

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
