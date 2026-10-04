
// Free serverless analytics endpoint. Leave blank until Google Apps Script is deployed.
// Paste the SAME /exec URL that is already working in your current GitHub app.js.
const TRACKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJTL_UKuih_3e7Lr71s0XdV24VoNY5qhjfdfZeBA1wyJRPr8dHP_GQR3hBJRSiRz1d4w/exec';
const REFERRAL = new URLSearchParams(window.location.search).get('ref') || '';
const SESSION_ID = (() => {
  const key = 'foodgraph_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : 'fg-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    localStorage.setItem(key, id);
  }
  return id;
})();

function track(event, extra={}) {
  if (!TRACKING_ENDPOINT) return;
  const params = new URLSearchParams({
    event,
    session_id: SESSION_ID,
    ref: REFERRAL,
    ...extra
  });
  // Image GET avoids CORS requirements. We do not read the response.
  const beacon = new Image();
  beacon.src = TRACKING_ENDPOINT + '?' + params.toString();
}

track('page_view', {ref: REFERRAL});

const cuisines = ['Japanese','Korean','Indian','Italian','Cafés','Vegetarian','Biryani','Sushi'];
const vibes = ['Popular with diners','Established spot','Café','Restaurant','Date night','Casual','Specialty coffee'];

const cuisineEl = document.getElementById('cuisines');
const vibesEl = document.getElementById('vibes');
const selected = {cuisines:new Set(), vibes:new Set()};

function makeChips(el, items, key){
  items.forEach(item=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='chip';
    b.textContent=item;
    b.onclick=()=>{
      if(selected[key].has(item)){
        selected[key].delete(item);
        b.classList.remove('selected');
      } else {
        selected[key].add(item);
        b.classList.add('selected');
      }
    };
    el.appendChild(b);
  });
}
makeChips(cuisineEl,cuisines,'cuisines');
makeChips(vibesEl,vibes,'vibes');

const price=document.getElementById('price');
const priceText=document.getElementById('priceText');
const labels=['₹300–500','₹500–800','₹800–1,500','₹1,500+'];
function updatePrice(){priceText.textContent=labels[Number(price.value)-1]}
updatePrice();
price.oninput=updatePrice;

const restaurants = [
  {
    "name": "Koji",
    "area": "Sangamvadi",
    "cuisines": [
      "Japanese",
      "Asian"
    ],
    "category": "Asian restaurant",
    "rating": 4.7,
    "reviews": 1194,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 4,
    "vibes": []
  },
  {
    "name": "Ukiyo",
    "area": "Airport Road / Viman Nagar",
    "cuisines": [
      "Japanese",
      "Sushi"
    ],
    "category": "Japanese restaurant",
    "rating": 4.6,
    "reviews": 297,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 4,
    "vibes": []
  },
  {
    "name": "Ginkgo Pune",
    "area": "Kothrud",
    "cuisines": [
      "Japanese",
      "Korean",
      "Asian"
    ],
    "category": "Japanese restaurant",
    "rating": 4.4,
    "reviews": 1013,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "Iya's Korean Kitchen - Pashan",
    "area": "Pashan",
    "cuisines": [
      "Korean"
    ],
    "category": "Korean restaurant",
    "rating": 4.1,
    "reviews": 1153,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "Iya’s Korean Kitchen - Koregaon Park",
    "area": "Koregaon Park",
    "cuisines": [
      "Korean"
    ],
    "category": "Restaurant",
    "rating": 4.6,
    "reviews": 75,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "KINI (끼니)",
    "area": "Koregaon Park",
    "cuisines": [
      "Korean"
    ],
    "category": "Korean restaurant",
    "rating": 4.3,
    "reviews": 627,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "The Ramen Station",
    "area": "Kharadi",
    "cuisines": [
      "Korean",
      "Japanese"
    ],
    "category": "Korean restaurant",
    "rating": 4.8,
    "reviews": 990,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "Sushi Tokyo",
    "area": "Katraj",
    "cuisines": [
      "Japanese",
      "Sushi"
    ],
    "category": "Japanese restaurant",
    "rating": 4.9,
    "reviews": 66,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "CAFE FLYING GYPSY'S",
    "area": "Shivajinagar",
    "cuisines": [
      "Cafés"
    ],
    "category": "Coffee shop",
    "rating": 4.5,
    "reviews": 1531,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "Vohuman Cafe",
    "area": "Sangamvadi",
    "cuisines": [
      "Cafés",
      "Indian"
    ],
    "category": "Cafe",
    "rating": 4.3,
    "reviews": 15298,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 1,
    "vibes": []
  },
  {
    "name": "CAFE BLACK CAT & WOLF",
    "area": "Deccan Gymkhana",
    "cuisines": [
      "Cafés"
    ],
    "category": "Cafe",
    "rating": 4.7,
    "reviews": 472,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "Krushnakala Pure Veg Family Restaurant",
    "area": "Rasta Peth",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Vegetarian restaurant",
    "rating": 4.7,
    "reviews": 1850,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "World Of Veg",
    "area": "Shivajinagar",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Vegetarian restaurant",
    "rating": 4.1,
    "reviews": 6341,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 2,
    "vibes": []
  },
  {
    "name": "Santé Spa Cuisine",
    "area": "Koregaon Park",
    "cuisines": [
      "Vegetarian",
      "Cafés"
    ],
    "category": "Vegetarian restaurant",
    "rating": 4.5,
    "reviews": 3839,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "Pune Biryani House",
    "area": "Lohegaon",
    "cuisines": [
      "Biryani",
      "Indian"
    ],
    "category": "Restaurant",
    "rating": 4.7,
    "reviews": 369,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 1,
    "vibes": []
  },
  {
    "name": "Degchi Biryani",
    "area": "Wadgaon Sheri / Chandan Nagar",
    "cuisines": [
      "Biryani",
      "Indian"
    ],
    "category": "Biryani restaurant",
    "rating": 4.6,
    "reviews": 1295,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 1,
    "vibes": []
  },
  {
    "name": "SP's Biryani House Since 1994",
    "area": "Sadashiv Peth",
    "cuisines": [
      "Biryani",
      "Indian"
    ],
    "category": "Biryani restaurant",
    "rating": 3.9,
    "reviews": 16422,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 1,
    "vibes": []
  },
  {
    "name": "Sorriso",
    "area": "Mundhwa / Koregaon Park Annexe",
    "cuisines": [
      "Italian"
    ],
    "category": "Italian restaurant",
    "rating": 4.5,
    "reviews": 537,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "Toscano Pune Koregaon Park",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian"
    ],
    "category": "Italian restaurant",
    "rating": 4.4,
    "reviews": 2256,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "Donna Cucina",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Italian"
    ],
    "category": "Italian restaurant",
    "rating": 4.3,
    "reviews": 1011,
    "source": "Live Pune business result • 2026-10-03",
    "priceTier": 3,
    "vibes": []
  },
  {
    "name": "Cafe - The Voyage",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Italian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": 4.7,
    "reviews": 1303,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Dhaba Shaba Indian Veg Bistro",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": 4.6,
    "reviews": 4126,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "TSUKI : Asian Restaurant",
    "area": "Koregaon Park",
    "cuisines": [
      "Japanese",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": 4.6,
    "reviews": 1105,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Savya Rasa",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": 4.5,
    "reviews": 4014,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Malaka Spice",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Asian",
      "Japanese"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "The Flour Works",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Italian",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Vaishali",
    "area": "FC Road",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Shabree",
    "area": "Deccan Gymkhana",
    "cuisines": [
      "Indian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Goodluck Cafe",
    "area": "FC Road",
    "cuisines": [
      "Cafés",
      "Indian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Masu",
    "area": "Baner",
    "cuisines": [
      "Japanese",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Toast & Tonic",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Cafe Peter",
    "area": "Viman Nagar",
    "cuisines": [
      "Korean",
      "Japanese",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Mirchi & Mime",
    "area": "Baner",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Deccan Harvest",
    "area": "Deccan",
    "cuisines": [
      "Indian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Cafe Madeline",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "The Sassy Spoon",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Pimlico",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Thyme & Whisk",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Chafa Cafe",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Matcha Brew & Bake",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Japanese",
      "Sushi"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Boteco - Tapas Bar & Grill",
    "area": "Koregaon Park",
    "cuisines": [
      "Asian",
      "Indian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Whispering Bamboo - Blue Diamond",
    "area": "Koregaon Park",
    "cuisines": [
      "Asian",
      "Japanese"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Independence Brewing Company",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Italian",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Cafe Goa",
    "area": "Viman Nagar",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Nincasa - House Of Brews",
    "area": "Hadapsar",
    "cuisines": [
      "Asian",
      "Indian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Al Di La",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 4,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Farro",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": 4.6,
    "reviews": 260,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Wah Punjab",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": 4.7,
    "reviews": 153,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "BIRYANI BOY OG DUM BIRYANI",
    "area": "Koregaon Park",
    "cuisines": [
      "Biryani",
      "Indian"
    ],
    "category": "Restaurant",
    "rating": 4.9,
    "reviews": 60,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Raaha Cafe",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Bookbar",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "The Beans Talk Cafe",
    "area": "Viman Nagar",
    "cuisines": [
      "Cafés",
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Pagdandi Books Chai Cafe",
    "area": "Baner",
    "cuisines": [
      "Cafés",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Le Plaisir",
    "area": "Prabhat Road",
    "cuisines": [
      "Italian",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Blue Tokai Coffee Roasters",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Third Wave Coffee",
    "area": "FC Road",
    "cuisines": [
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "One O Eight Cafe",
    "area": "Baner",
    "cuisines": [
      "Cafés",
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Butter Brews",
    "area": "Baner",
    "cuisines": [
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Naadbrahma Idli",
    "area": "Lohegaon",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Ammachi Mess",
    "area": "Viman Nagar",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "The Fisherman's Wharf",
    "area": "Viman Nagar",
    "cuisines": [
      "Indian",
      "Asian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Vardayini Pure Veg",
    "area": "Deccan",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Rameshwar",
    "area": "Viman Nagar",
    "cuisines": [
      "Indian",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Cafe Cruise",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Cafés",
      "Vegetarian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 1,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Harley's Fine Baking",
    "area": "Viman Nagar",
    "cuisines": [
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Sous sol",
    "area": "Koregaon Park",
    "cuisines": [
      "Cafés",
      "Italian"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Tiger Naan",
    "area": "Koregaon Park",
    "cuisines": [
      "Indian",
      "Japanese"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 3,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Grandmama's",
    "area": "Koregaon Park",
    "cuisines": [
      "Italian",
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  },
  {
    "name": "Coffee Nation",
    "area": "Kalyani Nagar",
    "cuisines": [
      "Cafés"
    ],
    "category": "Restaurant",
    "rating": null,
    "reviews": 0,
    "priceTier": 2,
    "vibes": [],
    "source": "Pune food guides / listings checked 2026-10-04"
  }
];

const form=document.getElementById('tasteForm');
const results=document.getElementById('results');

function areaFit(userArea, restaurantArea){
  const a=userArea.toLowerCase();
  const b=restaurantArea.toLowerCase();
  if (userArea === 'Other Pune') return 0.55;
  if(b.includes(a) || a.includes(b.split(' / ')[0])) return 1;
  const nearby={
    'Viman Nagar':['Airport Road / Viman Nagar','Kharadi','Lohegaon','Wadgaon Sheri / Chandan Nagar','Kalyani Nagar'],
    'Kharadi':['Kharadi','Wadgaon Sheri / Chandan Nagar','Airport Road / Viman Nagar','Lohegaon','Viman Nagar'],
    'Koregaon Park':['Koregaon Park','Mundhwa / Koregaon Park Annexe','Kalyani Nagar','Sangamvadi'],
    'Kalyani Nagar':['Kalyani Nagar','Koregaon Park','Mundhwa / Koregaon Park Annexe','Viman Nagar'],
    'Shivajinagar':['Shivajinagar','Deccan Gymkhana','Sangamvadi','FC Road'],
    'Deccan':['Deccan Gymkhana','Shivajinagar','FC Road','Prabhat Road'],
    'Kothrud':['Kothrud','Deccan Gymkhana','Prabhat Road'],
    'Pashan':['Pashan','Kothrud','Baner'],
    'Baner':['Baner','Shivajinagar','Wakad'],
    'Wakad':['Wakad','Baner','Hinjewadi'],
    'Hinjewadi':['Hinjewadi','Wakad','Baner'],
    'Sadashiv Peth':['Sadashiv Peth','Rasta Peth','Deccan Gymkhana'],
    'Rasta Peth':['Rasta Peth','Sadashiv Peth','Sangamvadi'],
    'Lohegaon':['Lohegaon','Viman Nagar','Kharadi'],
    'FC Road':['FC Road','Deccan Gymkhana','Shivajinagar'],
    'Prabhat Road':['Prabhat Road','Deccan Gymkhana','FC Road'],
    'Hadapsar':['Hadapsar','Kalyani Nagar','Koregaon Park']
  };
  return (nearby[userArea]||[]).includes(restaurantArea) ? 0.62 : 0.28;
}

function cuisineFit(selectedCuisine, restaurant){
  if(!selectedCuisine.length) return 0.18;
  const hits = selectedCuisine.filter(c=>restaurant.cuisines.includes(c)).length;
  return Math.min(1, hits / Math.max(1, Math.min(selectedCuisine.length,2)));
}

function budgetFit(priceValue, restaurant){
  const userTier=Number(priceValue);
  const diff=Math.abs(userTier-(restaurant.priceTier||2));
  return diff===0 ? 1 : diff===1 ? 0.62 : 0.25;
}

function scoreRestaurant(r, cs, vs, area, priceValue){
  const c=cuisineFit(cs,r);
  const a=areaFit(area,r.area);
  const b=budgetFit(priceValue,r);
  const rating=(r.rating==null ? 0.62 : Math.max(0,Math.min(1,(r.rating-3.5)/1.5)));
  const popularity=Math.min(1,Math.log10((r.reviews||0)+1)/4.5);
  const vibe=(vs.length ? vs.reduce((sum,v)=>sum+(r.category.toLowerCase().includes(v.toLowerCase().split(' ')[0])?1:0),0)/vs.length : 0.2);
  // Taste fit dominates; metadata is only tie-breaking signal.
  let score=42 + c*27 + a*13 + b*8 + rating*6 + popularity*2 + vibe*2;
  return Math.max(35,Math.min(97,Math.round(score)));
}

function mapsUrl(name){
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', Pune, Maharashtra');
}

function renderResults(list, area, cs){
  results.innerHTML=`<div class="card">
    <div class="result-head"><div><div class="result-kicker">Pune food graph · behavioral MVP</div><div class="result-title">Places that fit your profile</div></div><div class="result-meta">${area} · ${cs.length?cs.join(' · '):'exploring'}</div></div>
    <div class="notice">Your results are ranked by <b>your selected taste, area and budget</b>. As people use FoodGraph, interaction data will replace these metadata-only signals.</div>
    ${list.map((r,i)=>`<article class="restaurant" data-name="${r.name.replace(/"/g,'&quot;')}">
      <div class="restaurant-top"><div><h3>${i+1}. ${r.name}</h3><div class="type">${r.area} · ${r.category}</div></div><div class="score"><strong>${r.score}%</strong><span>profile fit</span></div></div>
      <div class="tags">${r.cuisines.map(t=>`<span class="tag">${t}</span>`).join('')} ${r.rating!=null?`<span class="tag">${r.rating}★ · ${Number(r.reviews).toLocaleString()} reviews</span>`:'<span class="tag">new / low-review signal</span>'}</div>
      <div class="why"><b>Why:</b> ${cs.length ? `${r.cuisines.filter(c=>cs.includes(c)).join(', ') || 'related dining'} match your selected tastes; distance and budget also affect this rank.` : 'A starting point from the Pune dataset, weighted by area and budget.'}</div>
      <div class="result-actions"><a href="${mapsUrl(r.name)}" target="_blank" rel="noopener" data-action="maps_click" data-name="${r.name.replace(/"/g,'&quot;')}">Open in Maps ↗</a><button type="button" data-action="like" data-name="${r.name.replace(/"/g,'&quot;')}">Useful</button><button type="button" data-action="dislike" data-name="${r.name.replace(/"/g,'&quot;')}">Not for me</button></div>
    </article>`).join('')}
    <button type="button" class="back" onclick="window.scrollTo({top:0,behavior:'smooth'})">← Change my taste</button>
  </div>`;
  results.classList.remove('hidden');
  results.scrollIntoView({behavior:'smooth',block:'start'});
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  const area=document.getElementById('area').value;
  const cs=[...selected.cuisines];
  const vs=[...selected.vibes];
  const priceValue=document.getElementById('price').value;
  const list=restaurants.map(r=>({...r,score:scoreRestaurant(r,cs,vs,area,priceValue)})).sort((a,b)=>b.score-a.score).slice(0,5);
  renderResults(list,area,cs);
  const resultNames=list.map(r=>r.name).join(' | ');
  const resultScores=list.map(r=>r.score).join(' | ');
  track('taste_submit',{area,cuisines:cs.join('|'),vibes:vs.join('|'),budget:document.getElementById('priceText').textContent,result_names:resultNames,result_scores:resultScores});
  track('result_view',{area,cuisines:cs.join('|'),vibes:vs.join('|'),budget:document.getElementById('priceText').textContent,result_names:resultNames,result_scores:resultScores});
});

results.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(!el) return;
  const name=el.dataset.name || '';
  const action=el.dataset.action;
  track(action==='maps_click'?'restaurant_click':'feedback',{restaurant_name:name,action,feedback:action});
  if(action==='like' || action==='dislike'){
    el.textContent=action==='like'?'Recorded ✓':'Recorded';
    el.disabled=true;
  }
});
