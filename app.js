
// Free serverless analytics endpoint. Leave blank until Google Apps Script is deployed.
// Paste the SAME /exec URL that is already working in your current GitHub app.js.
const TRACKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJTL_UKuih_3e7Lr71s0XdV24VoNY5qhjfdfZeBA1wyJRPr8dHP_GQR3hBJRSiRz1d4w/exec';
const incomingRef = new URLSearchParams(window.location.search).get('ref') || '';
const storedRef = localStorage.getItem('foodgraph_ref') || '';
const REFERRAL = incomingRef || storedRef;
if (incomingRef) localStorage.setItem('foodgraph_ref', incomingRef);
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

const restaurants = RESTAURANTS_V6.map(([name, area, cuisine, vibe, rating, priceTier]) => ({
  name,
  area,
  cuisines: cuisine.split(',').map(s => s.trim()),
  category: cuisine.split(',')[0].trim() + ' restaurant',
  rating,
  reviews: 0,
  source: 'FoodGraph Pune dataset v6',
  priceTier,
  vibes: vibe.split(',').map(s => s.trim())
}));

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
  const vibe=(vs.length ? vs.reduce((sum,v)=>sum+(r.vibes.some(rv=>rv.toLowerCase()===v.toLowerCase())?1:0),0)/vs.length : 0.2);
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
