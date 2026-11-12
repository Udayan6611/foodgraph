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
