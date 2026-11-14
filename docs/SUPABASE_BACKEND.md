# Supabase backend foundation

## Current hosted state (verified 12 November 2026)

Project: `foodgraph-prod`  
Project ref: `nylpnvdnbqxhwlxjmboz`  
Region: Mumbai (`ap-south-1`)  
Database: PostgreSQL 17.11  
Plan: Supabase Free

The connected Supabase project was inspected before changes. It had zero public application tables and zero recorded migrations; `pgcrypto` was already installed in the `extensions` schema.

All four migrations are now recorded and applied:

| Version | Migration |
|---|---|
| `20261112165935` | `initial_foodgraph_schema` |
| `20261112171452` | `harden_rls_policy_performance` |
| `20261112174902` | `complete_canonical_schema_fields` |
| `20261112174905` | `grant_scoped_api_privileges` |

The hosted database has 39 application tables and all 39 have Row Level Security enabled. The branch's CI applies the same four migrations to a disposable PostgreSQL 17 Supabase stack and tests the constraints, permissions and importer behavior.

## Hosted catalogue load

The committed source file `restaurants_v6.js` contains 162 rows across 28 areas. The hosted import produced:

| Entity / evidence | Verified rows |
|---|---:|
| Pune city | 1 |
| Areas | 28 |
| Restaurant candidates | 162 |
| Restaurant locations | 162 |
| Cuisines | 47 |
| Location–cuisine links | 443 |
| Catalogue sources | 57 |
| Sources with URL | 56 |
| Explicitly unattributed legacy sources | 1 |
| Rating claims | 155 |
| Legacy price-tier claims | 131 |
| Total catalogue claims | 286 |
| Import-ledger rows | 162 |

All 286 claims are `unreviewed`. All 162 restaurant candidates have status `needs_review`; all 162 locations are `unverified`. Consequently, anonymous visitors currently see the city, areas and cuisine taxonomy, but zero restaurants or locations. No unreviewed candidate is made publicly discoverable by import.

The importer preserves the complete original row and content hash in `catalogue_import_rows`. Available source URLs and evidence labels are retained. Rows without recorded provenance point to one explicitly unattributed legacy-data source. Legacy price tiers remain labelled as prototype tiers; they are not interpreted as INR prices. No addresses, map place IDs, coordinates, source publishers or visit evidence were invented.

**How the hosted load was executed:** the hosted seed was run as one atomic SQL transaction through the connected Supabase database interface. The SQL used the committed importer's UUIDv5 namespace, stable identity rules, source de-duplication, content hashes, claim IDs, conflict handling and import-ledger semantics against the exact tracked `restaurants_v6.js` rows. The Python `scripts/import_restaurants.py --apply` command was not run against the hosted database because no local CLI `DATABASE_URL` session was used. The Python importer remains the maintained repeatable tool; its dry-run, idempotency and rollback behavior are tested in CI.

## Access and privacy boundaries

The grant migration explicitly revokes inherited table privileges from `PUBLIC`, `anon` and `authenticated` before granting back the minimum intended operations.

- Anonymous and signed-in clients can read the curated catalogue tables and published editorial collections. RLS still hides restaurant candidates that are not `active` and locations that are not `active`.
- Signed-in owners may use the explicitly granted profile, privacy, preference, interaction, visit, list, circle, follow/block and feedback operations subject to owner RLS checks.
- Computed taste profiles, similarity snapshots and recommendation runs/items are read-only to clients; trusted backend services write them.
- Catalogue claims, raw import rows, visit evidence, product analytics and early-access signups have no client access policy/grant. Trusted server/service-role operations handle them.
- The `service_role` key must remain server-only and must never be shipped in a browser or mobile client.
- Connection/circle sharing, block-aware feed visibility, public profiles, moderation, evidence storage and recommendation computation are not implemented/enabled by this schema.

The existing `public.rls_auto_enable()` event-trigger function was found before the first migration. Its event trigger remains enabled, but `EXECUTE` was revoked from `PUBLIC`, `anon` and `authenticated`, preventing use as an exposed RPC. Owner RLS predicates use `(select auth.uid())` to avoid per-row re-evaluation.

## Verification

The latest backend CI run passed all workflow steps on branch commit `17a4c7aa3f6151005b786f2f253914865f3f42c7`:

[GitHub Actions run #43273068820](https://github.com/Udayan6611/foodgraph/actions/runs/43273068820)

It passed Python unit/contract tests, local stack startup, all four migrations, 29 pgTAP assertions, and database importer tests for repeatability and transaction rollback.

Post-apply Supabase checks confirmed:

- 39 / 39 application tables have RLS enabled.
- Expected role privileges work: owner preference writes are allowed; anonymous preference reads, client writes to computed taste profiles and anonymous analytics writes are denied; public editorial/catalogue reads work; service-role import writes work.
- Anonymous queries returned 1 city, 28 areas and 47 cuisines, but zero unreviewed restaurants or locations.
- Security advisor reports 10 informational RLS-enabled/no-policy findings for intentionally service-only tables and no warning-level security findings.
- Performance advisor reports 45 unindexed foreign keys and 13 unused indexes (informational; catalogue is newly loaded and usage is low). Review indexing against actual query paths before scale.
- Health advisor reports no findings.

## Repository workflow

The backend lives on `backend/supabase-foundation`, separate from production `main`. The repository does not depend on Supabase GitHub integration. CI uses a disposable local Supabase stack only; it has no hosted project secret and does not change the hosted database.

Local development:

```sh
supabase start
supabase db reset
supabase test db
python -m unittest discover -s tests -v
python scripts/import_restaurants.py
```

The importer is dry-run by default. For an explicitly selected local development database, install `requirements-dev.txt`, set `DATABASE_URL` in your local environment and use:

```sh
python scripts/import_restaurants.py --apply
```

Never place database passwords, access tokens, anon keys or service-role keys in source control or chat. Do not run `supabase db reset --remote`, `--linked` or `--db-url` against the hosted project. The four current migration versions are already applied; do not reapply them manually.

## Current limitations

- The existing GitHub Pages website, Apps Script endpoint and Google Sheets are unchanged. No frontend route, client SDK, app server or production auth flow is connected to Supabase.
- No user accounts, visits, taste interactions or personal records have been seeded.
- Imported restaurant/branch candidates need editorial and operational review before their statuses are promoted to `active`.
- Brand/branch resolution, data freshness workflow, storage buckets, moderation, deletion orchestration, block-aware sharing and actual recommendation computation remain future work.
- No paid service or upgrade was introduced.


## Next client stage

A standalone GET-only browser adapter now lives at `assets/js/foodgraph-catalogue-api.js`. It accepts a runtime project URL and a modern `sb_publishable_` key, exposes city/area/cuisine/active-location reads, and rejects secret or legacy key formats. It contains no write operations and is not loaded into the current Discover page.

See `docs/READ_ONLY_CATALOGUE_API.md` for the query contract and `docs/AUTHENTICATION_DESIGN.md` for the account/session design. No hosted schema changes were required for this code. The Data API's project-level exposure setting and a live HTTP read smoke test remain release gates before wiring a page.


## Read-only client verification status

The standalone client and mocked-fetch tests pass. On commit `57a9ec504da6d4c285c33215e03cc97af4b60d14`, [CI run #43475351185](https://github.com/Udayan6611/foodgraph/actions/runs/43475351185) passed all steps, including Node 22 tests and the full disposable Supabase migration/import suite.

A live HTTPS request to `https://nylpnvdnbqxhwlxjmboz.supabase.co/rest/v1/...` could not be completed from the execution environment because DNS resolution failed before the request reached Supabase. This does not establish whether Data API is enabled or disabled. Check the project's Data API enabled/exposed-schema settings and complete a live GET smoke test from a network with DNS access before loading the adapter in a page.

The adapter remains separate from `discover/index.html`. The hosted catalogue has zero active restaurant locations because every imported location remains unverified; a successful public GET is therefore expected to return zero restaurant rows until curated candidates are activated.


## 14 November 2026 — Main-based Supabase preview integration

The current production baseline is `main` at `bdccf8bf6147ffe22a20974fd9b86af2b0432e93`. The additive integration work is on `enhancement/supabase-discover-preview`, created from that production commit. The original `backend/supabase-foundation` remains an engineering reference and is not merged wholesale.

The two later tracked migration files originally carried local timestamps that differed from the hosted ledger. The hosted `supabase_migrations.schema_migrations` records versions `20261112174902` and `20261112174905`. Their stored SQL statement text was compared with the two tracked files; both SQL bodies match exactly (same character length and MD5 digest). The new enhancement branch therefore names those copies using the applied hosted versions. This is a filename/history reconciliation only; it does not run or reapply migrations.

The integration workflow runs on pushes to the enhancement branch and tests:
- Python importer and migration contracts;
- browser adapter and separate-preview tests;
- all four migrations against a disposable local Supabase stack;
- pgTAP schema/RLS assertions;
- repeatable import and rollback behaviour.

No hosted DDL or data changes are part of this branch setup. Never run a remote reset. Before any future remote migration, inspect the live ledger and require a reviewed migration plan.

## GitHub Pages integration boundary

The preview lives at `/discover-preview/` and uses the existing static hosting model. It loads:
- `assets/js/foodgraph-preview-config.js` — public project URL and publishable key;
- `assets/js/foodgraph-catalogue-api.js` — GET-only API adapter;
- `assets/js/foodgraph-discover-preview.js` — preview UI.

The publishable key is intentionally public; Supabase documents publishable keys as safe in browser code when RLS and grants are correctly configured. The secret/service-role key is never used by the browser. The preview queries the active public Pune catalogue only and displays an empty state while no locations are approved. It makes no writes and has no Auth requirement.

The existing `/discover/`, early-access signup, Apps Script endpoint, Sheets, CNAME, privacy and terms pages are not modified by the preview route. The route is present only on the enhancement branch until its PR is reviewed and approved. Merging the additive route to the current Pages source would publish the new path alongside existing paths; it would not require changing the Pages publishing source or taking the current website offline.

**Live REST/CORS status — passed 14 November 2026:** GitHub Actions from an independent Ubuntu network successfully queried the hosted Supabase Data API with the actual publishable key and adapter. The CORS OPTIONS preflight accepted `https://foodgraph.dpdns.org` and the `apikey` + `accept-profile` headers. Live queries returned 1 Pune city, 28 active areas, 47 cuisines and 0 public active locations. Zero locations is expected because the 162 imported candidates remain unverified. The earlier assistant-container DNS failure was an environment limitation, not a project API failure.


## Enhancement branch CI result — 14 November 2026

[Run #43486922759](https://github.com/Udayan6611/foodgraph/actions/runs/43486922759) passed on code commit `7a040520440e2fd6b535934635d9c245257f33de`. It completed Python and Node tests, started a disposable local Supabase stack, applied the four migrations, passed pgTAP, passed importer idempotency/provenance/rollback checks, and stopped the local stack. The hosted project was not used by this workflow.

The live browser-to-hosted-REST request has not yet been verified. The container's DNS lookup failed before the HTTP request reached the hosted project. Do not treat the CI mocked-fetch tests or SQL grant inspection as a substitute for the real HTTP check.


## Live Data API and browser CORS verification

The enhancement workflow now has a separate `live-api-smoke` job on GitHub Actions. It uses the actual tracked preview configuration and the same GET-only adapter, from the Ubuntu runner, to test the hosted project. It also sends a CORS OPTIONS preflight with the production GitHub Pages origin `https://foodgraph.dpdns.org` and verifies that GET, `apikey` and `accept-profile` are allowed.

The job is strictly read-only (OPTIONS + GET). It verifies active Pune city, non-empty area/cuisine taxonomies and the active-location query. A zero-location result is expected while all imported candidates remain unverified. This CI job exists because the assistant execution environment cannot resolve the Supabase hostname; the runner provides an independent network path.

A passing live smoke job is required before promoting the preview PR out of draft. It does not itself validate every browser/device combination, but the CORS preflight checks the exact production site origin and the headers the browser adapter sends.


## Live API verification result — 14 November 2026

Both live smoke jobs passed:
- [Push run #43579061660](https://github.com/Udayan6611/foodgraph/actions/runs/43579061660)
- [Pull request run #43579065426](https://github.com/Udayan6611/foodgraph/actions/runs/43579065426)

Verified from the GitHub Actions runner:
- production Pages origin CORS preflight accepted;
- active Pune city returned;
- 28 active areas and 47 cuisines returned;
- active-location relation query parsed and returned 0 active public locations as expected;
- no database writes were performed.

The full local validation job passed in both runs as well: Python/Node tests, disposable local Supabase stack, four migrations, pgTAP, importer repeatability/rollback and cleanup. The hosted project was not modified by CI.


## Catalogue completeness audit — 14 November 2026 (read-only)

A read-only query of the hosted rows confirms that the import established candidate identities and taxonomy relationships, but it did not create complete, publication-ready physical location records:

| Field/check | Current result |
|---|---:|
| Restaurant candidates | 162 |
| Location candidates | 162 |
| Location rows linked to an area | 162 |
| Location–cuisine links | 443 |
| Distinct linked cuisines | 47 |
| Location rows with street address | 0 |
| Location rows with latitude + longitude | 0 |
| Location rows with external Maps place ID | 0 |
| Location rows with numeric price range | 0 |
| Parent restaurants with brand name | 0 |
| Parent restaurants with description | 0 |
| Active restaurants / locations | 0 / 0 |
| Rating claims | 155 unreviewed |
| Legacy prototype price-tier claims | 131 unreviewed |
| Claims with observation timestamp | 0 / 286 |
| Claims with validity/expiry timestamp | 0 / 286 |

All 286 claims reference a catalogue source record, but source linkage does not itself prove that the claim is current or accurate. The source catalogue contains 57 rows (56 URL-bearing source records and one explicitly unattributed legacy source). The original prototype's legacy price tier must not be treated as an INR amount.

**Implication:** the 162 rows are candidate restaurant/location identities connected to area and cuisine taxonomy. They are not complete physical-location listings. Do not mass-activate them. The next data task is an automated, source-aware enrichment and QA pass: deduplicate/resolve restaurant vs branch identity, locate current addresses and map place IDs/coordinates from reliable sources, track evidence and observation time, and leave unsupported fields unknown. No manual founder-by-founder review should be required for the mechanical checks; unresolved or ambiguous records remain private until evidence is available.
