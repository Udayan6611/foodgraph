# FoodGraph decisions

**Last reconciled:** 12 November 2026. “Preserve” means an established product constraint. “Proposed” means implementation/provider confirmation is still pending.

## Product identity

### D-001 — FoodGraph is a behavioural food discovery network
- **Date:** 12 Nov 2026 (formalised in current README; concept predates this date)
- **Status:** Preserve
- **Decision:** Build one connected system across taste intelligence, social taste network, editorial/contextual discovery and the behavioural food graph.
- **Reason:** The graph connects the other experiences through people, restaurants, dishes, dining behaviour and evidence. The current filter prototype must not define the full product.
- **Consequence:** Architecture supports all four pillars while delivery remains staged.

### D-002 — Borrow principles, do not clone reference products
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Beli is a reference for taste identity; FavHiker for connecting people through overlapping food diaries; BLR Cuts for editorial/local discovery.
- **Reason:** These solve complementary parts of the experience. FoodGraph's differentiator is the evidence-aware behavioural graph connecting them.
- **Consequence:** Do not build three disconnected clones or position FoodGraph as one of them.

### D-003 — Pune-first validation
- **Date:** Historical; reaffirmed in current README
- **Status:** Preserve
- **Decision:** Begin with diners making real restaurant choices in Pune and a local restaurant catalogue.
- **Reason:** Local relevance and coverage matter more than claiming broad geographic scale before the experience works.
- **Consequence:** Validate whether FoodGraph changes a real restaurant decision and earns repeat use before optimising for vanity reach.

## Evidence, trust and privacy

### D-004 — Preferences, opinions, visits and verified purchases are distinct
- **Date:** 12 Nov 2026 (canonical model)
- **Status:** Preserve
- **Decision:** Store explicit preference, taste interaction, visit claim and verification evidence as separate concepts.
- **Reason:** They have different meanings and confidence.
- **Consequence:** A Maps click is not a visit; self-report is not verified purchase; evidence retains provenance and review state.

### D-005 — Analytics is not dining behaviour
- **Date:** 12 Nov 2026 (canonical model)
- **Status:** Preserve
- **Decision:** Page views, clicks, form submissions and result interactions remain separate from food-graph visits and taste evidence.
- **Reason:** Instrumentation measures product usage, not whether someone dined at a restaurant.
- **Consequence:** Never use event records as visit proof or social proof.

### D-006 — Private by default; sharing is explicit and scoped
- **Date:** 12 Nov 2026 (canonical model)
- **Status:** Preserve
- **Decision:** Personal diary, detailed dining history and notes are private unless explicitly shared under a defined scope.
- **Reason:** A private food diary does not automatically become social data.
- **Consequence:** Enforce access in the data model/backend, not only in UI. Row Level Security is a required design consideration for hosted PostgreSQL.

### D-007 — No invented intelligence
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Never manufacture taste-match percentages, repeat-visit claims, evidence confidence, ratings or recommendation explanations.
- **Reason:** Trust depends on evidence and honest cold-start behavior.
- **Consequence:** Display only signals supported by eligible data; explain uncertainty and sparse data.

### D-008 — Minimise data collection
- **Date:** 12 Nov 2026 (canonical model)
- **Status:** Preserve
- **Decision:** Do not collect continuous location, financial data or receipt images for the first account-based product unless a validated use case and consent/privacy design justify it.
- **Reason:** Reduce risk and complexity while testing core value.
- **Consequence:** No Account Aggregator, payments or receipt pipeline as an assumed MVP dependency.

## Architecture and delivery

### D-009 — Relational source of truth
- **Date:** 12 Nov 2026 (canonical model)
- **Status:** Preserve
- **Decision:** Start with PostgreSQL-compatible relational tables, foreign keys, constraints and indexed joins; derive graph relationships from those records.
- **Reason:** A graph database is not required merely because the product is named FoodGraph.
- **Consequence:** Do not introduce a graph database before a measured need exists.

### D-010 — Preserve the current static prototype as a working entry point
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Retain the HTML/CSS/vanilla-JavaScript website, rules-based discovery, catalogue, signup/tracking integration and referrals while the new foundation is built independently.
- **Reason:** The current surface is useful for validation and production must not be disrupted.
- **Consequence:** Isolate backend/data-model work; no replacement frontend or production migration without approval.

### D-011 — Supabase Free evaluation (superseded)
- **Date:** Historical discussion; superseded on 12 Nov 2026
- **Status:** Superseded by D-017
- **Decision:** Supabase Free was initially evaluated as a candidate; the user subsequently selected and created the Mumbai Free project recorded in D-017.
- **Reason:** Operating budget target is ₹0. Free tiers and startup credits have limits and do not guarantee future zero cost.
- **Consequence:** Continue to avoid paid services or upgrades without explicit approval.

### D-012 — Isolate risky work; protect production main
- **Date:** Historical; reaffirmed 12 Nov 2026
- **Status:** Preserve
- **Decision:** Use isolated feature/documentation branches; keep production `main` and the live GitHub Pages site safe until review/approval.
- **Reason:** Prior redesign experiment showed the cost of changing direction without preserving the actual product.
- **Consequence:** No force-push, reset, merge or redeployment of production as routine work.

### D-013 — Preserve distinct integrations and routes
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Keep the current Apps Script URL, Events and Signups sheets, legal pages, CNAME, referral fallback and separate brand/founder attribution paths unless a reviewed migration safely replaces them.
- **Reason:** Each supports a distinct production or operational purpose.
- **Consequence:** Read `apps-script/SETUP.md` before script changes; do not rename sheets or replace deployment endpoints casually.

## Validation and communication

### D-014 — Validate past behavior and real decisions
- **Date:** Historical validation work; reaffirmed in recovery material
- **Status:** Preserve
- **Decision:** Ask about the last real restaurant-choice problem, current workaround, time/cost and actual behavior. Observe prototype use and whether it changes a real choice.
- **Reason:** “Would you use this?” and signup interest alone are weak evidence.
- **Consequence:** Separate problem evidence, stated interest, prototype usage, changed decisions and repeat use.

### D-015 — Be honest about product stage
- **Date:** Historical; reflected in current README
- **Status:** Preserve
- **Decision:** Describe FoodGraph as building/validating with a live website, signup form and early rules-based prototype; do not call it a launched AI recommendation product.
- **Reason:** Public claims must match shipped capability.
- **Consequence:** No invented customer success, traction, PMF or AI claims.

### D-016 — Treat founder-held qualitative research accurately
- **Date:** Historical conversation
- **Status:** Preserve
- **Decision:** The PDF records the founder's report of 25+ face-to-face conversations but contains no verbatim transcripts. Do not create fabricated transcripts, quotes or quantified findings. Historical Instagram snapshots are not current metrics.
- **Reason:** Evidence integrity.
- **Consequence:** Use only the detail actually available and label founder-reported context.

## Approval boundary

Explicit founder approval is required before changing: product identity/four pillars; production UI/behavior and main deployment; referral attribution; Apps Script endpoint/access and spreadsheet structure; privacy defaults and consent boundaries; collection of sensitive/high-risk data; or any paid service/non-zero recurring commitment.


### D-017 — Supabase project is the selected PostgreSQL host
- **Date:** 12 Nov 2026
- **Status:** Preserve / implemented
- **Decision:** Use the user-created Supabase Free project in Mumbai (ref `nylpnvdnbqxhwlxjmboz`) as FoodGraph's PostgreSQL host.
- **Reason:** The user selected the Free plan and the connected project was verified before migrations.
- **Consequence:** Keep costs at ₹0, do not upgrade or add paid services without approval, and never assume GitHub integration is required.

### D-018 — Private-by-default RLS is the initial access boundary
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Enable RLS across application tables; expose only curated catalogue reads and published editorial content. Personal data is owner-only in the first migration.
- **Reason:** Sharing/follow/block/circle semantics require tested authorization and cannot be safely approximated with broad policies.
- **Consequence:** Connections/circles sharing, public profiles, evidence access and moderation remain disabled until dedicated block-aware policies are implemented and tested.

### D-019 — Catalogue import preserves legacy data and provenance
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Import using deterministic IDs, retain raw source rows and hashes, preserve available URLs/labels, and leave missing provenance unknown.
- **Reason:** Existing prototype rows have heterogeneous shapes and some have no source URL or evidence label.
- **Consequence:** Never infer INR prices from legacy price tiers, invent provider place IDs, or merge similar restaurant names without review. Re-import must be idempotent.

### D-020 — Hosted database changes require explicit staged verification
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Develop/test locally, inspect remote schema/history, preview changes, then obtain explicit approval before applying the first hosted migration.
- **Reason:** Project creation does not prove schema emptiness or deployment integration.
- **Consequence:** The initial four migrations and Pune catalogue load were applied only after the project was verified empty and the user approved the staged work. CI remains local-only. Future remote changes still require staged review and explicit approval.


### D-021 — Computed taste and recommendation artifacts are server-written
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Taste profile snapshots, similarity snapshots and recommendation runs/items are read-only to client roles. Trusted backend services write computed outputs.
- **Reason:** These are versioned projections/evaluation records, not user-authored preferences or raw evidence.
- **Consequence:** Authenticated owners can read only their own permitted outputs. Never expose the service-role key to a browser or mobile app.

### D-022 — RLS predicates use init-plan form for Auth identity
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Use `(select auth.uid())` rather than direct `auth.uid()` in row predicates.
- **Reason:** Supabase's performance advisor reported per-row re-evaluation for direct calls.
- **Consequence:** Keep the wrapper in owner and nested-ownership predicates.

### D-023 — Client SQL grants follow deny-by-default
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Revoke inherited table privileges from `PUBLIC`, `anon` and `authenticated` before restoring only explicit catalogue/editorial reads and owner operations. Server-only tables remain inaccessible to client roles.
- **Reason:** Local and hosted Supabase default ACLs differed; relying on implicit grants could expose private tables or make CI inconsistent.
- **Consequence:** Every future table migration must consciously define grants and RLS. Do not use broad client grants to silence an API permission error.

### D-024 — Imported catalogue candidates are not automatically public
- **Date:** 12 Nov 2026
- **Status:** Preserve
- **Decision:** Import restaurant records as `needs_review`, locations as `unverified` and source claims as `unreviewed`.
- **Reason:** Existing prototype records have variable source quality and incomplete provenance.
- **Consequence:** Public RLS exposes only active curated records. Editorial review and source QA must precede activation.


### D-025 — Build enhancements from live main and preserve production
- **Date:** 14 Nov 2026
- **Status:** Preserve
- **Decision:** Each new enhancement branch starts from the latest production `main`. Existing backend work is selectively ported after review; the backend reference branch is not the default application baseline.
- **Reason:** The GitHub Pages website is a live working prototype and must remain available during incremental backend integration.
- **Consequence:** Add preview routes and capabilities without replacing current production routes. Do not change the Pages publishing source or deploy from a feature branch over production.

### D-026 — Supabase catalogue preview is additive and read-only
- **Date:** 14 Nov 2026
- **Status:** Preserve
- **Decision:** Introduce Supabase first through a separate static `/discover-preview/` route that reads only active public catalogue rows. Keep `/discover/` on the current JavaScript catalogue and ranking until the preview is verified and an explicit switch is approved.
- **Reason:** Supabase currently contains unverified restaurant candidates, while the current prototype must remain usable.
- **Consequence:** Use only the browser publishable key with explicit SQL grants and RLS. Never expose a secret/service-role key. The preview performs no writes and requires no user account.

### D-027 — Optional early-access signup remains distinct from accounts
- **Date:** 14 Nov 2026
- **Status:** Preserve
- **Decision:** The live early-access form remains optional and separate from any future authenticated FoodGraph account. No email/password signup UI is part of the current catalogue integration.
- **Reason:** The current site intentionally supports use without an account.
- **Consequence:** Do not conflate early-access email capture with Supabase Auth or make authentication a dependency for public catalogue discovery.

### D-028 — Catalogue QA must be read-only and field-evidence based
- **Date:** 14 Nov 2026
- **Status:** Preserve
- **Decision:** Candidate enrichment starts with an automated read-only audit. Resolve brand/outlet identity before writing physical-location fields; review each claim against its own source and observation date. Keep uncertain candidates private.
- **Reason:** A URL attached to an imported row does not prove that every imported field came from that source. Ratings vary by provider; maps search URLs are not canonical place IDs; legacy price tiers are not INR prices.
- **Consequence:** Audit tools use a READ ONLY database transaction and export review queues only. No automatic claim approval, mass activation, or conversion of legacy tiers. Public activation remains a separate, explicitly reviewed operation.

### D-029 — Ratings and claims are provider-specific evidence
- **Date:** 14 Nov 2026
- **Status:** Preserve
- **Decision:** Treat each platform's rating and review count as a distinct source claim with its own provider, exact outlet identity, source URL and observation time. If an imported value matches one provider but is attached to another provider's URL, correct the provenance relationship without overwriting the other provider's observation.
- **Reason:** Current source review found several imported values labelled as District ratings that instead match Google, while the linked District pages show different values/counts. Ratings are not universal properties of a restaurant and must not be averaged across platforms.
- **Consequence:** Never infer a source from a close numeric match alone. Resolve the exact outlet/place first, record `observed_at`, and keep contradictory or stale claims separately reviewable. Source review does not itself activate a restaurant.
