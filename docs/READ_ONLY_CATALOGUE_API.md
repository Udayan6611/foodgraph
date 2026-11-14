# Read-only catalogue API

## Scope

`assets/js/foodgraph-catalogue-api.js` is a standalone browser adapter for the Supabase Data API. It is deliberately not loaded by the current Discover page yet. The existing page continues to use `restaurants_v6.js` and the current browser-side ranking code.

The adapter exposes only these read methods:

| Method | Source table | Behavior |
|---|---|---|
| `getCityBySlug(slug)` | `cities` | Returns one active city or `null` |
| `listAreas({cityId, limit, offset})` | `areas` | Returns active areas in stable alphabetical order |
| `listCuisines({limit, offset})` | `cuisines` | Returns the cuisine taxonomy |
| `listActiveLocations({cityId, areaId?, limit, offset})` | `restaurant_locations` | Returns active locations with active parent restaurant, area and cuisine links |
| `getActiveLocationById(id)` | `restaurant_locations` | Returns one active location with its relations or `null` |

The adapter performs GET requests only. It has no insert, update or delete method. It accepts only a modern `sb_publishable_` key; service/secret keys and legacy anon JWT keys are rejected. Anonymous requests send the publishable key only in the `apikey` header. They deliberately omit `Authorization`; when Auth is introduced, that header must carry the user's actual Auth JWT, never the publishable key. The adapter itself contains no key. The isolated preview obtains its public URL and `sb_publishable_` key from a dedicated public configuration file; this key is designed to be visible in a browser and source repository. Never put an `sb_secret_` or service-role key in that file.

## Runtime configuration for a preview

The preview sets its public runtime configuration before loading the adapter. The exact key in the preview configuration is a public browser key, not a secret:

```html
<script>
  window.FOODGRAPH_PUBLIC_CONFIG = {
    supabaseUrl: "https://nylpnvdnbqxhwlxjmboz.supabase.co",
    publishableKey: "sb_publishable_..."
  };
</script>
<script src="/assets/js/foodgraph-catalogue-api.js" defer></script>
```

The publishable key is designed for public clients; it does not replace RLS. It must never be replaced with a secret/service-role key. Keep the actual value out of source control until the preview deployment/configuration method is selected.

A page can construct the adapter with:

```js
const catalogue = FoodGraphCatalogue.createClient(window.FOODGRAPH_PUBLIC_CONFIG);
const city = await catalogue.getCityBySlug("pune");
const areas = await catalogue.listAreas({ cityId: city.id });
const firstPage = await catalogue.listActiveLocations({
  cityId: city.id,
  limit: 100,
  offset: 0
});
```

The UI should show only rows returned by the active-location query. Do not bypass this by querying inactive or unverified records, and do not fall back to an all-row service-role query.

## Separate preview route

`discover-preview/index.html` is an additive, read-only preview route. It loads the dedicated public runtime config, the GET-only adapter and the preview controller. It reads the active Pune city, areas, cuisines and only active restaurant locations. It does not replace or modify `discover/index.html`, create accounts, write user data or change the optional early-access signup. The browser `sb_publishable_` key is intentionally public and is constrained by SQL grants and RLS. No secret/service-role key is present in the frontend.

The preview reports an empty active-location result as a deliberate curation state, not as a reason to expose unreviewed rows.

## Why this is not wired into the current Discover page

The imported 162 location candidates are currently `unverified`, their parent restaurants are `needs_review`, and every claim remains `unreviewed`. RLS intentionally returns zero restaurant locations to anonymous clients at this point. Wiring the current Discover page to this source would turn its working shortlist into an empty page.

Therefore:
- the existing page stays on its current static dataset and rules-based ranking;
- this adapter is available for a separate preview and integration test;
- the Data API HTTP round trip and project-level exposed-schema setting must be verified before wiring a page;
- records must be reviewed and activated through a separate editorial process before public catalogue discovery can use them.

## Data API security boundary

Every browser request uses the publishable key and public schema. SQL grants control whether a table is reachable; RLS controls which rows are returned. Both are required. In October 2026 Supabase completed its change so new public tables are not automatically exposed through Data API grants; keep explicit grants in migrations.

Official references:
- [Supabase Data API](https://supabase.com/docs/guides/api)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Automatic table-exposure change (28 April 2026)](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)

## Verification

`tests/catalogue-api.test.cjs` runs with `node --test` and uses a mocked fetch implementation. It verifies URL construction, RLS filters, paging, publishable-key handling, error propagation and that the exposed client surface contains no write methods.

**Live REST and CORS verification passed on 14 November 2026** from GitHub Actions. The read-only smoke test used the exact browser adapter and public preview configuration:
- CORS OPTIONS preflight accepted the GitHub Pages origin `https://foodgraph.dpdns.org` and the `apikey` + `accept-profile` headers for GET;
- active Pune city query returned Pune;
- active area query returned 28 areas;
- cuisine taxonomy query returned 47 cuisines;
- active restaurant-location query returned 0 public rows, as expected while imported candidates remain unverified.

Both push run [#43579061660](https://github.com/Udayan6611/foodgraph/actions/runs/43579061660) and pull-request run [#43579065426](https://github.com/Udayan6611/foodgraph/actions/runs/43579065426) passed this live job. The requests were OPTIONS + GET only; no hosted data was written. This verifies hosted REST reachability, the adapter's PostgREST relation query, anonymous grants/RLS path, and the CORS preflight for the production site origin. It is not a full visual browser/device acceptance test.
