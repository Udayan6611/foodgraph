# Proposed claim-source corrections — 14 November 2026

**Scope:** four exact rating-claim source reassignments; one hold  
**Hosted writes:** none  
**Publication/verification changes:** none  
**Review-only SQL:** `supabase/proposals/20261114_claim_source_corrections.sql` deliberately ends in `ROLLBACK`.

## Why this proposal exists

A read-only Supabase query identified the exact rating claim IDs and their current shared source rows. Each old District source row is linked to both the rating claim and a `legacy_price_tier` claim. The proposal therefore changes only the `source_id` on the four rating claims; it deliberately leaves the price-tier claim on its current source and preserves its meaning as a non-INR legacy tier.

The current source URL check returned no pre-existing rows for the four proposed URLs. The deterministic source IDs below use the same UUIDv5 namespace and `source:<url>` convention as the existing importer.

## Proposed source reassignment

| Restaurant | Stored rating | Current source label | Proposed source | Evidence basis |
|---|---:|---|---|---|
| Cafe Vanah, Aundh | 4.7 / 1,657 | District | Google Maps | Exact place ID/address and exact rating/count returned by structured Google business lookup. District page currently shows 4.5 / 86. |
| Maratha Samrat, Baner | 4.3 / 8,240 | District | Google Maps | Exact place ID/address and exact rating/count returned by structured Google business lookup. District page currently shows 4.4 / 1,863. |
| Yakii, Deccan Gymkhana | 4.6 / 2,474 | District | Google Maps | Exact place ID/address and exact rating/count returned by structured Google business lookup. District page currently shows 4.5 / 2,442. |
| George Restaurant, Camp | 4.1 / 316 | District | Tripadvisor | Tripadvisor's direct page exactly shows 4.1 / 316. District currently shows 4.1 / 3,528; Google count is much higher. The exact review count disambiguates Tripadvisor. |

### Malaka Spice — deliberately held

The stored value is 4.3 / 1,690 and a structured business lookup matched that exact pair for the Koregaon Park address. However, current Google Hotels listings show 4.3 with about 9.4K reviews, Swiggy Dineout shows 4.3 / 9K, Swiggy delivery shows 4.4 / 2.8K, and District shows 4.7 / 7,089. The exact historical provider/count snapshot is not sufficiently attributable to a canonical current Google record. No source reassignment is proposed for Malaka Spice in this batch.

## Exact source and claim IDs

| Restaurant | Rating claim ID | Old source ID | Proposed source ID |
|---|---|---|---|
| Cafe Vanah | `5d285879-fe5c-5ec0-8bdf-bd5ff5e4087b` | `eb0a5f06-64b1-5005-9864-7df4bd07e5ff` | `9c82a84c-21c6-5e23-a20b-091937f7d0a1` |
| Maratha Samrat - Baner | `e30e3efe-c9a6-5c70-b2aa-f270c56197e3` | `20783e1b-8eaf-5d86-8f85-634a2f84e11c` | `0c39d8a8-531d-5c16-bad9-0d73fbbe3b2e` |
| Yakii | `2baf13b1-8e4c-515b-b9b9-3478602d64d1` | `fa5efe58-0d4d-5ce5-ae4e-4d3d1d1857a3` | `2c577d4f-e9ba-5eb8-b9c7-6788f167dbd8` |
| George Restaurant | `dcbd3f4b-62b9-5ff0-8619-d5992fcb5a32` | `93a5d395-7416-56eb-bf3e-accf7c5070dd` | `35a2bd27-eccd-5fd4-a81c-52eb7dbf1ea6` |

## Exact change semantics

The SQL proposal inserts four new platform source records and changes only the four matching rating claims' `source_id`, guarded by the expected claim ID, old source ID, field key, exact JSON field value and current `unreviewed` status. It does not:

- change any rating or review count;
- change any `legacy_price_tier` claim or convert it into INR;
- change claim verification state, observed timestamp or validity timestamp;
- change restaurant or location status;
- activate a location, publish a record, or modify RLS;
- delete the previous District source rows (they remain linked to the legacy-tier claims and remain available as provider evidence).

The source records capture the provider and URL only. Claims remain `unreviewed` until a separate evidence-review decision is recorded.

## Validation before any hosted apply

1. Confirm the four exact place/source identities and the review counts shown in this proposal.
2. Run the SQL on a disposable local copy first; it must show exactly four rating claims reassigned and then roll the transaction back.
3. Before any hosted apply, re-read the four claim rows and source rows and confirm the expected old IDs and JSON values still match.
4. Require a separate, explicit apply approval. This proposal is not an instruction to commit the transaction.

## Current status

The SQL has **not** been run against hosted Supabase. The only repository changes in this checkpoint are proposal files and project documentation. All affected restaurants remain private/unverified.
