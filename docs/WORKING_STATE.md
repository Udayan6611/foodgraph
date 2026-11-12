# FoodGraph working state

**Last verified:** 12 November 2026 (UTC)  
**Repository:** https://github.com/Udayan6611/foodgraph  
**Production branch:** `main`  
**Documentation baseline:** `docs/project-continuity-2026-11-12` at `a36083851923fcbb91e0d512dfaf88e9cd5e14fa`  
**Backend branch:** `backend/supabase-foundation` (isolated; not merged)  
**Audited main HEAD:** `bdccf8bf6147ffe22a20974fd9b86af2b0432e93` (unchanged at backend branch creation)

## Executive status

FoodGraph is a Pune-first behavioural food discovery network in the building and validation stage. The public GitHub Pages website, early-access signup and browser-based discovery prototype exist. The four-pillar vision is documented. The canonical logical data model exists in `docs/data-model.md`.

The repository now has an isolated first backend foundation on `backend/supabase-foundation`: one versioned PostgreSQL migration, Supabase CLI config, deterministic catalogue importer, unit/pgTAP/integration tests and a CI workflow. These files are committed but are not merged to `main` and have not been applied to the hosted Supabase project. No frontend integration, production auth flow, server-side taste graph or behavioural recommendation service is shipped.

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

## Backend foundation (isolated branch; not deployed)

- Branch: `backend/supabase-foundation`, created from documentation branch HEAD `a36083851923fcbb91e0d512dfaf88e9cd5e14fa`; `main` remains untouched.
- Latest verified branch commit at this documentation update is recorded in the GitHub branch ref; do not infer hosted deployment from a Git commit.
- Added `supabase/config.toml` and migration `20261112090000_initial_foodgraph_schema.sql`. The migration creates 39 domain/ledger tables spanning identity, geography/catalogue/provenance, preferences/interactions, visits/evidence, social, lists/editorial, taste snapshots, recommendations, analytics/signup and import ledger.
- Supabase Auth remains the credential provider; a trigger creates the product-side `users` row. No password is stored in FoodGraph tables.
- RLS is enabled on all application tables. Public read policies are limited to selected catalogue entities and published editorial collections. User records are owner-only/private by default. Consent history is append-only for client access. Analytics, signup, evidence and import-ledger tables have no client policies and are reserved for trusted service-role operations.
- Sharing to connections/circles, block-aware visibility, public profile visibility, moderation, account deletion orchestration and storage buckets remain disabled/deferred pending policy review.
- Importer: `scripts/import_restaurants.py`, dry-run by default, deterministic UUIDv5 keys, parameterized inserts and one transaction. It retains each raw JS row and hash in `catalogue_import_rows`; no external IDs, missing source dates, prices or addresses are invented.
- Audited dataset: 162 rows, 28 areas; 105 rows have six columns and 57 have nine; 57 have source URL/evidence label; no duplicate normalized name+area key was found. Existing dataset is unchanged.
- Tests: Python importer and migration contract tests, pgTAP schema/RLS checks, and CI integration tests for repeated import, field-claim idempotency and transaction rollback. CI failures during initial iterations exposed test assertion and cleanup issues; latest workflow run must be checked before claiming green.
- The migration and importer have not been executed against the hosted database. No hosted schema, migration history or data has been read or changed.

## Architecture

**Current:** static HTML/CSS/vanilla JS on GitHub Pages; JavaScript restaurant catalogue; LocalStorage/SessionStorage; Google Apps Script and Google Sheets for events/signup; Google Maps links; static legal pages. No deployed PostgreSQL database or backend API was found in the repository.

**Target, not implemented:** PostgreSQL-compatible relational model in `docs/data-model.md`; provider-backed authentication; private profiles/preferences/interactions/visits/evidence; lists/editorial collections; auditable recommendation records; explicit consent and Row Level Security; explainable, evidence-aware recommendations with cold-start behavior.

Supabase Free is the historical leading candidate, not a verified provider selection or provisioned service. Microsoft for Startups/Azure remained an alternative subject to eligibility, card/billing risk and a genuinely ₹0 plan. No paid resources without explicit approval.

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

- Supabase Free project was user-reported as created and healthy (project ref `nylpnvdnbqxhwlxjmboz`, Mumbai). This is not independently verified from an account connection.
- Remote schema and migration history have not been inspected; hosted project remains untouched.
- No Supabase CLI login/link or account-level GitHub integration has been verified from this session.
- No account/authentication, RLS policy implementation, server-side taste profile, shared social graph or behavioural recommendation service.
- Catalogue duplicate resolution, branch-vs-brand mapping, freshness and quality checks need specification.
- Exact-HEAD CI and current custom-domain health were not independently verified.
- Current deployed Apps Script version and a fresh signup round trip were not independently checked.
- Product validation evidence is qualitative and partly founder-held; do not invent transcripts, findings or current traction.

## Immediate next engineering task

**Prepare the first isolated, versioned PostgreSQL migration and deterministic Pune catalogue import plan from the canonical model.**

1. Review `docs/data-model.md` sections 9–13 and define the first migration boundary.
2. Confirm provider choice. Supabase Free is the no-cost candidate, not an approved paid commitment; do not attach production.
3. Define stable source IDs and deterministic mapping from catalogue rows to restaurants, locations, areas and cuisines. Preserve provenance and quarantine unresolved rows.
4. Implement migrations/import tooling in an isolated branch only. Do not change production frontend, Apps Script endpoint or `main`.
5. Test on disposable local/test PostgreSQL or an explicitly approved free test project. Verify idempotency, row counts, constraints and rollback before any production connection.

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

- User supplied project ref `nylpnvdnbqxhwlxjmboz`, URL `https://nylpnvdnbqxhwlxjmboz.supabase.co`, region Mumbai, Free plan and Healthy dashboard status.
- No Supabase connector/CLI execution environment is available in this ChatGPT session. No project secrets have been requested or stored.
- Repository does not rely on Supabase GitHub integration. Its connection status could not be inspected; do not assume it is connected.
- Preferred path is local Supabase CLI: `supabase login`, `supabase link --project-ref nylpnvdnbqxhwlxjmboz`, `supabase migration list --remote`, then `supabase db push --dry-run --remote`. Only a separately approved `supabase db push --remote` applies changes.
- Never run remote reset, seed or destructive rollback commands against this project. See `docs/SUPABASE_BACKEND.md`.
