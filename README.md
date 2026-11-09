# FoodGraph

**Restaurant recommendations based on your taste, not just ratings.**

FoodGraph is a Pune-first restaurant discovery app. People choose an area, cuisines, budget and dining vibe; FoodGraph ranks restaurants against those preferences and learns from local feedback.

## Current product

- Taste-based restaurant discovery for Pune.
- Recommendations use cuisine, area and nearby-area fit, budget, vibe, rating and popularity.
- Users can open a restaurant in Google Maps and mark a recommendation **Useful** or **Not for me**.
- Preference and feedback signals are stored in the browser and influence later recommendations.
- Referral attribution is retained across the session.
- The app does not require an account to use discovery.

## How the app is wired

```text
Browser
  ├── Homepage and discovery UI
  ├── Restaurant dataset and ranking logic
  ├── Local preference / feedback storage
  └── Google Maps links

Browser events ──GET──> Google Apps Script ──> Google Sheets (Events)
Early-access form ─POST─> Google Apps Script ─> Google Sheets (Signups)
```

The current MVP uses a transparent JavaScript scoring model. It does not depend on a separate application server or machine-learning service.

## Technology

| Area | Current implementation |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Recommendation logic | JavaScript in `app.js` |
| Restaurant data | `restaurants_v6.js` |
| Browser persistence | LocalStorage |
| Event tracking and signup endpoint | Google Apps Script |
| Data storage | Google Sheets |
| Maps | Google Maps search links |
| Hosting | GitHub Pages |
| Custom domain | `foodgraph.dpdns.org`, configured through `CNAME` |

## Repository layout

```text
foodgraph/
├── index.html                 # Homepage
├── styles.css                 # Shared visual styles
├── app.js                     # Discovery, ranking, feedback and tracking
├── restaurants_v6.js          # Pune restaurant dataset
├── discover/
│   └── index.html             # Recommendation experience
├── join/
│   └── index.html             # Early-access signup
├── apps-script/
│   ├── Code.gs                # Events and signup web-app handlers
│   └── SETUP.md               # Existing Apps Script deployment notes
├── assets/
│   └── foodgraph-mark.svg     # Brand mark
├── brand/
│   └── index.html             # Brand referral shortcut
├── udayan/
│   └── index.html             # Founder referral shortcut
├── 404.html                   # GitHub Pages referral / fallback routing
├── CNAME                      # Custom-domain configuration
└── README.md
```

## Routes and referral links

- `/` — homepage
- `/discover/` — restaurant discovery
- `/join/` — early-access signup
- `/r/<referrer>/<source>/<campaign>` — referral attribution route
- `/brand/` and `/udayan/` — short referral links

The referral shortcuts and fallback page are kept because they support the existing attribution flow.

## Apps Script and Sheets

The deployed web app uses the existing endpoint already referenced in the frontend.

- `doGet` receives product events and appends them to the `Events` sheet.
- `doPost` validates early-access submissions and appends them to the separate `Signups` sheet.
- Signup submissions include name, email, optional area, consent choice and referral/session attribution.
- Duplicate email submissions are checked before a new row is added.
- The spreadsheet should remain private. The public website only needs access to the deployed web-app endpoint.

See [apps-script/SETUP.md](apps-script/SETUP.md) before changing or redeploying the Apps Script project. Preserve the existing web-app URL and deployment access settings.

## Hosting and deployment

The current site is a static GitHub Pages project; there is no Vercel build or frontend framework in the production app.

- The repository's `main` branch is the production source.
- `CNAME` holds the custom domain.
- `404.html` handles referral and fallback paths.
- Keep the existing domain and GitHub Pages configuration intact when making frontend changes.

## Privacy and legal follow-up

The repository currently contains no standalone Privacy Policy or Terms page. The app does collect browser-based preference/feedback signals, product events and early-access signup details. Before expanding public collection, add clear privacy and terms pages covering the data collected, purpose, retention, deletion/contact process and user choices. The signup consent checkbox alone should not be treated as a complete legal policy.

## Local development

This is a static site; open `index.html` through a local static-file server to test routes and browser storage. No package installation or build step is currently required.

---

FoodGraph is an early product. Restaurant listings and details can change and should be verified before visiting.
