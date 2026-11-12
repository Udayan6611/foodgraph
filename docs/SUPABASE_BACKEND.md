# Supabase backend foundation

## Scope and safety

This branch introduces the first versioned PostgreSQL schema and a repeatable Pune catalogue importer. It does not change the static website, the Google Apps Script endpoint, GitHub Pages, or the hosted Supabase database.

The migration creates the canonical domain tables, foreign keys, uniqueness/check constraints, indexes, Supabase Auth linkage and Row Level Security. Catalogue rows are publicly readable where active/appropriate. Personal records default to private and are owner-only in this first pass. Analytics, signups, evidence and import-ledger tables have no client policies and are reserved for trusted server/service-role operations.

Connection/circle sharing, public profile exposure, deletion orchestration, storage buckets, moderation and recommendation computation are intentionally not enabled by this migration. Their policies require block-aware authorization and a separate review. Do not weaken RLS to make a frontend query work.

## Repository setup

Install the Supabase CLI and Docker, then run:

```sh
supabase start
supabase db reset
supabase test db
python -m unittest discover -s tests -v
python scripts/import_restaurants.py
```

The importer is dry-run by default. To write into a local or explicitly selected development database, install `requirements-dev.txt`, set `DATABASE_URL`, and run:

```sh
python scripts/import_restaurants.py --apply
```

It uses deterministic UUIDv5 identities, parameterized SQL and a single database transaction. Re-running it upserts the same catalogue entities and import-ledger rows. Duplicate name-and-area candidates are counted and kept as separate deterministic records; they are not merged. It never creates external place IDs or invents missing addresses, coordinates, source URLs, verification dates or INR prices. Ratings and legacy price tiers are retained as field-level claims. Where the original row has no source URL/evidence label, the claim points to an explicitly unattributed legacy-dataset source and remains `unreviewed`; no publisher is guessed. The legacy price tier is labelled as a prototype tier, not interpreted as rupees. The complete original row is retained in `catalogue_import_rows.raw_row`.

Current source audit: 162 rows; 28 areas; 105 six-column rows; 57 nine-column rows. The 57 extended rows include review count, source URL and evidence label. The 105 shorter rows have no source URL/evidence label. The importer records their attribution as unknown rather than fabricating a publisher. No duplicate normalized name+area pair was found in the current file. If duplicates appear in a future revision, occurrence-aware IDs keep them separate for review.

## Migration and testing

Migrations are ordered timestamped files under `supabase/migrations`. The CI workflow starts an ephemeral local Supabase stack, resets that local database, runs pgTAP schema/RLS tests, imports the catalogue twice, and verifies idempotency and transaction rollback. It never receives a hosted project token or database password.

`supabase db reset` is destructive to the local stack only. Do not use `supabase db reset --remote`, `--linked`, or `--db-url` against the hosted project.

## Hosted project connection

Project ref: `nylpnvdnbqxhwlxjmboz`

The repository does not rely on Supabase GitHub integration. The safest initial path is Supabase CLI with an explicit project ref and a human-controlled preview/apply step. The first remote operation should be read-only inspection of migration history/schema, then a dry-run. Apply only after confirming the project is the new empty `foodgraph-prod` instance and the preview contains only this initial migration.

Use a local terminal:

```sh
supabase login
supabase link --project-ref nylpnvdnbqxhwlxjmboz
supabase migration list --remote
supabase db push --dry-run --remote
```

If the project is confirmed empty and the preview is exactly as expected, apply separately with `supabase db push --remote`. Never put the database password, access token, anon key or service-role key in Git, issue comments or chat. Prefer the CLI's secure prompt and local credential store. If GitHub Actions is later selected, configure a narrowly scoped Supabase access token as a repository/environment secret and gate production migration deployment behind approval. No hosted migration is triggered by this branch.

## Current limitations

- No remote schema or migration history has yet been inspected from this environment.
- The Supabase ChatGPT app is installed, but project authorization/database actions are not yet exposed to this session; no remote read or write has occurred. No CLI session is available here.
- The hosted database has not been modified and no secrets have been requested.
- The initial importer intentionally models each name+area as its own restaurant/location candidate until brand/branch resolution is reviewed.
