const TRACKING_ENDPOINT='https://script.google.com/macros/s/AKfycbyJTL_UKuih_3e7Lr71s0XdV24VoNY5qhjfdfZeBA1wyJRPr8dHP_GQR3hBJRSiRz1d4w/exec';
function readReferralRoute(){const p=window.location.pathname.replace(/\/+$/,'');const m=p.match(/\/foodgraph\/r\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/i);return m?{id:decodeURIComponent(m[1]),source:decodeURIComponent(m[2]||'direct'),campaign:decodeURIComponent(m[3]||'general')}:null}
const rr=readReferralRoute(),params=new URLSearchParams(location.search),legacyRef=params.get('ref')||'';
if(rr){localStorage.setItem('foodgraph_referrer_id',rr.id);localStorage.setItem('foodgraph_source',rr.source);localStorage.setItem('foodgraph_campaign',rr.campaign)}
if(legacyRef&&!localStorage.getItem('foodgraph_referrer_id'))localStorage.setItem('foodgraph_referrer_id',legacyRef);
const REFERRER_ID=localStorage.getItem('foodgraph_referrer_id')||'',SOURCE=localStorage.getItem('foodgraph_source')||'direct',CAMPAIGN=localStorage.getItem('foodgraph_campaign')||'general',REFERRAL=REFERRER_ID;
const PROFILE_CONTEXT={area:localStorage.getItem('foodgraph_area')||'',cuisines:localStorage.getItem('foodgraph_cuisines')||'',vibes:localStorage.getItem('foodgraph_vibes')||'',budget:localStorage.getItem('foodgraph_budget')||''};
const SESSION_ID=(()=>{const k='foodgraph_session_id';let id=localStorage.getItem(k);if(!id){id=crypto.randomUUID?crypto.randomUUID():'fg-'+Date.now()+'-'+Math.random().toString(36).slice(2);localStorage.setItem(k,id)}return id})();
function track(event,extra={}){if(!TRACKING_ENDPOINT||localStorage.getItem('foodgraph_analytics_opt_out')==='yes')return;const p={event,session_id:SESSION_ID,ref:REFERRER_ID?REFERRER_ID+'|'+SOURCE+'|'+CAMPAIGN:'',referrer_id:REFERRER_ID,source:SOURCE,campaign:CAMPAIGN,landing_path:location.pathname,area:extra.area??PROFILE_CONTEXT.area,cuisines:extra.cuisines??PROFILE_CONTEXT.cuisines,vibes:extra.vibes??PROFILE_CONTEXT.vibes,budget:extra.budget??PROFILE_CONTEXT.budget,...extra};const b=new Image();b.src=TRACKING_ENDPOINT+'?'+new URLSearchParams(p).toString()}
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
  const bounded = value => Math.max(-2, Math.min(2, Number(value) || 0));
  const restaurantSignal = bounded(LEARNING.restaurants[r.name]);
  const cuisineSignals = r.cuisines.map(c => bounded(LEARNING.cuisines[c]));
  const vibeSignals = r.vibes.map(v => bounded(LEARNING.vibes[v]));
  const cuisineSignal = cuisineSignals.length ? cuisineSignals.reduce((x,y)=>x+y,0) / cuisineSignals.length : 0;
  const vibeSignal = vibeSignals.length ? vibeSignals.reduce((x,y)=>x+y,0) / vibeSignals.length : 0;
  return restaurantSignal * 2.5 + cuisineSignal * 1.5 + vibeSignal;
}
const cuisines = ['Indian','North Indian','South Indian','Maharashtrian','Vegetarian','Biryani','Chinese','Italian','Asian','Japanese','Korean','Thai','Continental','Pizza','Seafood','Mughlai','Sushi','Café','Mexican'];
const vibes = ['Cafe','Casual','Date night','Established','Groups','Specialty'];
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
const restaurants = RESTAURANTS_V6.map(([name, area, cuisine, vibe, rating, priceTier, reviews = 0, sourceUrl = '']) => ({
  name, area,
  cuisines: cuisine.split(',').map(s => s.trim()),
  category: cuisine.split(',')[0].trim() + ' restaurant',
  rating, reviews, source: 'FoodGraph Pune dataset', sourceUrl, priceTier,
  vibes: vibe.split(',').map(s => s.trim())
}));
const form=document.getElementById('tasteForm');
const results=document.getElementById('results');
function areaFit(userArea, restaurantArea){
  const a=userArea.toLowerCase().trim(), b=restaurantArea.toLowerCase().trim();
  if (userArea === 'Other Pune') return 0.55;
  if (a === b || b.includes(a) || a.includes(b.split(' / ')[0])) return 1;
  const nearby={
    'Viman Nagar':['Airport Road / Viman Nagar','Kharadi','Lohegaon','Wadgaon Sheri / Chandan Nagar','Kalyani Nagar'],
    'Kharadi':['Wadgaon Sheri','Wadgaon Sheri / Chandan Nagar','Viman Nagar','Lohegaon'],
    'Kharadi':['Wadgaon Sheri / Chandan Nagar','Airport Road / Viman Nagar','Lohegaon','Viman Nagar'],
    'Koregaon Park':['Mundhwa / Koregaon Park Annexe','Kalyani Nagar','Sangamvadi'],
    'Kalyani Nagar':['Koregaon Park','Mundhwa / Koregaon Park Annexe','Viman Nagar','Kharadi'],
    'Shivajinagar':['Deccan Gymkhana','FC Road','Sangamvadi','Prabhat Road'],
    'Deccan Gymkhana':['Shivajinagar','FC Road','Prabhat Road','Erandwane','Sadashiv Peth'],
    'FC Road':['Deccan Gymkhana','Shivajinagar','Prabhat Road','Erandwane'],
    'Prabhat Road':['Deccan Gymkhana','FC Road','Erandwane','Kothrud'],
    'Erandwane':['Deccan Gymkhana','Prabhat Road','Kothrud','FC Road'],
    'Kothrud':['Deccan Gymkhana','Prabhat Road','Erandwane','Karve Nagar'],
    'Pashan':['Aundh','Kothrud','Baner'],
    'Aundh':['Pashan','Baner','Balewadi'],
    'Baner':['Balewadi','Aundh','Wakad','Pashan'],
    'Balewadi':['Baner','Wakad','Aundh'],
    'Wakad':['Hinjewadi','Baner','Balewadi'],
    'Hinjawadi':['Wakad','Baner','Balewadi'],
    'Sadashiv Peth':['Rasta Peth','Deccan Gymkhana','Tilak Road'],
    'Rasta Peth':['Sadashiv Peth','Sangamvadi','Camp','Tilak Road'],
    'Camp':['East Street','MG Road','Sangamvadi','Sadashiv Peth'],
    'Hadapsar':['Amanora','Magarpatta','Mundhwa','Kalyani Nagar'],
    'Mundhwa':['Koregaon Park','Kalyani Nagar','Hadapsar'],
    'Lohegaon':['Viman Nagar','Kharadi'],
    'Dhole Patil Road':['Sangamvadi','Camp','Kalyani Nagar']
  };
  return (nearby[userArea]||[]).some(area=>area.toLowerCase()===b) ? 0.62 : 0.28;
}
function cuisineMatches(selected, restaurantCuisines){
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const wanted = normalize(selected);
  const normalized = restaurantCuisines.map(normalize);
  if(wanted === 'cafe') return normalized.includes('cafe');
  if(wanted === 'indian'){
    const indianTerms = ['indian','north indian','south indian','maharashtrian','gujarati','rajasthani','mughlai','hyderabadi','biryani','kebab'];
    return normalized.some(c => indianTerms.includes(c));
  }
  if(wanted === 'vegetarian') return normalized.includes('vegetarian');
  return normalized.includes(wanted);
}
function cuisineFit(selectedCuisine, restaurant){
  if(!selectedCuisine.length) return 0.18;
  const hits = selectedCuisine.filter(c=>cuisineMatches(c,restaurant.cuisines)).length;
  return Math.min(1, hits / Math.max(1, Math.min(selectedCuisine.length,2)));
}
function budgetFit(priceValue, restaurant){
  if(restaurant.priceTier == null || !Number.isInteger(Number(restaurant.priceTier))) return 0.65;
  const userTier=Number(priceValue), diff=Math.abs(userTier-Number(restaurant.priceTier));
  return diff===0 ? 1 : diff===1 ? 0.70 : diff===2 ? 0.35 : 0.15;
}
function scoreRestaurant(r, cs, vs, area, priceValue){
  const c=cuisineFit(cs,r), a=areaFit(area,r.area), b=budgetFit(priceValue,r);
  const rating=(r.rating==null ? 0.5 : Math.max(0,Math.min(1,(r.rating-3.5)/1.5)));
  const vibe=(vs.length ? vs.reduce((sum,v)=>sum+(r.vibes.some(rv=>rv.toLowerCase()===v.toLowerCase())?1:0),0)/vs.length : 0.15);
  const score=10 + c*35 + a*20 + b*15 + vibe*10 + rating*5 + behavioralScore(r);
  return Math.max(0,Math.min(100,Math.round(score)));
}
const budgetRanges={1:'₹300–500',2:'₹500–800',3:'₹800–1,500',4:'₹1,500+'};
function budgetLabel(restaurant){return restaurant.priceTier ? 'Indicative '+budgetRanges[restaurant.priceTier]+'/person' : 'Price not verified';}
function explainMatch(restaurant, cs, vs, area, priceValue){
  const matchedCuisines=cs.filter(c=>cuisineMatches(c,restaurant.cuisines));
  const areaScore=areaFit(area,restaurant.area);
  const matchedVibes=vs.filter(v=>restaurant.vibes.some(rv=>rv.toLowerCase()===v.toLowerCase()));
  const parts=[];
  if(cs.length) parts.push(matchedCuisines.length ? 'Cuisine: '+matchedCuisines.join(', ') : 'Cuisine: related options');
  parts.push(areaScore===1 ? 'Area: '+restaurant.area : areaScore>0.4 ? 'Area: nearby, '+restaurant.area : 'Area: outside your selected neighbourhood');
  if(restaurant.priceTier){
    const gap=Math.abs(Number(priceValue)-Number(restaurant.priceTier));
    parts.push('Budget: '+(gap===0?'within your range':gap===1?'close to your range':'outside your range'));
  } else parts.push('Budget: price not verified');
  if(vs.length) parts.push(matchedVibes.length ? 'Vibe: '+matchedVibes.join(', ') : 'Vibe: no exact tag match');
  return parts.join(' · ');
}
function mapsUrl(name,area){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+area+', Pune, Maharashtra');}
function renderResults(list, area, cs, shouldScroll=true){
  results.innerHTML=`<div class="card">
    <div class="result-head"><div><div class="result-kicker">Pune food discovery</div><div class="result-title">Places you'll like</div></div><div class="result-meta">${area} · ${cs.length?cs.join(' · '):'exploring'}</div></div>
    <div class="notice">Ranked around your choices. Fit scores are ranking aids, not a promise of quality. Price guides are indicative and may change.</div>
    ${list.map((r,i)=>`<article class="restaurant" data-name="${r.name.replace(/"/g,'&quot;')}">
      <div class="restaurant-top"><div><h3>${i+1}. ${r.name}</h3><div class="type">${r.area} · ${r.category}</div></div><div class="score"><strong>${r.score}</strong><span>fit score</span></div></div>
      <div class="tags">${r.cuisines.map(t=>`<span class="tag">${t}</span>`).join('')} <span class="tag">${budgetLabel(r)}</span> ${r.rating!=null && r.reviews>0?`<span class="tag">${r.rating}★ · ${Number(r.reviews).toLocaleString()} reviews</span>`:r.rating!=null?`<span class="tag">${r.rating}★</span>`:'<span class="tag">Rating not available</span>'}</div>
      <div class="why"><b>Why this is here:</b> ${explainMatch(r,cs,[...selected.vibes],area,document.getElementById('price').value)}</div>
      <div class="result-actions"><a href="${mapsUrl(r.name,r.area)}" target="_blank" rel="noopener" data-action="maps_click" data-name="${r.name.replace(/"/g,'&quot;')}">Open in Maps ↗</a><button type="button" data-action="like" data-name="${r.name.replace(/"/g,'&quot;')}" ${LEARNING.feedback?.[r.name]==='like'?'disabled':''}>${LEARNING.feedback?.[r.name]==='like'?'Recorded ✓':'Useful'}</button><button type="button" data-action="dislike" data-name="${r.name.replace(/"/g,'&quot;')}" ${LEARNING.feedback?.[r.name]==='dislike'?'disabled':''}>${LEARNING.feedback?.[r.name]==='dislike'?'Recorded':'Not for me'}</button></div>
    </article>`).join('')}
    <div class="join-invite"><div><b>Want to help shape FoodGraph?</b><span>Get occasional updates as we build it in Pune.</span></div><a href="../join/">Join early access ↗</a></div><button type="button" class="back" onclick="window.scrollTo({top:0,behavior:'smooth'})">← Change my taste</button>
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
