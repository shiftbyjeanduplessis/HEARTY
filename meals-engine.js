(function () {
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DEFAULT_FRUITS = ['banana', 'apple', 'grapes', 'pineapple', 'berries'];
  const PROTEIN_EST = { chicken:32, beef:30, pork:28, venison:30, tuna:18, prawns:24, hake:26, snoek:26, salmon:28, cod:26, haddock:26, eggs:13, yoghurt:10, cottage_cheese:12, whey:24, biltong:15, nuts:6 };
  const FISH_EXAMPLES_BY_COUNTRY = { ZA:['hake','snoek','salmon'], UK:['cod','haddock','salmon'], US:['cod','salmon'], AU:['salmon'], GLOBAL:['salmon'] };

  function structuredCloneSafe(v){ return JSON.parse(JSON.stringify(v)); }
  function iso(date){ return date.toISOString().slice(0,10); }
  function weekStartDate(){ const d=new Date(); const day=d.getDay(); const diff=day===0?-6:1-day; d.setHours(0,0,0,0); d.setDate(d.getDate()+diff); return d; }
  function rand(list){ return list[Math.floor(Math.random()*list.length)]; }
  function shuffle(list){ const out=list.slice(); for(let i=out.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; } return out; }
  function toLowerList(values){ return (values || []).map(v => String(v).toLowerCase()); }
  function normalizeProfile(profile={}){ return { country: profile.country || 'ZA', allowedFruits: toLowerList(profile.allowedFruits && profile.allowedFruits.length ? profile.allowedFruits : DEFAULT_FRUITS), snackEnabled: profile.snackEnabled !== false, seafoodAllowed: profile.seafoodAllowed !== false }; }
  function normalizeAdjustments(adjustments={}){ return { supportMode: adjustments.supportMode || null }; }
  function makeWeekState(){ return { breakfastFamiliesRecent:[], breakfastExactRecent:[], recentMainProteins:[], recentMainMethods:[], recentMainKeys:[], primarySinceSecondary:0, wheyCount:0 }; }
  function pushLimited(list, value, max){ list.push(value); while(list.length>max) list.shift(); }
  function makeContext(args={}){ return { profile: normalizeProfile(args.profile || {}), adjustments: normalizeAdjustments(args.adjustments || {}), weekState: args.weekState || makeWeekState(), dayIndex: args.dayIndex || 0, seed: args.seed || 0 }; }
  function fruitAt(ctx, offset=0){ const fruits = ctx.profile.allowedFruits.length ? ctx.profile.allowedFruits : DEFAULT_FRUITS; const index=(ctx.dayIndex + ctx.seed + offset) % fruits.length; return fruits[index]; }
  function meal({mealType, templateId, title, proteinId=null, method, tags=[], extraProteinId=null, flavourBase=[]}){ return { mealType, templateId, title, proteinId, extraProteinId, method, proteinEstimate:(PROTEIN_EST[proteinId]||0)+(PROTEIN_EST[extraProteinId]||0), tags:['baseline'].concat(tags), flavourBase }; }
  function fishExamplesForCountry(country){ return FISH_EXAMPLES_BY_COUNTRY[country] || FISH_EXAMPLES_BY_COUNTRY.GLOBAL; }

  function breakfastFamilyPool(ctx){ let pool=['oats','chia','yoghurt','eggs','avocado']; const last2 = ctx.weekState.breakfastFamiliesRecent.slice(-2); const filtered=pool.filter(f=>!last2.includes(f)); if(filtered.length) pool=filtered; return pool; }
  function chooseBreakfastFamily(ctx){ return shuffle(breakfastFamilyPool(ctx))[0]; }
  function breakfastOptionsForFamily(family){
    const options = {
      oats:['A bowl of oats with a splash of milk and optional sweetener','A bowl of oats with a splash of milk and optional sweetener with banana','A bowl of oats with a splash of milk and optional sweetener with berries'],
      chia:['A bowl of chia porridge made with chia seeds soaked in milk, with an optional sweetener','A bowl of chia porridge made with chia seeds soaked in milk, with an optional sweetener and banana','A bowl of chia porridge made with chia seeds soaked in milk, with an optional sweetener and berries'],
      yoghurt:['A bowl of low-fat yoghurt with a splash of milk and optional sweetener','A bowl of low-fat yoghurt with a splash of milk and optional sweetener with banana','A bowl of low-fat yoghurt with a splash of milk and optional sweetener with berries'],
      eggs:['2 x boiled eggs with apple','2 x boiled eggs with banana','2 x eggs scrambled with spinach','2 x eggs scrambled with mushrooms'],
      avocado:['½ mashed avocado','½ mashed avocado on whole grain bread']
    };
    return options[family] || [];
  }
  function buildBreakfast(ctx){
    const family = chooseBreakfastFamily(ctx);
    let options = breakfastOptionsForFamily(family);
    const recentExact = new Set(ctx.weekState.breakfastExactRecent.slice(-3));
    const filtered = options.filter(item => !recentExact.has(item));
    if(filtered.length) options = filtered;
    const title = rand(options.length ? options : breakfastOptionsForFamily('oats'));
    let proteinId = null; if(family==='yoghurt') proteinId='yoghurt'; if(family==='eggs') proteinId='eggs';
    pushLimited(ctx.weekState.breakfastFamiliesRecent, family, 3);
    pushLimited(ctx.weekState.breakfastExactRecent, title, 4);
    return meal({ mealType:'breakfast', templateId:`breakfast_${family}`, title, proteinId, method:family, tags:[family] });
  }

  function desiredMainBucket(ctx){ return ctx.weekState.primarySinceSecondary >= 2 ? 'secondary' : 'primary'; }
  function noteMainMeal(ctx, selected){
    if(selected.bucket === 'primary') ctx.weekState.primarySinceSecondary += 1;
    else ctx.weekState.primarySinceSecondary = 0;
    pushLimited(ctx.weekState.recentMainProteins, selected.proteinId, 3);
    pushLimited(ctx.weekState.recentMainMethods, selected.method, 3);
    pushLimited(ctx.weekState.recentMainKeys, selected.key, 5);
  }
  function filteredMainCandidates(candidates, ctx){
    const desired = desiredMainBucket(ctx);
    let pool = candidates.filter(item => item.bucket === desired);
    if(!pool.length) pool = candidates.slice();
    const noRepeatProtein = pool.filter(item => !ctx.weekState.recentMainProteins.includes(item.proteinId));
    if(noRepeatProtein.length) pool = noRepeatProtein;
    const noRepeatMethod = pool.filter(item => !ctx.weekState.recentMainMethods.slice(-2).includes(item.method));
    if(noRepeatMethod.length) pool = noRepeatMethod;
    const noRecentExact = pool.filter(item => !ctx.weekState.recentMainKeys.includes(item.key));
    if(noRecentExact.length) pool = noRecentExact;
    return pool;
  }

  function lunchCandidates(ctx){
    return filteredMainCandidates([
      { key:'lunch_chicken_salad', proteinId:'chicken', bucket:'primary', method:'salad', title:'Chicken salad (1 portion of chicken strips, 1–2 portions of salad greens such as lettuce or baby spinach, cucumber, tomato and carrot). You may add olives, gherkins, sun-dried tomatoes, seeds, ½ medium avocado cubed or a low-calorie dressing.' },
      { key:'lunch_beef_salad', proteinId:'beef', bucket:'primary', method:'salad', title:'Beef salad (1 portion of lean beef strips, 1–2 portions of salad greens such as lettuce or baby spinach, cucumber, tomato and carrot). You may add olives, gherkins, sun-dried tomatoes, seeds, ½ medium avocado cubed or a low-calorie dressing.' },
      { key:'lunch_pork_plate', proteinId:'pork', bucket:'primary', method:'plate', title:'Pork plate (1 portion of lean pork strips, 1–2 portions of broccoli, carrots and baby marrow).' },
      { key:'lunch_tuna_salad', proteinId:'tuna', bucket:'secondary', method:'salad', title:'Tuna salad (½ tin tuna in water – drained, 1–2 portions of salad greens such as lettuce or baby spinach, cucumber, tomato and carrot). You may add olives, gherkins, sun-dried tomatoes, seeds, ½ medium avocado cubed or a low-calorie dressing.' },
      { key:'lunch_prawn_salad', proteinId:'prawns', bucket:'secondary', method:'salad', title:'Prawn salad (1 portion of prawns, 1–2 portions of salad greens such as lettuce or baby spinach, cucumber, tomato and carrot). You may add olives, gherkins, sun-dried tomatoes, seeds, ½ medium avocado cubed or a low-calorie dressing.' },
      { key:'lunch_venison_plate', proteinId:'venison', bucket:'secondary', method:'plate', title:'Venison plate (1 portion of venison strips, 1–2 portions of broccoli, carrots and baby marrow).' }
    ], ctx);
  }

  function dinnerCandidates(ctx){
    const fishExamples = fishExamplesForCountry(ctx.profile.country);
    const fishExamplesText = fishExamples.length === 3 ? `${fishExamples[0]}, ${fishExamples[1]} or ${fishExamples[2]}` : fishExamples.join(' or ');
    return filteredMainCandidates([
      { key:'dinner_chicken_curry', proteinId:'chicken', bucket:'primary', method:'curry', title:'Chicken curry (1 portion of skinless chicken, 1–2 portions of spinach and carrots, cooked with stock, curry paste, herbs and spices) + 1 portion of rice' },
      { key:'dinner_beef_stew', proteinId:'beef', bucket:'primary', method:'stew', title:'Lean beef mince stew (1 portion of lean beef mince, 1–2 portions of carrots, baby marrow and spinach, cooked with stock, tomato paste, herbs and spices) + 1 portion of sweet potato' },
      { key:'dinner_chicken_soup', proteinId:'chicken', bucket:'primary', method:'soup', title:'Chicken soup (1 portion of skinless chicken, 1–2 portions of carrots, spinach and onion) + 1 portion of small pasta' },
      { key:'dinner_pork_stirfry', proteinId:'pork', bucket:'primary', method:'stirfry', title:'Pork stir fry (1 portion of lean pork strips, 1–2 portions of broccoli, carrots and baby marrow). You may add a small amount of sauce if needed. + 1 portion of rice' },
      { key:'dinner_venison_stirfry', proteinId:'venison', bucket:'secondary', method:'stirfry', title:'Venison stir fry (1 portion of venison strips, 1–2 portions of broccoli, carrots and baby marrow). You may add a small amount of sauce if needed. + 1 portion of rice' },
      { key:`dinner_baked_fish_${ctx.profile.country.toLowerCase()}`, proteinId:fishExamples[0] || 'salmon', bucket:'secondary', method:'baked_fish', title:`Baked fish meal (1 portion of fish such as ${fishExamplesText}, 1–2 portions of green beans, carrots and spinach) + 1 portion of sweet potato` }
    ], ctx);
  }

  function buildLunch(ctx){ const chosen = rand(lunchCandidates(ctx)); noteMainMeal(ctx, chosen); return meal({ mealType:'lunch', templateId:chosen.key, title:chosen.title, proteinId:chosen.proteinId, method:chosen.method, tags:[chosen.method, chosen.bucket] }); }
  function buildDinner(ctx){ const chosen = rand(dinnerCandidates(ctx)); noteMainMeal(ctx, chosen); return meal({ mealType:'dinner', templateId:chosen.key, title:chosen.title, proteinId:chosen.proteinId, method:chosen.method, tags:[chosen.method, chosen.bucket] }); }

  function snackCandidates(ctx){
    const fruit = fruitAt(ctx, 2);
    const candidates = [
      { key:'snack_yoghurt', title:'A cup of low-fat yoghurt', proteinId:'yoghurt', method:'single_protein' },
      { key:'snack_eggs', title:'2 x boiled eggs', proteinId:'eggs', method:'single_protein' },
      { key:'snack_biltong', title:'Biltong', proteinId:'biltong', method:'single_protein' },
      { key:'snack_tuna', title:'½ tin tuna in water – drained', proteinId:'tuna', method:'single_protein' },
      { key:'snack_cottage_berries', title:'Cottage cheese with berries', proteinId:'cottage_cheese', method:'protein_fruit' },
      { key:'snack_nuts', title:'A handful of nuts', proteinId:'nuts', method:'single_protein' },
      { key:'snack_fruit', title:`${fruit} – or a fruit of your choice`, proteinId:null, method:'single_fruit' }
    ];
    if(ctx.adjustments.supportMode && ctx.weekState.wheyCount < 1) candidates.push({ key:'snack_whey', title:'A whey protein shake', proteinId:'whey', method:'protein_shake' });
    return candidates;
  }
  function buildSnack(ctx){ const chosen = rand(snackCandidates(ctx)); if(chosen.proteinId==='whey') ctx.weekState.wheyCount += 1; return meal({ mealType:'snack', templateId:chosen.key, title:chosen.title, proteinId:chosen.proteinId, method:chosen.method, tags:[chosen.method] }); }

  function buildWeek(args={}){
    const ctx = makeContext(args);
    const start = weekStartDate();
    const week = [];
    for(let i=0;i<7;i++){
      const dayCtx = { ...ctx, dayIndex:i, seed:i+1 };
      const breakfast = buildBreakfast(dayCtx);
      const lunch = buildLunch(dayCtx);
      const dinner = buildDinner(dayCtx);
      const snack = dayCtx.profile.snackEnabled ? buildSnack(dayCtx) : null;
      const date = new Date(start); date.setDate(start.getDate()+i);
      week.push({ date: iso(date), dayName: DAY_NAMES[i], breakfast, lunch, dinner, snack });
    }
    return week;
  }

  function generateWeekPlan(args={}){ return { days: buildWeek(args) }; }
  function regenerateDay(args={}){ const week = args.week?.days ? structuredCloneSafe(args.week.days) : structuredCloneSafe(args.week || []); const rebuilt = buildWeek({ profile: args.profile || {}, adjustments: args.adjustments || {} }); return rebuilt[args.dayIndex || 0] || week[args.dayIndex || 0] || null; }
  function swapMeal(args={}){ const rebuilt = buildWeek({ profile: args.profile || {}, adjustments: args.adjustments || {} }); const day = rebuilt[args.dayIndex || 0] || null; if(!day) return null; if(args.slot==='breakfast') return day.breakfast; if(args.slot==='lunch') return day.lunch; if(args.slot==='dinner') return day.dinner; if(args.slot==='snack') return day.snack; return null; }

  const api = { buildWeek, generateWeekPlan, regenerateDay, swapMeal };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  if(typeof window !== 'undefined') window.HeartyMealsEngineV6 = api;
})();
