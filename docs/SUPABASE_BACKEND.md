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
