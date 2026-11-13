(function () {
  "use strict";

  const statusBox = document.getElementById("connectionStatus");
  const statusMessage = document.getElementById("connectionMessage");
  const areaFilter = document.getElementById("areaFilter");
  const resultRoot = document.getElementById("catalogueResults");
  const errorBox = document.getElementById("connectionError");
  const areaCount = document.getElementById("areaCount");
  const cuisineCount = document.getElementById("cuisineCount");
  const placeCount = document.getElementById("placeCount");

  let catalogue = null;
  let city = null;

  function setStatus(state, message) {
    statusBox.dataset.state = state;
    statusMessage.textContent = message;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function showError(error) {
    const lines = [
      error && error.name ? error.name : "ConnectionError",
      error && error.status ? "HTTP " + error.status : "",
      error && error.code ? "Code: " + error.code : "",
      error && error.message ? error.message : "The catalogue request failed.",
      error && error.hint ? "Hint: " + error.hint : ""
    ].filter(Boolean);
    errorBox.textContent = lines.join("\n");
    errorBox.hidden = false;
    const empty = makeElement("div", "fg-preview-empty");
    empty.textContent = "The preview could not load the public catalogue. The existing Discover page is unaffected.";
    resultRoot.replaceChildren(empty);
  }

  function renderEmpty() {
    const empty = makeElement("div", "fg-preview-empty");
    empty.append(
      makeElement("h3", "", "No curated public locations yet"),
      makeElement("p", "", "The connection is working, but the selected area currently has no restaurant locations approved for public discovery. Imported catalogue candidates remain private until their source information and records are reviewed. The existing Discover page continues to use its current working catalogue.")
    );
    resultRoot.replaceChildren(empty);
  }

  function renderLocations(locations) {
    placeCount.textContent = locations.length.toLocaleString();
    if (!locations.length) {
      renderEmpty();
      return;
    }

    const grid = makeElement("div", "fg-preview-results");
    locations.forEach((location) => {
      const card = makeElement("article", "fg-preview-place");
      const restaurant = location.restaurant || {};
      const area = location.area || {};
      card.append(
        makeElement("h3", "", restaurant.canonical_name || location.location_name || "Restaurant"),
        makeElement("p", "fg-preview-muted", [area.name, location.address_text].filter(Boolean).join(" · ") || "Address not available")
      );
      const cuisines = Array.isArray(location.restaurant_location_cuisines)
        ? location.restaurant_location_cuisines.map((item) => item.cuisine && item.cuisine.name).filter(Boolean)
        : [];
      if (cuisines.length) {
        const tags = makeElement("div", "fg-preview-tags");
        cuisines.forEach((name) => tags.append(makeElement("span", "fg-preview-tag", name)));
        card.append(tags);
      }
      grid.append(card);
    });
    resultRoot.replaceChildren(grid);
  }

  async function loadLocations() {
    if (!catalogue || !city) return;
    setStatus("loading", "Loading approved locations…");
    errorBox.hidden = true;
    try {
      const locations = await catalogue.listActiveLocations({
        cityId: city.id,
        areaId: areaFilter.value || undefined,
        limit: 100
      });
      renderLocations(locations);
      setStatus("success", "Connected to Supabase · public catalogue read succeeded");
    } catch (error) {
      setStatus("error", "Supabase connection or catalogue query failed");
      showError(error);
    }
  }

  async function initialise() {
    try {
      if (!window.FOODGRAPH_PUBLIC_CONFIG) {
        throw new Error("Missing assets/js/foodgraph-preview-config.js");
      }
      if (!window.FoodGraphCatalogue) {
        throw new Error("The read-only catalogue adapter did not load.");
      }
      catalogue = window.FoodGraphCatalogue.createClient(window.FOODGRAPH_PUBLIC_CONFIG);
      city = await catalogue.getCityBySlug("pune");
      if (!city) throw new Error("The active Pune city record was not returned by the public Data API.");

      const [areas, cuisines] = await Promise.all([
        catalogue.listAreas({ cityId: city.id, limit: 100 }),
        catalogue.listCuisines({ limit: 100 })
      ]);
      areaCount.textContent = areas.length.toLocaleString();
      cuisineCount.textContent = cuisines.length.toLocaleString();

      areas.forEach((area) => {
        const option = document.createElement("option");
        option.value = area.id;
        option.textContent = area.name;
        areaFilter.append(option);
      });
      areaFilter.disabled = false;
      areaFilter.addEventListener("change", loadLocations);
      await loadLocations();
    } catch (error) {
      setStatus("error", "Could not connect to the public catalogue");
      showError(error);
    }
  }

  initialise();
})();
