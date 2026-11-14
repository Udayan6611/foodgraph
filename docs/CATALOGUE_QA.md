# Catalogue QA and enrichment

**Status:** Initial read-only hosted audit and evidence sampling completed 14 November 2026. No catalogue rows were changed.

## Purpose

The hosted Pune import is a candidate set, not a publication-ready directory. QA must preserve the difference between a restaurant identity, a physical outlet, a cuisine association, and a sourced field claim. A URL attached to an imported row is a lead for review, not proof that every field on that row came from that URL.

## Verified hosted snapshot

The connected Supabase project was inspected through read-only SQL on 14 November 2026.

| Check | Verified result |
|---|---:|
| Restaurant/location candidates | 162 |
| Location rows with address text | 0 |
| Location rows with both coordinates | 0 |
| Location rows with an external Maps place ID | 0 |
| Location rows with any numeric price bound | 0 |
| Parent restaurant rows with brand name / description | 0 / 0 |
| Active locations | 0 |
| Cuisine links / distinct cuisine names | 443 / 47 |
| Catalogue source rows | 57 |
| Source rows with a URL | 56 |
| Source types (directory / maps / other) | 28 / 25 / 4 (3 of 4 other rows have URLs) |
| Locations with claims / without claims | 160 / 2 |
| Claim-bearing locations with at least one URL / without a URL | 55 / 105 |
| Catalogue claims | 286 |
| Unreviewed rating claims | 155 |
| Unreviewed legacy price-tier claims | 131 |
| Claims with an observation timestamp | 0 |
| Claims with a validity timestamp | 0 |
| Import ledger rows | 162 |

All locations remain unverified, and all parent restaurant rows remain needs_review. The active-only public API returning zero locations is the intended privacy/publication behaviour.

The catalogue source table has 57 source records. Its URL count is not a per-location verified-coverage count: one source may be linked to multiple claims, and the same source metadata is not equivalent to a completed source review. Google Maps search URLs are query pointers, not canonical place IDs.

## Read-only audit utility

Run from a trusted environment with network access to the project's Postgres endpoint. Install the existing development dependency and provide the database URI through the process environment (never in source control):

~~~sh
pip install -r requirements-dev.txt
export DATABASE_URL='postgresql://…'
python scripts/audit_catalogue.py
python scripts/audit_catalogue.py \
  --json-out /tmp/foodgraph-catalogue-audit.json \
  --csv-out /tmp/foodgraph-catalogue-audit.csv
~~~

The script sets the transaction to READ ONLY before querying and only selects from the catalogue, provenance, cuisine and import-ledger tables. It emits:
- a summary of catalogue completeness, claim states and source coverage;
- one CSV row per location with missing-field flags, source URLs, claim counts and the next review action;
- a JSON evidence snapshot containing source/claim/import provenance for reproducibility.

The utility does not call the Data API using an anonymous key, because RLS intentionally hides unverified records from anonymous clients. It does not attempt web scraping, infer addresses or prices, approve claims, change statuses, or activate candidates.

## Initial evidence sampling

These are research observations, not database changes. They illustrate why a single row-level source label is not enough.

| Candidate | Observation | QA treatment |
|---|---|---|
| Cafe Vanah (Aundh) | The imported rating claim is 4.7 with 1,657 reviews, but its linked District page currently displays 4.5 based on 86 ratings and lists 11B, Silver Oak Park, Baner–Aundh Road. A separate Google listing matches 4.7 / 1,657 and the same location. | Rating provider is ambiguous in the imported provenance. Preserve competing provider-specific observations; do not overwrite or average them. |
| Hotel Chul Mutton (Baner) | The linked District listing currently marks dining temporarily closed and gives a Serial 23/6, Aundh/Baner address. A separate Maps listing points to Balewadi High Street, Baner. | Outlet identity, exact address and operating state conflict. Keep private pending branch resolution and current direct evidence. |
| Malaka Spice (Koregaon Park) | The official brand site lists three Pune outlets: Koregaon Park, Kharadi and Baner. It gives the Koregaon Park outlet at Lane No. 5, opposite Oxford Properties, Pune 411001. | Model the brand separately from its outlets; do not turn the brand's general contact details into a branch address. |
| Le Plaisir (Deccan Gymkhana) | District lists Survey 759/125, Prabhat Road, Rajkamal, opposite Kelkar Eye Hospital; a Maps result has a different rating and slightly different landmark wording. | Preserve source-specific rating observations and corroborate the address/branch before writing it to the canonical location. |

## Evidence policy for the next batch

1. Resolve entity identity first: distinguish a restaurant/brand from each physical outlet. Similar names across areas are candidates for review, not automatic merges.
2. For each outlet, require a current, location-specific source for address and operational identity. Prefer the restaurant's own site or verified official channel; use authoritative maps/directory listings as corroboration.
3. Store each observed field as a claim with its own source, provider, observation timestamp and validity policy. A rating from Google is not interchangeable with a rating from District, Zomato or Swiggy.
4. Treat a Google Maps search URL as a lookup pointer only. A canonical place ID, coordinates and address need a confirmed exact outlet.
5. Do not convert legacy tiers 1–4 into INR amounts. Add numeric price fields only from a source that states a real price/cost measure and its basis (for example, per person or for two).
6. Preserve unknown values. Ambiguous, stale, closed, duplicate or unattributed records remain private.
7. Activate only a reviewed batch whose identities, required fields and evidence pass explicit QA. The audit utility itself never activates rows.

## Current blockers

- Physical address, coordinates and canonical Maps place IDs are absent for every imported location.
- The 286 claims lack observation and validity timestamps and remain unreviewed.
- Most legacy rows have no direct URL evidence. Even source-backed rows need field-level review.
- Parent restaurant/brand identity is not yet resolved independently of each imported location.

**Decision:** continue evidence gathering and QA in batches. Do not bulk-activate the 162 candidates and do not treat this audit report as approval to publish any restaurant data.
