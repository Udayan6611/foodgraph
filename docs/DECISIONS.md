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

### D-011 — Supabase Free is the leading candidate, not a completed selection
- **Date:** Historical discussion; last recorded 12 Nov 2026
- **Status:** Proposed / provider decision pending
- **Decision:** Evaluate Supabase Free for PostgreSQL, authentication and later storage. Microsoft for Startups/Azure remains an alternative only after eligibility, payment-card exposure, credit expiry and billing risk are understood.
- **Reason:** Operating budget target is ₹0. Free tiers and startup credits have limits and do not guarantee future zero cost.
- **Consequence:** Do not provision paid services or enter billing commitments without explicit approval.

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
