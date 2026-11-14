"use strict";

// Live, read-only smoke test for the exact browser adapter and GitHub Pages origin.
// Uses the public publishable key from the tracked preview config. Never logs the key.
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("../assets/js/foodgraph-catalogue-api.js");

const ROOT = path.resolve(__dirname, "..");
const configSource = fs.readFileSync(
  path.join(ROOT, "assets/js/foodgraph-preview-config.js"),
  "utf8"
);

function readConfig(name) {
  const match = configSource.match(new RegExp(name + ':\\s*"([^"]+)"'));
  if (!match) throw new Error("Missing " + name + " in public preview configuration.");
  return match[1];
}

function requireCorsHeader(response, name, expectedValues) {
  const actual = (response.headers.get(name) || "").toLowerCase();
  if (!expectedValues.some(value => actual.includes(value.toLowerCase()))) {
    throw new Error("CORS preflight did not allow " + name + "; received: " + (actual || "<missing>"));
  }
}

async function main() {
  const supabaseUrl = readConfig("supabaseUrl");
  const publishableKey = readConfig("publishableKey");
  const siteOrigin = "https://foodgraph.dpdns.org";
  const client = createClient({ supabaseUrl, publishableKey });
  const timeout = AbortSignal.timeout(20000);

  // Browser fetch sends a preflight because apikey and Accept-Profile are
  // non-simple request headers. Verify the actual GitHub Pages origin.
  const preflight = await fetch(new URL("/rest/v1/cities", supabaseUrl), {
    method: "OPTIONS",
    headers: {
      Origin: siteOrigin,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "apikey,accept-profile"
    },
    signal: timeout
  });

  if (!preflight.ok) {
    throw new Error("CORS preflight failed with HTTP " + preflight.status);
  }
  requireCorsHeader(preflight, "access-control-allow-origin", ["*", siteOrigin]);
  requireCorsHeader(preflight, "access-control-allow-methods", ["get"]);
  requireCorsHeader(preflight, "access-control-allow-headers", ["apikey"]);
  requireCorsHeader(preflight, "access-control-allow-headers", ["accept-profile"]);
  console.log("PASS: CORS preflight allows " + siteOrigin + " to make catalogue GET requests.");

  const city = await client.getCityBySlug("pune", { signal: timeout });
  if (!city || city.name !== "Pune") {
    throw new Error("Expected an active Pune city row; received none or an unexpected city.");
  }

  const [areas, cuisines, locations] = await Promise.all([
    client.listAreas({ cityId: city.id, limit: 100, signal: timeout }),
    client.listCuisines({ limit: 100, signal: timeout }),
    client.listActiveLocations({ cityId: city.id, limit: 100, signal: timeout })
  ]);

  if (areas.length === 0) throw new Error("Pune query returned no active areas.");
  if (cuisines.length === 0) throw new Error("Cuisine taxonomy query returned no rows.");
  for (const location of locations) {
    if (!location.restaurant || location.restaurant.status !== "active") {
      throw new Error("Active-location query returned a location without an active parent restaurant.");
    }
  }

  console.log("PASS: live city query returned " + city.name + ".");
  console.log("PASS: live taxonomy queries returned " + areas.length + " active areas and " + cuisines.length + " cuisines.");
  console.log("PASS: active location query returned " + locations.length + " public rows.");
  console.log("NOTE: zero locations is expected until catalogue candidates are reviewed and activated.");
}

main().catch(error => {
  console.error("LIVE SUPABASE SMOKE TEST FAILED");
  console.error(error && error.message ? error.message : String(error));
  process.exitCode = 1;
});
