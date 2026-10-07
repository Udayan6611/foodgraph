const TRACKING_ENDPOINT='https://script.google.com/macros/s/AKfycbyJTL_UKuih_3e7Lr71s0XdV24VoNY5qhjfdfZeBA1wyJRPr8dHP_GQR3hBJRSiRz1d4w/exec';
function readReferralRoute(){const p=window.location.pathname.replace(/\/+$/,'');const m=p.match(/\/foodgraph\/r\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/i);return m?{id:decodeURIComponent(m[1]),source:decodeURIComponent(m[2]||'direct'),campaign:decodeURIComponent(m[3]||'general')}:null}
const rr=readReferralRoute(),params=new URLSearchParams(location.search),legacyRef=params.get('ref')||'';
if(rr){localStorage.setItem('foodgraph_referrer_id',rr.id);localStorage.setItem('foodgraph_source',rr.source);localStorage.setItem('foodgraph_campaign',rr.campaign)}
if(legacyRef&&!localStorage.getItem('foodgraph_referrer_id'))localStorage.setItem('foodgraph_referrer_id',legacyRef);
const REFERRER_ID=localStorage.getItem('foodgraph_referrer_id')||'',SOURCE=localStorage.getItem('foodgraph_source')||'direct',CAMPAIGN=localStorage.getItem('foodgraph_campaign')||'general',REFERRAL=REFERRER_ID;
const PROFILE_CONTEXT={area:localStorage.getItem('foodgraph_area')||'',cuisines:localStorage.getItem('foodgraph_cuisines')||'',vibes:localStorage.getItem('foodgraph_vibes')||'',budget:localStorage.getItem('foodgraph_budget')||''};
const SESSION_ID=(()=>{const k='foodgraph_session_id';let id=localStorage.getItem(k);if(!id){id=crypto.randomUUID?crypto.randomUUID():'fg-'+Date.now()+'-'+Math.random().toString(36).slice(2);localStorage.setItem(k,id)}return id})();
function track(event,extra={}){if(!TRACKING_ENDPOINT)return;const p={event,session_id:SESSION_ID,ref:REFERRER_ID?REFERRER_ID+'|'+SOURCE+'|'+CAMPAIGN:'',referrer_id:REFERRER_ID,source:SOURCE,campaign:CAMPAIGN,landing_path:location.pathname,area:extra.area??PROFILE_CONTEXT.area,cuisines:extra.cuisines??PROFILE_CONTEXT.cuisines,vibes:extra.vibes??PROFILE_CONTEXT.vibes,budget:extra.budget??PROFILE_CONTEXT.budget,...extra};const b=new Image();b.src=TRACKING_ENDPOINT+'?'+new URLSearchParams(p).toString()}
track('page_view');
const LEARNING_KEY = 'foodgraph_behavior_v1';
const LEARNING = (() => {
  try { return JSON.parse(localStorage.getItem(LEARNING_KEY)) || {restaurants:{}, cuisines:{}, vibes:{}, feedback:{}}; }
  catch (_) { return {restaurants:{}, cuisines:{}, vibes:{}, feedback:{}}; }
})();
function saveLearning(){localStorage.setItem(LEARNING_KEY, JSON.stringify(LEARNING));}
function updateLearning(name, action, restaurant){
  const previous = LEARNING.feedback?.[name] || null;
  const nextDelta = action === 'like' ? 1 : action === 'dislike' ? -1 : 0;
  const previousDelta = previous === 'like' ? 1 : previous === 'dislike' ? -1 : 0;
  const delta = nextDelta - previousDelta;
  if (!delta) return;
  LEARNING.restaurants[name] = (LEARNING.restaurants[name] || 0) + delta;
  restaurant.cuisines.forEach(c => { LEARNING.cuisines[c] = (LEARNING.cuisines[c] || 0) + delta; });
  restaurant.vibes.forEach(v => { LEARNING.vibes[v] = (LEARNING.vibes[v] || 0) + delta; });
  LEARNING.feedback = LEARNING.feedback || {};
  LEARNING.feedback[name] = action;
  saveLearning();
}
function behavioralScore(r){
  const restaurantSignal = Math.max(-2, Math.min(2, LEARNING.restaurants[r.name] || 0));
  const cuisineSignals = r.cuisines.map(c => LEARNING.cuisines[c] || 0);
  const vibeSignals = r.vibes.map(v => LEARNING.vibes[v] || 0);
  const cuisineSignal = cuisineSignals.length ? cuisineSignals.reduce((x,y)=>x+y,0) / cuisineSignals.length : 0;
  const vibeSignal = vibeSignals.length ? vibeSignals.reduce((x,y)=>x+y,0) / vibeSignals.length : 0;
  return restaurantSignal * 6 + cuisineSignal * 2.5 + vibeSignal * 1.5;
}
const cuisines = ['Indian','Vegetarian','South Indian','North Indian','Chinese','Italian','Mexican','Biryani','Café','Korean','Japanese'];
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
      if(selected[key].has(item)){ selected[key].delete(item); b.classList.remove('selected'); }
      else { selected[key].add(item); b.classList.add('selected'); }
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
  name, area,
  cuisines: cuisine.split(',').map(s => s.trim()),
  category: cuisine.split(',')[0].trim() + ' restaurant',
  rating, reviews: 0, source: 'FoodGraph Pune dataset v6', priceTier,
  vibes: vibe.split(',').map(s => s.trim())
}));
const form=document.getElementById('tasteForm');
const results=document.getElementById('results');
function areaFit(userArea, restaurantArea){
  const a=userArea.toLowerCase(), b=restaurantArea.toLowerCase();
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
function cuisineMatches(selected, restaurantCuisines){
  const wanted = selected.toLowerCase();
  const normalized = restaurantCuisines.map(c => c.toLowerCase());
  if(wanted === 'café') return normalized.includes('cafe');
  if(wanted === 'indian'){
    const indianTerms = ['indian','north indian','south indian','maharashtrian','gujarati','rajasthani','mughlai','hyderabadi','biryani','kebab'];
    return normalized.some(c => indianTerms.includes(c));
  }
  return normalized.includes(wanted);
}
function cuisineFit(selectedCuisine, restaurant){
  if(!selectedCuisine.length) return 0.18;
  const hits = selectedCuisine.filter(c=>cuisineMatches(c,restaurant.cuisines)).length;
  return Math.min(1, hits / Math.max(1, Math.min(selectedCuisine.length,2)));
}
function budgetFit(priceValue, restaurant){
  const userTier=Number(priceValue), diff=Math.abs(userTier-(restaurant.priceTier||2));
  return diff===0 ? 1 : diff===1 ? 0.62 : 0.25;
}
function scoreRestaurant(r, cs, vs, area, priceValue){
  const c=cuisineFit(cs,r), a=areaFit(area,r.area), b=budgetFit(priceValue,r);
  const rating=(r.rating==null ? 0.62 : Math.max(0,Math.min(1,(r.rating-3.5)/1.5)));
  const popularity=Math.min(1,Math.log10((r.reviews||0)+1)/4.5);
  const vibe=(vs.length ? vs.reduce((sum,v)=>sum+(r.vibes.some(rv=>rv.toLowerCase()===v.toLowerCase())?1:0),0)/vs.length : 0.2);
  let score=42 + c*27 + a*13 + b*8 + rating*6 + popularity*2 + vibe*2 + behavioralScore(r);
  return Math.max(35,Math.min(97,Math.round(score)));
}
function mapsUrl(name){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', Pune, Maharashtra');}
function renderResults(list, area, cs, shouldScroll=true){
  results.innerHTML=`<div class="card">
    <div class="result-head"><div><div class="result-kicker">Pune food discovery</div><div class="result-title">Places you'll like</div></div><div class="result-meta">${area} · ${cs.length?cs.join(' · '):'exploring'}</div></div>
    <div class="notice">Your results are ranked by <b>your taste, area, budget and the choices you've already made</b>. Each Useful / Not for me signal changes what you see next.</div>
    ${list.map((r,i)=>`<article class="restaurant" data-name="${r.name.replace(/"/g,'&quot;')}">
      <div class="restaurant-top"><div><h3>${i+1}. ${r.name}</h3><div class="type">${r.area} · ${r.category}</div></div><div class="score"><strong>${r.score}%</strong><span>match</span></div></div>
      <div class="tags">${r.cuisines.map(t=>`<span class="tag">${t}</span>`).join('')} ${r.rating!=null && r.reviews>0?`<span class="tag">${r.rating}★ · ${Number(r.reviews).toLocaleString()} reviews</span>`:r.rating!=null?`<span class="tag">${r.rating}★</span>`:'<span class="tag">new / low-review signal</span>'}</div>
      <div class="why"><b>Why:</b> ${cs.length ? `${r.cuisines.filter(c=>cs.some(s=>cuisineMatches(s,[c]))).join(', ') || 'related dining'} match your selected tastes; distance and budget also affect this match.` : 'A starting point from the Pune dataset, weighted by area and budget.'}</div>
      <div class="result-actions"><a href="${mapsUrl(r.name)}" target="_blank" rel="noopener" data-action="maps_click" data-name="${r.name.replace(/"/g,'&quot;')}">Open in Maps ↗</a><button type="button" data-action="like" data-name="${r.name.replace(/"/g,'&quot;')}" ${LEARNING.feedback?.[r.name]==='like'?'disabled':''}>${LEARNING.feedback?.[r.name]==='like'?'Recorded ✓':'Useful'}</button><button type="button" data-action="dislike" data-name="${r.name.replace(/"/g,'&quot;')}" ${LEARNING.feedback?.[r.name]==='dislike'?'disabled':''}>${LEARNING.feedback?.[r.name]==='dislike'?'Recorded':'Not for me'}</button></div>
    </article>`).join('')}
    <button type="button" class="back" onclick="window.scrollTo({top:0,behavior:'smooth'})">← Change my taste</button>
  </div>`;
  results.classList.remove('hidden');
  if(shouldScroll) results.scrollIntoView({behavior:'smooth',block:'start'});
}
form.addEventListener('submit',e=>{
  e.preventDefault();
  const area=document.getElementById('area').value, cs=[...selected.cuisines], vs=[...selected.vibes], priceValue=document.getElementById('price').value, budgetLabel=document.getElementById('priceText').textContent;
  PROFILE_CONTEXT.area=area; PROFILE_CONTEXT.cuisines=cs.join('|'); PROFILE_CONTEXT.vibes=vs.join('|'); PROFILE_CONTEXT.budget=budgetLabel;
  localStorage.setItem('foodgraph_area',area); localStorage.setItem('foodgraph_cuisines',PROFILE_CONTEXT.cuisines); localStorage.setItem('foodgraph_vibes',PROFILE_CONTEXT.vibes); localStorage.setItem('foodgraph_budget',PROFILE_CONTEXT.budget);
  const list=restaurants.map(r=>({...r,score:scoreRestaurant(r,cs,vs,area,priceValue)})).sort((a,b)=>b.score-a.score).slice(0,5);
  renderResults(list,area,cs);
  const resultNames=list.map(r=>r.name).join(' | '), resultScores=list.map(r=>r.score).join(' | ');
  track('taste_submit',{area,cuisines:cs.join('|'),vibes:vs.join('|'),budget:budgetLabel,result_names:resultNames,result_scores:resultScores});
  track('result_view',{area,cuisines:cs.join('|'),vibes:vs.join('|'),budget:budgetLabel,result_names:resultNames,result_scores:resultScores});
});
results.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(!el) return;
  const name=el.dataset.name||'', action=el.dataset.action;
  track(action==='maps_click'?'restaurant_click':'feedback',{restaurant_name:name,action,feedback:action});
  if(action==='like'||action==='dislike'){
    const restaurant=restaurants.find(r=>r.name===name);
    if(restaurant) updateLearning(name,action,restaurant);
    el.textContent=action==='like'?'Recorded ✓':'Recorded'; el.disabled=true;
    const currentArea=document.getElementById('area')?.value||'', currentCuisines=[...selected.cuisines], currentPrice=document.getElementById('price')?.value||'2';
    const reranked=restaurants.map(r=>({...r,score:scoreRestaurant(r,currentCuisines,[...selected.vibes],currentArea,currentPrice)})).sort((x,y)=>y.score-x.score).slice(0,5);
    renderResults(reranked,currentArea,currentCuisines,false);
    const updatedButton=results.querySelector('[data-action="'+action+'"][data-name="'+CSS.escape(name)+'"]');
    if(updatedButton){updatedButton.textContent=action==='like'?'Recorded ✓':'Recorded';updatedButton.disabled=true;}
  }
});
