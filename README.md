# FoodGraph

**A behavioural food discovery network, starting in Pune.**

FoodGraph is being built around one question:

> **Where do people with dining behaviour similar to mine repeatedly choose to eat?**

The long-term product connects people, restaurants and dishes through actual dining choices, personal taste, trusted relationships and evidence about visits. It should help someone understand not only whether a restaurant is popular, but why that place may suit them.

FoodGraph is currently in the building and validation stage. The website and early-access form are live, and the Discover page is an early rules-based prototype. The complete behavioural food graph described here is the product direction, not a claim about features already shipped.

---

## Product status

**As of 12 November 2026**

| Area | Current state |
|---|---|
| Website | Live on GitHub Pages at [foodgraph.dpdns.org](https://foodgraph.dpdns.org/) |
| Early access | Signup form is live |
| Discover | Accessible early prototype |
| Initial city | Pune |
| Restaurant catalogue | 162 listings across 28 Pune areas |
| Ranking | Transparent, rules-based JavaScript scoring |
| Personal feedback | Useful / Not for me, stored in the current browser |
| Event collection | Google Apps Script writing to a private Google Sheet |
| Signup storage | Separate Signups sheet |
| Product launch | Not publicly launched |
| Shared taste graph | Not implemented |
| Social network and user accounts | Not implemented |
| Server-side behavioural recommendations | Not implemented |
| Visit, receipt or transaction verification | Not implemented |
| Production AI/ML recommendation engine | Not implemented |

The current prototype is useful for testing preference-led discovery. It is not the final product architecture.

### What the current prototype actually does

A visitor chooses an area, cuisines, budget and dining vibe. The browser ranks the Pune restaurant dataset using those inputs and a small feedback signal saved in LocalStorage. The visitor can open a restaurant in Google Maps and mark a result **Useful** or **Not for me**.

The current fit score is a heuristic ranking aid. It is not a probability, an objective restaurant rating or a validated measure of personal taste. Ratings are supporting context. Review counts are displayed where available but are not a popularity score in the current ranking formula. Unknown prices are shown as unverified rather than guessed.

The current browser feedback changes that browser's later rankings. It does **not** train a shared model or change another person's recommendations.

The Events sheet is product analytics, not a dining-history database. Page views, preference submissions, result views, restaurant clicks and feedback events do not prove that someone visited or purchased from a restaurant. The anonymous browser and visit identifiers are not verified user identities.

---

## Product thesis

Restaurant ratings, reviews, social posts and friends' recommendations are useful signals, but none of them alone answers a personal question:

> **What do people who eat like me repeatedly choose?**

FoodGraph should build a more useful answer by combining:

1. **Taste intelligence** — learn what an individual likes through preferences, rankings, dishes, visits and repeat choices.
2. **A social taste network** — connect people whose dining behaviour genuinely overlaps, with sharing controlled by the people involved.
3. **Editorial and contextual discovery** — make local discovery informative and enjoyable through occasion-led guides, dish recommendations, and clear "get / skip" context.
4. **A behavioural food graph** — connect people, restaurants, dishes, visits, opinions and evidence so the other three capabilities reinforce one another.

These are connected product pillars, not three separate apps bundled together.

### Product references

The following products are references for specific product patterns. FoodGraph should learn from those patterns without becoming a clone or claiming that the products are identical.

| Reference | What to study |
|---|---|
| [Beli](https://beliapp.com/) | Personal restaurant history, ranked lists, taste profiles and friend taste comparisons |
| [FavHiker](https://favhiker.com/) | Food diary, taste matching and social discovery around shared preferences |
| [BLR Cuts](https://blrcuts.com/) | Local editorial voice, occasion-based collections, restaurant context and "get / skip" guidance |
| [Zest](https://www.zestapp.com/) | The idea of using real dining behaviour, rather than relying only on public ratings |
| [Clink](https://play.google.com/store/apps/details?id=com.clink.rewards) | Dish-level discovery and social activity around food |

The inspiration is selective:

- **Understand taste** rather than treating every diner as interchangeable.
- **Connect people through meaningful preference overlap**, not follower counts alone.
- **Make discovery helpful and distinctive**, not just a database of names and star ratings.
- **Use behavioural evidence carefully**, and explain what each signal can and cannot prove.

---

## The product experience

### 1. Taste intelligence

FoodGraph should gradually build an individual's food identity. Onboarding selections are only the beginning; the profile should become more accurate as the person uses the product.

The taste profile may include:

- Cuisines, dishes and ingredients the person enjoys.
- Restaurants visited, saved, ranked, liked or skipped.
- Personal restaurant comparisons and notes.
- Typical spend ranges and preferred dining occasions.
- Dining patterns such as exploring new places or returning to familiar favourites.
- Dietary requirements and other user-defined constraints.
- Confidence and recency for each signal.

A personal food diary should be private by default. A person should be able to record an experience without automatically publishing it to friends or the wider network.

### 2. Social taste network

The network should make it possible to discover people whose choices meaningfully overlap with yours.

Potential capabilities:

- Follow friends and food explorers.
- Create trusted circles.
- Compare taste profiles.
- See shared restaurants, dishes and preferences.
- Discover places that similar diners repeatedly choose.
- Choose which visits, lists and opinions are private or shareable.

Similarity must come from meaningful signals, not just two users selecting "Italian" and "Cafe" during onboarding. FoodGraph should be able to explain the overlap behind a match.

A user's complete dining history, private notes and financial information must never become public by default.

### 3. Editorial and contextual discovery

FoodGraph should make it easier to decide where to go and what to expect.

Potential experiences:

- Occasion-led collections such as Date Night, Coffee Run, Group Outing and Quick Bites.
- Neighbourhood guides for Pune.
- Dish-led discovery, such as finding good ramen, misal, biryani or specialty coffee.
- "Get / Skip" guidance with a clear reason.
- What to order, what a place is known for and what may disappoint.
- Community opinions that show agreement and disagreement instead of hiding them in one average score.
- Curated lists that remain useful even when a neighbourhood has a small number of active FoodGraph users.

Editorial recommendations should have provenance. Distinguish founder/editorial guidance from user contributions and verified behaviour. Sponsored placements, if ever introduced, must be clearly labelled and must not silently influence organic fit rankings.

### 4. The behavioural food graph

The graph is the shared foundation that connects the product.

At a conceptual level:

    Person ── has ──> Taste profile
      │                    │
      │                    └── preferences, rankings, patterns
      │
      ├── records ──> Visit ── relates to ──> Restaurant
      │                  │                         │
      │                  └── includes ──> Dish     └── belongs to ──> Area
      │
      ├── shares / follows ──> Person
      │
      └── contributes ──> Opinion, feedback, collection

    Visit ── supported by ──> Evidence
    Similar dining behaviour ──> Taste relationship
    Taste relationships + repeat choices + context ──> Recommendations

The graph should preserve the difference between a preference, an opinion, a visit and a verified purchase. They are different kinds of information and should not be collapsed into one generic "like" event.

---

## Recommendation intelligence

The long-term recommendation question is:

> **Which restaurants and dishes are repeatedly chosen by people whose dining behaviour is similar to this person's, and why?**

A future ranking system may consider:

- Taste similarity across cuisines, dishes and restaurant preferences.
- Visits and repeat choices by similar diners.
- The user's own likes, skips, rankings and saved places.
- Dish-level overlap.
- Social proximity, where the user has chosen to connect.
- Evidence confidence and source quality.
- Recency and frequency, with sensible limits so one unusual burst does not dominate.
- Distance, area, budget, dietary constraints and occasion.
- Editorial context and known trade-offs.

### Eligibility before ranking

Explicit constraints should be handled before soft ranking. For example, a mandatory dietary requirement or a clearly stated maximum budget should not be overridden by a high similarity score. Softer preferences can then influence ordering.

### Cold-start behaviour

FoodGraph must still be useful when a person or neighbourhood has little graph data.

When cross-user evidence is sparse, the product should fall back to the person's own preferences, transparent local restaurant information and curated Pune guides. It must not invent similar diners, repeat visits, social proof or taste-match percentages.

Similarity percentages should only be displayed after the calculation has a defined meaning, enough appropriate data, calibration and validation. Until then, use explainable descriptions of the actual overlap.

### Evidence and verification

Evidence should be attached to the relevant visit or behaviour, with its source and confidence. Different signals have different limitations:

| Signal | What it can support | Limitation |
|---|---|---|
| Self-reported visit | The person says they visited | Not independently verified |
| Location check-in | Evidence that the device was near a place | Presence does not prove a purchase or meal |
| Receipt | Evidence of a purchase at a venue | May not identify who ate, the exact diner or every dish |
| Consent-based transaction data | May support a merchant and transaction-date match | Merchant descriptions can be ambiguous; it may not identify items or individual diners |
| Repeat visits | A pattern of returning over time | A behavioural signal, not a separate verification method |

Repeat behaviour is valuable because choosing a place again can be more informative than a one-time rating. It should still be interpreted alongside feedback, context and evidence quality.

### Financial data is not an MVP requirement

FoodGraph should not require someone to connect a bank account to use the product. Any future transaction-data integration must be opt-in, purpose-limited and reviewed with qualified legal, security and regulated-partner guidance. India's Account Aggregator framework is a possible future route to investigate, not a ready-made permission to collect financial data.

Do not expose spending amounts publicly. If a transaction source is eventually used, the product should collect and retain only what is necessary for the clearly explained feature, with consent withdrawal and deletion processes.

---

## Privacy and trust principles

Trust is part of the product, not a later compliance task.

1. **Private by default.** Personal diaries, rankings, notes and detailed histories remain private unless the user deliberately shares selected information.
2. **Consent before collection and sharing.** Explain what is collected, why it is needed, who can see it and how to withdraw.
3. **Evidence labels.** Make the source and confidence of a visit or recommendation understandable.
4. **Data minimisation.** Collect only what is needed for a defined product purpose.
5. **No public transaction amounts.** Financial data must never be used as a public status signal.
6. **User control.** Provide practical ways to view, correct and delete personal information.
7. **No hidden ranking incentives.** Paid placement must not masquerade as organic recommendation.
8. **Honest product claims.** Never present prototype scoring as production AI, verified behaviour or proven taste similarity.

The current Privacy and Terms pages describe the present website and signup flow. They are operational notices, not a substitute for legal review. They must be revisited before adding accounts, social sharing, visit history, receipts, location collection, payment data or new analytics purposes.

---

## Pune-first product strategy

Pune is the starting market, not a permanent product boundary.

The initial challenge is not acquiring a large number of downloads. It is creating enough useful overlap between active diners, restaurants and dishes in a focused geography.

The early experience should combine:

- A useful Pune restaurant catalogue with transparent data limitations.
- Curated neighbourhood and occasion-based discovery.
- A low-friction way to record visits and food preferences.
- Personal value before asking users to follow friends or invite contacts.
- Gradual social discovery as enough real activity exists.

Do not expand city coverage just to increase listing counts. Improve the quality, freshness and usefulness of a smaller area before expanding further.

---

## Product roadmap

All four pillars belong to the product vision. The sequence below reflects dependencies, not a decision to abandon or remove any pillar.

### Phase 0 — Re-establish the foundation

- Keep the current public prototype stable.
- Define the canonical data model for people, taste profiles, restaurants, dishes, visits, evidence, opinions and connections.
- Separate product analytics from actual dining-history records.
- Specify event names, data ownership, privacy rules and deletion behaviour before collecting new data.
- Establish how a recommendation will explain its evidence and reasoning.

### Phase 1 — A useful individual food product

- Create an evolving personal taste profile.
- Add a private food diary and restaurant history.
- Let people rank or compare restaurants in a way that feels natural.
- Record dishes and meaningful dining experiences.
- Make saved lists and personal discovery useful without requiring a social network.
- Introduce curated Pune guides, occasion-led collections and dish-level discovery.

### Phase 2 — Social taste network

- Add accounts and user-controlled profiles.
- Follow friends and build trusted circles.
- Compare taste profiles with explainable overlap.
- Share selected visits, lists and dishes.
- Make privacy settings understandable at the point of sharing.

### Phase 3 — Server-side behavioural intelligence

- Move canonical user, visit and preference records to a proper backend.
- Build the shared behavioural model from eligible, consented records.
- Calculate similarity using meaningful dining patterns.
- Identify repeated choices among similar diners.
- Add evidence confidence, recency and context to the ranking process.
- Test whether cross-user recommendations actually improve decisions.

### Phase 4 — Stronger verification and data partnerships

- Improve visit and receipt evidence workflows.
- Explore restaurant/POS partnerships where useful.
- Investigate consent-based transaction sources only after legal, security and partner feasibility review.
- Measure whether additional verification improves trust and recommendation quality enough to justify the extra friction.

No phase has a promised launch date. Advancement should depend on product evidence, not a fixed feature checklist.

---

## What success should mean

Downloads, followers and total restaurant rows are not sufficient measures of product value.

| Dimension | Useful question |
|---|---|
| Activation | Can a new person create a useful taste profile and get value quickly? |
| Decision quality | Does FoodGraph help someone choose a place they are glad they visited? |
| Personal relevance | Do recommendations reflect the person's own history and preferences? |
| Behavioural quality | Are similar-diner recommendations supported by enough meaningful evidence? |
| Repeat use | Do people return to record experiences and make another decision? |
| Network quality | Is there enough overlap among active diners to produce useful taste relationships? |
| Trust | Do users understand and control what is private, shared and verified? |
| Editorial usefulness | Do guides help people decide where to go and what to order? |

The most important test is whether FoodGraph makes restaurant decisions meaningfully better than the alternatives a person already uses.

---

## What FoodGraph is not trying to become

- Not another generic restaurant review platform.
- Not a clone of Beli, FavHiker, Zest or BLR Cuts.
- Not a restaurant directory whose main feature is sorting by star rating.
- Not a social feed where engagement matters more than useful discovery.
- Not an AI chatbot with unsupported claims about taste.
- Not a product that requires bank linking to get started.
- Not a national launch before the Pune experience works.
- Not a system that treats an analytics click as proof of a real-world visit.

FoodGraph can coexist with Google Maps, Zomato, restaurant websites and social platforms. Its job is to improve the decision about where a particular person is likely to enjoy eating.

---

## Current technical architecture

The canonical entities, relationships, fields, provenance rules, privacy boundaries and migration map are specified in the [FoodGraph Data Model](docs/data-model.md). This document is the implementation reference for the long-term behavioural food graph; it does not describe features as shipped unless they are explicitly marked as current.

### What runs today

    GitHub Pages
      ├── Homepage (index.html)
      ├── Discover page (discover/index.html)
      │     ├── restaurants_v6.js
      │     └── app.js
      ├── Early-access signup (join/index.html)
      ├── Privacy and Terms pages
      └── Referral routes and shortcuts

    Browser
      ├── Preference selections in LocalStorage
      ├── Personal feedback signal in LocalStorage
      └── Anonymous visitor ID + per-tab visit ID
              │
              └── GET product events ──> Google Apps Script ──> Google Sheets / Events

    Signup form
      └── POST submission ──> Google Apps Script ──> Google Sheets / Signups

| Area | Current implementation |
|---|---|
| Frontend | HTML, CSS and vanilla JavaScript |
| Hosting | GitHub Pages |
| Domain | foodgraph.dpdns.org via CNAME |
| Recommendation code | app.js |
| Restaurant data | restaurants_v6.js |
| Browser state | LocalStorage and SessionStorage |
| Event and signup endpoint | Google Apps Script |
| Early operational storage | Private Google Sheets |
| Map hand-off | Google Maps search links |
| Build tooling | No package installation or build step |

There is currently no application server, account system, canonical user database, social graph store or server-side recommendation service.

The existing visitor ID is a persistent anonymous browser identifier; the visit/session ID is stored per tab. They are useful for basic product analytics but are not verified identity. Do not use them as a substitute for a user account or as proof of dining behaviour.

### Target architecture (conceptual)

The long-term system needs clear separation between product surfaces, canonical dining records, evidence, analytics and recommendation computation.

    Web / Mobile Experience
      ├── Taste profile and private diary
      ├── Social taste network
      ├── Editorial guides and discovery
      └── Restaurant and dish pages
                │
                ▼
    Identity, consent and product APIs
                │
                ├── Profile and preference records
                ├── Visit and dish records
                ├── Evidence and verification records
                ├── Opinions, rankings and feedback
                ├── Social connections and sharing permissions
                └── Editorial collections
                        │
                        ▼
              Behavioural data model
                        │
              Similarity and ranking services
                        │
                        ▼
          Explainable personalised recommendations

This is a product architecture, not a commitment to a particular database or framework. A relational database can represent people, restaurants, visits and relationships effectively in an early version. Do not choose a graph database merely because the product is called FoodGraph. Select storage and infrastructure after the domain model, query patterns, security requirements and expected scale are understood.

The current Apps Script and Sheets setup is adequate for early event collection and signups. It should not become the long-term source of truth for a multi-user behavioural graph.

---

## Repository layout

    foodgraph/
    ├── 404.html                    # Referral capture and fallback routing
    ├── CNAME                       # GitHub Pages custom domain
    ├── docs/
    │   └── data-model.md            # Canonical logical schema and migration reference
    ├── README.md                   # Canonical product vision and technical overview
    ├── app.js                      # Discover ranking, browser feedback and event tracking
    ├── index.html                  # Marketing homepage and homepage events
    ├── styles.css                  # Shared site and discovery styles
    ├── legal.css                   # Shared Privacy / Terms styles
    ├── restaurants_v6.js           # Pune restaurant catalogue (162 entries)
    ├── assets/
    │   └── foodgraph-mark.svg      # Brand mark
    ├── apps-script/
    │   ├── Code.gs                 # Events and signup handlers
    │   └── SETUP.md                # Apps Script deployment and testing instructions
    ├── brand/
    │   └── index.html              # Brand referral shortcut
    ├── discover/
    │   └── index.html              # Preference-led discovery prototype
    ├── join/
    │   └── index.html               # Early-access signup
    ├── privacy/
    │   └── index.html               # Current Privacy Policy
    ├── terms/
    │   └── index.html               # Current Terms of Use
    └── udayan/
        └── index.html               # Founder referral shortcut

The brand and founder shortcuts are intentionally separate because they attribute different referrers and campaigns. The legal stylesheet is separate from the shared site stylesheet. The Apps Script setup guide contains deployment steps that should not be duplicated in full here.

### Current routes

| Route | Purpose |
|---|---|
| / | Homepage |
| /discover/ | Early discovery prototype |
| /join/ | Early-access signup |
| /privacy/ | Privacy Policy |
| /terms/ | Terms of Use |
| /brand/ | Brand referral shortcut |
| /udayan/ | Founder referral shortcut |
| /r/<referrer>/<source>/<campaign> | Referral attribution route |

The fallback handler supports both the custom-domain root and the legacy GitHub Pages project path. The custom domain is the intended public URL.

---

## Product events and signup data

The current event handler writes to the Events sheet. Events currently include:

- visit_start
- page_view
- discover_cta_click
- join_cta_click
- taste_submit
- result_view
- restaurant_click
- feedback
- signup_form_view
- signup_success

The event schema also carries fields such as visitor and visit IDs, referral attribution, landing path, selected area/cuisines/vibes/budget and the displayed result names/scores.

These records describe interactions with the current website. They do not represent a complete dining history and must not be used to claim a person visited a restaurant.

The Signups sheet is separate. The form requires Terms acknowledgement and Privacy Policy acknowledgement; product-update consent is optional and unchecked by default. Keep the spreadsheet private and restrict access.

---

## Local development and deployment

This is a static site. There is no package manager or build step.

1. Clone the repository.
2. Open the folder through a local static-file server so relative routes and browser storage behave as expected.
3. Test the homepage, discovery flow, feedback, signup page, Privacy and Terms pages, and referral shortcuts.
4. Check mobile layouts and browser console errors before publishing.

The main branch is the GitHub Pages production source. Preserve the CNAME, existing web-app URL, Apps Script access settings and referral attribution when making changes.

Before modifying or redeploying Apps Script, read apps-script/SETUP.md. Do not delete or rename the existing Events or Signups sheets. After a Code.gs change, deploy a new version of the existing web app rather than creating a replacement endpoint.

---

## Backend foundation

The isolated `backend/supabase-foundation` branch contains the initial Supabase PostgreSQL migration, private-by-default RLS, a deterministic legacy catalogue importer and disposable-database tests. This is prepared engineering work only: it is not merged to `main` and has not been applied to the hosted Supabase project. See [Supabase backend setup and safety](docs/SUPABASE_BACKEND.md).

## Permanent project documentation

- [Canonical data model](docs/data-model.md): logical PostgreSQL-compatible domain model, privacy boundaries, evidence rules and migration sequence.
- [Working state](docs/WORKING_STATE.md): latest verified repository, implementation, CI/deployment state, blockers and next task. Read this first when resuming work.
- [Decisions](docs/DECISIONS.md): durable product, architecture, privacy and operating decisions with rationale.
- [Changelog](docs/CHANGELOG.md): repository changes and verification evidence; historical claims are distinguished from current verification.

Update `WORKING_STATE.md`, `DECISIONS.md` and `CHANGELOG.md` after every meaningful engineering session. Update this README and `data-model.md` when the actual product or architecture changes.

## Working rules for future changes

- This README is the canonical source of truth for FoodGraph's vision, current status and architecture direction.
- Keep the distinction between **current implementation** and **future product vision** explicit in code, documentation and public claims.
- Do not reduce the product to the current filter prototype.
- Do not add social, verification or financial-data features without the underlying privacy, consent and data model.
- Do not add an AI/ML label to rules-based ranking.
- Do not fabricate visits, social proof, restaurant ratings, taste matches or user feedback.
- Prefer one canonical implementation over copied versions, but do not remove distinct referral, legal or deployment components simply because they are small.
- Keep the current static prototype working while the behavioural product is designed and built in deliberate steps.

---

FoodGraph is being built in Pune. The goal is not to tell everyone where to eat. It is to help each person discover places that make sense for their own taste, experiences and plans.
