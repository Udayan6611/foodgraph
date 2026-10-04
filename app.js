
// Free serverless analytics endpoint. Leave blank until Google Apps Script is deployed.
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
const vibes = ['Popular with diners','Established spot','Café','Restaurant'];

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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "reviews": 3853,
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
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
    "source": "Live Pune business result • 2026-10-03"
  }
];

const form=document.getElementById('tasteForm');
const results=document.getElementById('results');

function areaFit(userArea, restaurantArea){
  const a=userArea.toLowerCase();
  const b=restaurantArea.toLowerCase();
  if(b.includes(a) || a.includes(b.split(' / ')[0])) return 1;
  const nearby={
    'Viman Nagar':['Airport Road / Viman Nagar','Kharadi','Lohegaon','Wadgaon Sheri / Chandan Nagar'],
    'Kharadi':['Kharadi','Wadgaon Sheri / Chandan Nagar','Airport Road / Viman Nagar','Lohegaon'],
    'Koregaon Park':['Koregaon Park','Mundhwa / Koregaon Park Annexe','Kalyani Nagar','Sangamvadi'],
    'Kalyani Nagar':['Kalyani Nagar','Koregaon Park','Mundhwa / Koregaon Park Annexe'],
    'Shivajinagar':['Shivajinagar','Deccan Gymkhana','Sangamvadi'],
    'Deccan':['Deccan Gymkhana','Shivajinagar'],
    'Kothrud':['Kothrud','Deccan Gymkhana'],
    'Pashan':['Pashan','Kothrud'],
    'Baner':['Baner','Shivajinagar'],
    'Wakad':['Wakad','Baner'],
    'Hinjewadi':['Hinjewadi','Wakad'],
    'Sadashiv Peth':['Sadashiv Peth','Rasta Peth','Deccan Gymkhana'],
    'Rasta Peth':['Rasta Peth','Sadashiv Peth','Sangamvadi'],
    'Lohegaon':['Lohegaon','Viman Nagar','Kharadi'],
  };
  return (nearby[userArea]||[]).includes(restaurantArea) ? 0.65 : 0.25;
}

function cuisineFit(selectedCuisine, restaurant){
  if(!selectedCuisine.length) return 0.25;
  const hits = selectedCuisine.filter(c=>restaurant.cuisines.includes(c)).length;
  return hits / selectedCuisine.length;
}

function scoreRestaurant(r, cs, vs, area){
  const c = cuisineFit(cs,r);
  const a = areaFit(area,r.area);
  const popularity = Math.min(1, Math.log10(r.reviews+1)/5);
  let score = 52 + c*35 + a*8 + popularity*5;
  if(vs.includes('Café') && r.category.toLowerCase().includes('cafe')) score += 3;
  if(vs.includes('Restaurant') && r.category.toLowerCase().includes('restaurant')) score += 2;
  if(vs.includes('Popular with diners') && r.reviews >= 1000) score += 2;
  if(vs.includes('Established spot') && r.reviews >= 3000) score += 2;
  return Math.min(98, Math.round(score));
}

form.addEventListener('submit',e=>{
  e.preventDefault();
  const area=document.getElementById('area').value;
  const cs=[...selected.cuisines];
  const vs=[...selected.vibes];

  const list=restaurants
    .map(r=>({...r,score:scoreRestaurant(r,cs,vs,area)}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,5);

  results.innerHTML=`<div class="card">
    <div class="result-head">
      <div>
        <div class="result-kicker">Pune food graph · live dataset</div>
        <div class="result-title">Places that fit your profile</div>
      </div>
      <div class="result-meta">${area} · ${cs.length?cs.join(' · '):'exploring'}</div>
    </div>
    <div class="notice">This is an early fit model using live restaurant metadata. It is <b>not yet</b> claiming that these restaurants were chosen by people with your taste. That becomes the product once we have verified behavior.</div>
    ${list.map(r=>`<article class="restaurant">
      <div class="restaurant-top">
        <div>
          <h3>${r.name}</h3>
          <div class="type">${r.area} · ${r.category}</div>
        </div>
        <div class="score"><strong>${r.score}%</strong><span>profile fit</span></div>
      </div>
      <div class="tags">${r.cuisines.map(t=>`<span class="tag">${t}</span>`).join('')} <span class="tag">${r.rating}★ · ${r.reviews.toLocaleString()} reviews</span></div>
      <div class="why"><b>Why:</b> ${cs.length ? `${r.cuisines.filter(c=>cs.includes(c)).join(', ') || 'related dining'} match your selected tastes, with area fit considered.` : 'A starting point from the current Pune dataset.'}</div>
    </article>`).join('')}
    <button type="button" class="back" onclick="window.scrollTo({top:0,behavior:'smooth'})">← Change my taste</button>
  </div>`;
  results.classList.remove('hidden');
  results.scrollIntoView({behavior:'smooth',block:'start'});

  const resultNames = list.map(r => r.name).join(' | ');
  const resultScores = list.map(r => r.score).join(' | ');
  track('taste_submit', {
    area,
    cuisines: cs.join('|'),
    vibes: vs.join('|'),
    budget: document.getElementById('priceText').textContent,
    result_names: resultNames,
    result_scores: resultScores
  });
  track('result_view', {
    area,
    cuisines: cs.join('|'),
    result_names: resultNames,
    result_scores: resultScores
  });
});
