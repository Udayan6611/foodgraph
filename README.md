# FoodGraph

**Restaurant recommendations based on your taste, not just ratings.**

FoodGraph is a Pune-first restaurant discovery product built around a simple question:

> **Where do people with my taste actually eat?**

Most restaurant search products optimize for popularity, ratings, reviews, or trends. FoodGraph starts with the user's own preferences and gradually learns from their choices.

**Live:** https://udayan6611.github.io/foodgraph/

---

## The problem

A restaurant can have a 4.7★ rating and still be a bad recommendation for a particular person.

The usual signals answer:

- Is this place popular?
- Is it highly rated?
- What do reviewers think?

FoodGraph is trying to answer a different question:

- **Is this place a good fit for me?**

The first version focuses on four explicit signals:

- Area
- Cuisine
- Budget
- Vibe

Then it adds an early behavioral layer through **Useful / Not for me** feedback.

---

## What the current MVP does

1. The user selects an area, cuisines, budget and vibes.
2. FoodGraph scores the Pune restaurant dataset against those preferences.
3. Results are ranked by profile fit, with rating, popularity and nearby-area context as supporting signals.
4. The user can open a restaurant in Google Maps.
5. The user can mark a recommendation **Useful** or **Not for me**.
6. Those choices are stored locally and influence subsequent rankings.
7. Product events are captured for validation and funnel analysis.
8. Referral links preserve attribution across the session so acquisition sources can be measured.

The goal at this stage is not to pretend the ranking model is finished. The goal is to learn whether **taste-first restaurant discovery is useful enough for people to come back to.**

---

## Why this is different

FoodGraph is not trying to become another restaurant listing site.

The longer-term product direction is a **taste graph** built from multiple consented signals:

**Preferences → choices → repeat behavior → trusted people → better recommendations**

The current MVP deliberately starts without requiring bank or social-account access. Those are future inputs, not prerequisites for using the product.

---

## Current recommendation engine

The MVP uses a transparent scoring model rather than a black-box model.

Signals currently include:

- Cuisine fit
- Area fit and nearby-area relationships
- Budget fit
- Vibe fit
- Restaurant rating
- Popularity
- Local behavioral feedback

Taste fit is intentionally weighted more heavily than generic popularity signals.

The behavioral layer maintains local preference signals for:

- Restaurants
- Cuisines
- Vibes
- Previous feedback

This lets the product begin adapting before there is enough user data for a larger recommendation model.

---

## Product instrumentation

FoodGraph has lightweight first-party event tracking for validating the product funnel.

Tracked events include:

- `page_view`
- `taste_submit`
- `result_view`
- `restaurant_click`
- `feedback`

Events can carry:

- Session ID
- Referral ID
- Source
- Campaign
- Landing path
- Area
- Cuisines
- Vibes
- Budget
- Restaurant
- User action
- Feedback

The current validation setup writes these events to a Google Sheet through Google Apps Script.

No financial-account data is required by the current MVP.

---

## Referral and acquisition layer

FoodGraph supports attribution-aware referral routes such as:

`/r/<referrer>/<source>/<campaign>`

Short referral paths are also available for sharing.

The purpose is simple: when someone discovers FoodGraph through a person, community, or campaign, the product should retain enough attribution to understand what actually drives usage.

---

## Tech stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- GitHub Pages

The product is intentionally lightweight. There is no frontend framework in the current MVP.

### Recommendation layer

- JavaScript scoring engine
- LocalStorage-based behavioral learning
- Pune restaurant dataset
- Preference and contextual scoring

### Data and analytics

- JavaScript event instrumentation
- Google Apps Script
- Google Sheets
- Session and referral attribution

### Product integrations

- Google Maps search links
- GitHub Pages deployment
- GitHub-based version control

---

## Repository structure

```text
foodgraph/
├── index.html              # Product / marketing homepage
├── discover/
│   └── index.html          # Interactive recommendation experience
├── app.js                  # Recommendation, learning and tracking logic
├── restaurants_v6.js       # Pune restaurant dataset
├── styles.css              # Product styling
├── 404.html                # Referral/fallback routing
├── assets/
│   └── foodgraph-mark.svg  # Brand mark
├── growth/                 # Acquisition and outreach material
├── udayan/                 # Founder referral short path
└── brand/                  # Brand referral short path
```

---

## Product architecture

```text
User
  │
  ▼
Taste Input
  │
  ├── Area
  ├── Cuisine
  ├── Budget
  └── Vibe
  │
  ▼
Recommendation Engine
  │
  ├── Taste fit
  ├── Area fit
  ├── Budget fit
  ├── Vibe fit
  ├── Rating
  ├── Popularity
  └── Behavioral signal
  │
  ▼
Ranked Restaurants
  │
  ├── Google Maps
  ├── Useful
  └── Not for me
          │
          ▼
   Local preference learning

Alongside the product:

User → Event Tracking → Validation Data
User → Referral Attribution → Acquisition Learning
```

---

## Roadmap

### Phase 1: Validate the core loop
**Current**

- Pune-first restaurant discovery
- Taste-based ranking
- Useful / Not for me feedback
- Event tracking
- Referral attribution
- Early user and creator outreach

The main question is whether people find the recommendations meaningfully better than generic restaurant search.

### Phase 2: Build a stronger taste graph

- More behavioral signals
- Repeat-choice signals
- Better preference representation
- Restaurant-level and cuisine-level affinity
- More robust ranking and evaluation
- User profiles that improve over time

### Phase 3: Social taste

Introduce trusted human signals:

- Friends
- People with similar taste
- Taste matching
- Shared restaurant history
- Trusted recommendations

The goal is not another follower feed. It is to use the social graph as recommendation context.

### Phase 4: Verified behavior

With explicit user consent and appropriate privacy controls, explore integrations with India's Account Aggregator ecosystem and other legitimate data sources to understand **actual eating behavior**, rather than relying only on stated preferences.

The long-term question:

> **Can FoodGraph learn what you actually eat, who you trust, and what people with similar taste repeatedly choose?**

Financial data is therefore a potential future signal, not part of the current MVP.

---

## What success looks like

The first milestone is not downloads.

It is a user saying:

> "This actually found a place I would have chosen."

Then coming back and using it again.

The product will be judged by behavior:

- Do users complete the taste flow?
- Do they interact with recommendations?
- Which recommendations get rejected?
- Do users return?
- Do referrals produce higher-quality users?
- Does feedback measurably improve the next ranking?

---

## Project status

**Early MVP / active validation**

FoodGraph is being developed and tested in public. The current implementation is intentionally small so product assumptions can be tested before investing in a larger infrastructure or recommendation stack.

---

## Built by

**Udayan Dusane**  
Founder, FoodGraph  
Pune, India

The project is currently maintained as a founder-led product experiment.

---

## Note

FoodGraph is an early product and its recommendation dataset and ranking logic are still evolving. Restaurant information should be independently verified before making decisions based on it.
