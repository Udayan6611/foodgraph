"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

test("Supabase preview is an additive route and does not replace current Discover", () => {
  const page = read("discover-preview/index.html");
  const current = read("discover/index.html");
  assert.match(page, /foodgraph-preview-config\.js/);
  assert.match(page, /foodgraph-catalogue-api\.js/);
  assert.match(page, /foodgraph-discover-preview\.js/);
  assert.match(page, /Current Discover/);
  assert.match(current, /restaurants_v6\.js/);
  assert.match(current, /app\.js/);
  assert.match(current, /No account/);
});

test("preview configuration uses only a browser publishable key", () => {
  const config = read("assets/js/foodgraph-preview-config.js");
  assert.match(config, /https:\/\/nylpnvdnbqxhwlxjmboz\.supabase\.co/);
  const configuredKey = config.match(/publishableKey:\\s*"([^"]+)"/);
  assert.ok(configuredKey, "publishableKey must be configured");
  assert.match(configuredKey[1], /^sb_publishable_[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(configuredKey[1], /sb_secret_|service_role|eyJhbGciOi/);
  assert.doesNotMatch(config, /^\\s*(?:secretKey|serviceRoleKey)\\s*:/m);
});

test("preview client performs read-only catalogue calls and does not expose user writes", () => {
  const client = read("assets/js/foodgraph-catalogue-api.js");
  const preview = read("assets/js/foodgraph-discover-preview.js");
  assert.match(preview, /getCityBySlug/);
  assert.match(preview, /listAreas/);
  assert.match(preview, /listCuisines/);
  assert.match(preview, /listActiveLocations/);
  assert.doesNotMatch(preview, /\.insert\(|\.update\(|\.delete\(/);
  assert.match(client, /method: "GET"/);
  assert.match(client, /apikey: publishableKey/);
  assert.doesNotMatch(client, /Authorization:\s*publishableKey/);
});
