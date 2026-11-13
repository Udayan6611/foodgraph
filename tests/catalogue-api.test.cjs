"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createClient,
  FoodGraphCatalogueApiError
} = require("../assets/js/foodgraph-catalogue-api.js");

const PROJECT_URL = "https://nylpnvdnbqxhwlxjmboz.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_test_public_key";
const CITY_ID = "095284bd-5a0d-5732-bb97-5cf952d34666";
const AREA_ID = "a7d09fa9-d68b-4e9e-bc06-67e6b6b7b7e3";
const LOCATION_ID = "b7d09fa9-d68b-4e9e-bc06-67e6b6b7b7e4";

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  };
}

function fakeFetch(body) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: new URL(url), options });
    return response(body);
  };
  return { calls, fetchImpl };
}

function clientWith(body) {
  const fake = fakeFetch(body);
  return {
    ...fake,
    client: createClient({
      supabaseUrl: PROJECT_URL,
      publishableKey: PUBLISHABLE_KEY,
      fetchImpl: fake.fetchImpl
    })
  };
}

test("requires a publishable key and rejects secret/legacy key formats", () => {
  assert.throws(() => createClient({ supabaseUrl: PROJECT_URL }), /publishable/i);
  assert.throws(() => createClient({
    supabaseUrl: PROJECT_URL,
    publishableKey: "sb_secret_never_in_browser"
  }), /publishable/i);
  assert.throws(() => createClient({
    supabaseUrl: PROJECT_URL,
    publishableKey: "eyJhbGciOiJIUzI1NiJ9.legacy_anon"
  }), /publishable/i);
});

test("rejects non-HTTPS remote endpoints and URLs containing credentials or paths", () => {
  assert.throws(() => createClient({
    supabaseUrl: "http://foodgraph.supabase.co",
    publishableKey: PUBLISHABLE_KEY,
    fetchImpl: async () => response([])
  }), /HTTPS/i);
  assert.throws(() => createClient({
    supabaseUrl: "https://user:pass@foodgraph.supabase.co",
    publishableKey: PUBLISHABLE_KEY,
    fetchImpl: async () => response([])
  }), /origin/i);
  assert.throws(() => createClient({
    supabaseUrl: "https://foodgraph.supabase.co/custom",
    publishableKey: PUBLISHABLE_KEY,
    fetchImpl: async () => response([])
  }), /origin/i);
});

test("getCityBySlug uses a bounded GET request and publishable key headers", async () => {
  const city = { id: CITY_ID, name: "Pune", slug: "pune" };
  const fake = clientWith([city]);
  const result = await fake.client.getCityBySlug("pune");

  assert.deepEqual(result, city);
  assert.equal(fake.calls.length, 1);
  assert.equal(fake.calls[0].url.pathname, "/rest/v1/cities");
  assert.equal(fake.calls[0].url.searchParams.get("slug"), "eq.pune");
  assert.equal(fake.calls[0].url.searchParams.get("status"), "eq.active");
  assert.equal(fake.calls[0].options.method, "GET");
  assert.equal(fake.calls[0].options.headers.apikey, PUBLISHABLE_KEY);
  assert.equal(fake.calls[0].options.headers.Authorization, undefined);
  assert.equal(fake.calls[0].options.credentials, "omit");
  assert.equal(fake.calls[0].options.body, undefined);
});

test("listAreas requires a city UUID and returns only active areas", async () => {
  const fake = clientWith([{ id: AREA_ID, city_id: CITY_ID, name: "Baner", slug: "baner" }]);
  const result = await fake.client.listAreas({ cityId: CITY_ID, limit: 25, offset: 10 });

  assert.equal(result.length, 1);
  const query = fake.calls[0].url.searchParams;
  assert.equal(query.get("city_id"), "eq." + CITY_ID);
  assert.equal(query.get("status"), "eq.active");
  assert.equal(query.get("limit"), "25");
  assert.equal(query.get("offset"), "10");
  await assert.rejects(() => fake.client.listAreas({ cityId: "pune" }), /UUID/i);
});

test("listCuisines is paginated and ordered deterministically", async () => {
  const fake = clientWith([]);
  await fake.client.listCuisines({ limit: 50 });

  const query = fake.calls[0].url.searchParams;
  assert.equal(fake.calls[0].url.pathname, "/rest/v1/cuisines");
  assert.equal(query.get("order"), "name.asc,id.asc");
  assert.equal(query.get("limit"), "50");
});

test("active-location query is gated by active location and restaurant status", async () => {
  const fake = clientWith([]);
  await fake.client.listActiveLocations({ cityId: CITY_ID, areaId: AREA_ID, limit: 20 });

  const query = fake.calls[0].url.searchParams;
  assert.equal(fake.calls[0].url.pathname, "/rest/v1/restaurant_locations");
  assert.equal(query.get("status"), "eq.active");
  assert.equal(query.get("restaurant.status"), "eq.active");
  assert.equal(query.get("city_id"), "eq." + CITY_ID);
  assert.equal(query.get("area_id"), "eq." + AREA_ID);
  assert.match(query.get("select"), /restaurants!inner/);
  assert.match(query.get("select"), /restaurant_location_cuisines/);
  assert.equal(query.get("limit"), "20");
});

test("getActiveLocationById returns the first row or null", async () => {
  const location = { id: LOCATION_ID, location_name: "Example", status: "active" };
  const fake = clientWith([location]);
  assert.deepEqual(await fake.client.getActiveLocationById(LOCATION_ID), location);
  assert.equal(fake.calls[0].url.searchParams.get("id"), "eq." + LOCATION_ID);

  const empty = clientWith([]);
  assert.equal(await empty.client.getActiveLocationById(LOCATION_ID), null);
});

test("all exposed operations are read-only and invalid page sizes are rejected", async () => {
  const fake = clientWith([]);
  assert.equal(typeof fake.client.insert, "undefined");
  assert.equal(typeof fake.client.update, "undefined");
  assert.equal(typeof fake.client.delete, "undefined");
  await assert.rejects(() => fake.client.listCuisines({ limit: 1001 }), /limit/i);
  await assert.rejects(() => fake.client.listCuisines({ offset: -1 }), /offset/i);
});

test("PostgREST errors preserve safe diagnostic fields", async () => {
  const fetchImpl = async () => response({
    code: "42501",
    message: "permission denied for table cuisines",
    hint: "Check the anon SELECT grant."
  }, 403);
  const api = createClient({
    supabaseUrl: PROJECT_URL,
    publishableKey: PUBLISHABLE_KEY,
    fetchImpl
  });

  await assert.rejects(
    () => api.listCuisines(),
    error => {
      assert.ok(error instanceof FoodGraphCatalogueApiError);
      assert.equal(error.status, 403);
      assert.equal(error.code, "42501");
      assert.match(error.hint, /SELECT grant/);
      return true;
    }
  );
});
