/* FoodGraph read-only Supabase Data API client.
 * No key is stored here. Supply a public sb_publishable_... key at runtime.
 * This adapter exposes GET-only catalogue reads; writes/auth belong to separate modules.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.FoodGraphCatalogue = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DEFAULT_LIMIT = 100;
  const MAX_LIMIT = 1000;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const LOCATION_SELECT = [
    "id",
    "restaurant_id",
    "city_id",
    "area_id",
    "location_name",
    "address_text",
    "latitude",
    "longitude",
    "price_min",
    "price_max",
    "restaurant:restaurants!inner(id,canonical_name,brand_name,description,status)",
    "area:areas(id,name,slug)",
    "restaurant_location_cuisines(cuisine_id,is_primary,cuisine:cuisines(id,name,slug))"
  ].join(",");

  class FoodGraphCatalogueApiError extends Error {
    constructor(message, details) {
      super(message);
      this.name = "FoodGraphCatalogueApiError";
      this.status = details && details.status;
      this.code = details && details.code;
      this.hint = details && details.hint;
      this.details = details && details.details;
    }
  }

  function requireSlug(value, label) {
    if (typeof value !== "string" || !SLUG_PATTERN.test(value)) {
      throw new TypeError(label + " must be a lowercase URL slug");
    }
    return value;
  }

  function requireUuid(value, label) {
    if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
      throw new TypeError(label + " must be a UUID");
    }
    return value;
  }

  function pagination(limit, offset) {
    const safeLimit = limit === undefined ? DEFAULT_LIMIT : limit;
    const safeOffset = offset === undefined ? 0 : offset;
    if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > MAX_LIMIT) {
      throw new RangeError("limit must be an integer between 1 and " + MAX_LIMIT);
    }
    if (!Number.isInteger(safeOffset) || safeOffset < 0) {
      throw new RangeError("offset must be a non-negative integer");
    }
    return { limit: String(safeLimit), offset: String(safeOffset) };
  }

  function parseErrorBody(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return { message: "The catalogue API returned a non-JSON error." };
    }
  }

  function createClient(options) {
    const settings = options || {};
    if (typeof settings.supabaseUrl !== "string" || !settings.supabaseUrl.trim()) {
      throw new TypeError("supabaseUrl is required");
    }
    if (typeof settings.publishableKey !== "string" ||
        !settings.publishableKey.startsWith("sb_publishable_")) {
      throw new TypeError("A Supabase sb_publishable_ key is required; secret and legacy keys are not accepted.");
    }

    const baseUrl = new URL(settings.supabaseUrl);
    const localHost = baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";
    if (baseUrl.protocol !== "https:" && !(localHost && baseUrl.protocol === "http:")) {
      throw new TypeError("Supabase URL must use HTTPS (HTTP is allowed only for localhost tests).");
    }
    if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash ||
        (baseUrl.pathname !== "/" && baseUrl.pathname !== "")) {
      throw new TypeError("supabaseUrl must be the project origin without a path, query or credentials.");
    }

    const fetchImpl = settings.fetchImpl ||
      (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (typeof fetchImpl !== "function") {
      throw new TypeError("A Fetch implementation is required.");
    }

    const origin = baseUrl.origin;
    const publishableKey = settings.publishableKey;

    async function getRows(table, query, signal) {
      const url = new URL("/rest/v1/" + table, origin);
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      });

      const response = await fetchImpl(url.toString(), {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Accept: "application/json",
          "Accept-Profile": "public"
        },
        credentials: "omit",
        cache: "no-store",
        signal
      });

      const raw = await response.text();
      const body = raw ? (response.ok ? JSON.parse(raw) : parseErrorBody(raw)) : null;
      if (!response.ok) {
        const message = body && typeof body.message === "string"
          ? body.message
          : "Catalogue request failed with HTTP " + response.status;
        throw new FoodGraphCatalogueApiError(message, {
          status: response.status,
          code: body && body.code,
          hint: body && body.hint,
          details: body && body.details
        });
      }
      if (!Array.isArray(body)) {
        throw new FoodGraphCatalogueApiError("Catalogue API returned an unexpected response shape.", {
          status: response.status
        });
      }
      return body;
    }

    function pageOptions(options) {
      const opts = options || {};
      return { ...pagination(opts.limit, opts.offset), signal: opts.signal };
    }

    return Object.freeze({
      getCityBySlug: async function (slug, opts) {
        const page = pageOptions({ limit: 1, offset: 0, signal: opts && opts.signal });
        const rows = await getRows("cities", {
          select: "id,name,state_code,country_code,slug",
          slug: "eq." + requireSlug(slug, "slug"),
          status: "eq.active",
          limit: page.limit
        }, page.signal);
        return rows[0] || null;
      },

      listAreas: async function (options) {
        const opts = options || {};
        const page = pageOptions(opts);
        return getRows("areas", {
          select: "id,city_id,name,slug,parent_area_id",
          city_id: "eq." + requireUuid(opts.cityId, "cityId"),
          status: "eq.active",
          order: "name.asc,id.asc",
          limit: page.limit,
          offset: page.offset
        }, page.signal);
      },

      listCuisines: async function (options) {
        const opts = options || {};
        const page = pageOptions(opts);
        return getRows("cuisines", {
          select: "id,name,slug,parent_cuisine_id",
          order: "name.asc,id.asc",
          limit: page.limit,
          offset: page.offset
        }, page.signal);
      },

      listActiveLocations: async function (options) {
        const opts = options || {};
        const page = pageOptions(opts);
        const query = {
          select: LOCATION_SELECT,
          city_id: "eq." + requireUuid(opts.cityId, "cityId"),
          status: "eq.active",
          "restaurant.status": "eq.active",
          order: "location_name.asc,id.asc",
          limit: page.limit,
          offset: page.offset
        };
        if (opts.areaId !== undefined && opts.areaId !== null) {
          query.area_id = "eq." + requireUuid(opts.areaId, "areaId");
        }
        return getRows("restaurant_locations", query, page.signal);
      },

      getActiveLocationById: async function (id, opts) {
        const page = pageOptions({ limit: 1, offset: 0, signal: opts && opts.signal });
        const rows = await getRows("restaurant_locations", {
          select: LOCATION_SELECT,
          id: "eq." + requireUuid(id, "id"),
          status: "eq.active",
          "restaurant.status": "eq.active",
          limit: page.limit
        }, page.signal);
        return rows[0] || null;
      }
    });
  }

  return Object.freeze({
    createClient,
    FoodGraphCatalogueApiError
  });
});
