(function(){
  const STORAGE_KEY = 'heartyMealsLatestEnginePageV1';
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const slots = ['breakfast','lunch','dinner','snack'];
  const $ = (id) => document.getElementById(id);
  const todayLabelEl = $('todayLabel');
  const dayCurrentBtn = $('dayCurrentBtn');
  const dayPrevBtn = $('dayPrevBtn');
  const dayNextBtn = $('dayNextBtn');
  const dayTabsEl = $('dayTabs');
  const todayMealsEl = $('todayMeals');
  const proteinRingEl = $('proteinRing');
  const proteinCopyEl = $('proteinCenterCopy');
  const proteinMiniEl = $('proteinMini');
  const generateWeekBtn = $('generateWeekBtn');
  const downloadWeekBtn = $('downloadWeekBtn');
  const downloadMonthBtn = $('downloadMonthBtn');
  function getEngine(){ return window.HeartyMealsEngineV6 || null; }
  const requiredEls = [todayLabelEl, dayCurrentBtn, dayPrevBtn, dayNextBtn, dayTabsEl, todayMealsEl, proteinRingEl, proteinCopyEl, proteinMiniEl, generateWeekBtn, downloadWeekBtn, downloadMonthBtn];
  if (requiredEls.some((el) => !el)) {
    console.warn('Meals page did not start because a required DOM element is missing.');
    return;
  }
  const CIRCUMFERENCE = 2 * Math.PI * 54;
  let currentDayIndex = 0;

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
  function canUseLocalStorage(){
    try{ localStorage.setItem('__hm_probe__','1'); localStorage.removeItem('__hm_probe__'); return true; }
    catch(err){ return false; }
  }
  const HAS_LOCAL_STORAGE = canUseLocalStorage();

  function defaultProfile(){
    return {
      country: 'ZA',
      allowedFruits: ['banana','apple','grapes','pineapple','berries'],
      snackEnabled: true,
      seafoodAllowed: true
    };
  }

  function loadState(){
    if(!HAS_LOCAL_STORAGE) return {};
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch(err){ return {}; }
  }
  function saveState(state){
    if(HAS_LOCAL_STORAGE){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(err){}
    }
    return state;
  }
  function ensureState(){
    const state = loadState();
    if(!state.profile) state.profile = defaultProfile();
    if(!state.adjustments) state.adjustments = { supportMode: null };
    if(typeof state.dayIndex !== 'number') state.dayIndex = 0;
    if(!state.week || !Array.isArray(state.week.days) || !state.week.days.length){
      const engine = getEngine();
      if(!engine){ return state; }
      state.week = engine.generateWeekPlan({ profile: state.profile, adjustments: state.adjustments });
    }
    if(!state.metaByDay) state.metaByDay = {};
    saveState(state);
    return state;
  }

  function slotPretty(slot){
    return ({ breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' })[slot] || slot;
  }
  function mealDescription(meal){
    const parts = [];
    if(meal?.method) parts.push(String(meal.method).replace(/_/g,' '));
    if(Array.isArray(meal?.tags) && meal.tags.length) parts.push(meal.tags.filter(Boolean).join(' • '));
    return parts.join(' • ');
  }
  function getDayMeta(state, dayIndex){
    if(!state.metaByDay[dayIndex]) state.metaByDay[dayIndex] = { lockedSlots: [] };
    return state.metaByDay[dayIndex];
  }
  function isSlotLocked(state, dayIndex, slot){
    return getDayMeta(state, dayIndex).lockedSlots.includes(slot);
  }

  function niceDayLabel(index){
    const state = ensureState();
    const day = state.week.days[index];
    return day?.dayName || DAY_NAMES[index] || ('Day ' + (index + 1));
  }

  function renderDayTabs(){
    const state = ensureState();
    dayTabsEl.innerHTML = state.week.days.map((day, index) => {
      const active = index === currentDayIndex ? ' active' : '';
      const short = (day.dayName || DAY_NAMES[index] || 'Day').slice(0,3);
      const date = (day.date || '').slice(-2) || String(index+1).padStart(2,'0');
      return `<button class="day-tab${active}" type="button" data-day-index="${index}"><span class="dt-wd">${short}</span><span class="dt-d">${date}</span></button>`;
    }).join('');
    dayTabsEl.querySelectorAll('[data-day-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentDayIndex = Number(btn.getAttribute('data-day-index')) || 0;
        const state = ensureState();
        state.dayIndex = currentDayIndex;
        saveState(state);
        render();
      });
    });
  }

  function renderProtein(day){
    const meals = ['breakfast','lunch','dinner'].map((slot) => day?.[slot]).filter(Boolean);
    const score = meals.reduce((sum, meal) => sum + (meal?.proteinId ? 1 : 0), 0);
    const pct = Math.max(0, Math.min(1, score / 3));
    proteinRingEl.style.strokeDasharray = String(CIRCUMFERENCE);
    proteinRingEl.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
    proteinCopyEl.textContent = `${score} of 3`;
    proteinMiniEl.innerHTML = ['Breakfast','Lunch','Dinner'].map((label, index) => {
      const done = index < score ? ' done' : '';
      return `<div class="protein-chip${done}"><div class="protein-chip-left"><div class="protein-dot"></div><div class="protein-name">${label}</div></div><div class="protein-state">${index < score ? 'Done' : 'Pending'}</div></div>`;
    }).join('');
  }

  function renderMeals(day, dayIndex){
    const state = ensureState();
    todayMealsEl.innerHTML = '';
    slots.forEach((slot) => {
      const meal = day?.[slot];
      if(!meal) return;
      const locked = isSlotLocked(state, dayIndex, slot);
      const card = document.createElement('article');
      card.className = ['meal-card', locked ? 'locked' : ''].filter(Boolean).join(' ');
      card.innerHTML = `
        <div class="meal-top">
          <div class="meal-slot"><div class="meal-slot-time">${slotPretty(slot)}</div></div>
          <div class="meal-heading">
            <div class="meal-label">${slotPretty(slot).toUpperCase()}</div>
            <div class="meal-title">${meal.title || 'Meal'}</div>
            <div class="meal-desc">${mealDescription(meal)}</div>
          </div>
          <div class="meal-badge protein-badge">${Number(meal.proteinEstimate || 0)}g</div>
        </div>
        <div class="meal-meta">${(meal.tags || []).map((tag) => `<span class="meta-pill">${tag}</span>`).join('')}</div>
        <div class="meal-actions">
          <button class="meal-btn secondary${locked ? ' locked-btn' : ''}" type="button" data-action="lock" data-slot="${slot}">${locked ? 'Locked' : 'Lock meal'}</button>
          <button class="meal-btn secondary" type="button" data-action="swap" data-slot="${slot}">Swap meal</button>
        </div>`;
      todayMealsEl.appendChild(card);
    });
    todayMealsEl.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = btn.getAttribute('data-slot');
        const action = btn.getAttribute('data-action');
        if(action === 'lock') toggleMealLocked(dayIndex, slot);
        if(action === 'swap') swapMeal(dayIndex, slot);
      });
    });
  }


  function toggleMealLocked(dayIndex, slot){
    const state = ensureState();
    const meta = getDayMeta(state, dayIndex);
    meta.lockedSlots = meta.lockedSlots.includes(slot) ? meta.lockedSlots.filter((s) => s !== slot) : meta.lockedSlots.concat(slot);
    saveState(state);
    render();
  }

  function swapMeal(dayIndex, slot){
    const state = ensureState();
    const engine = getEngine();
    if(!engine) return null;
    const swapped = engine.swapMeal({
      week: state.week,
      dayIndex,
      slot,
      profile: state.profile,
      adjustments: state.adjustments
    });
    if(!swapped) return;
    state.week.days[dayIndex][slot] = swapped;
    saveState(state);
    render();
  }

  function regenerateWeek(){
    const state = ensureState();
    const existingDays = state.week.days || [];
    const engine = getEngine();
    if(!engine) return;
    const rebuilt = engine.generateWeekPlan({ profile: state.profile, adjustments: state.adjustments });
    rebuilt.days = rebuilt.days.map((day, dayIndex) => {
      const prevDay = existingDays[dayIndex] || {};
      const locked = getDayMeta(state, dayIndex).lockedSlots || [];
      const merged = clone(day);
      locked.forEach((slot) => {
        if(prevDay[slot]) merged[slot] = clone(prevDay[slot]);
      });
      return merged;
    });
    state.week = rebuilt;
    saveState(state);
    render();
  }

  function collectShoppingItems(days){
    const items = [];
    (days || []).forEach((day) => {
      slots.forEach((slot) => {
        const meal = day?.[slot];
        if(meal?.title) items.push([slotPretty(slot), meal.title]);
      });
    });
    return items;
  }

  function escapePrintCell(value){
    return String(value ?? '').replace(/[&<>"']/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);
    });
  }

  function printList(title, rows){
    const safeTitle = escapePrintCell(title);
    const bodyRows = (rows || []).map((r) => {
      return '<tr><td>' + escapePrintCell(r[0]) + '</td><td>' + escapePrintCell(r[1]) + '</td></tr>';
    }).join('');
    const template = document.getElementById('mealPrintTemplate');
    if(!template) return;
    const html = template.innerHTML
      .replaceAll('{{TITLE}}', safeTitle)
      .replace('{{ROWS}}', bodyRows);
    const win = window.open('', '_blank');
    if(!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  function render(){
    const engine = getEngine();
    if(!engine){
      todayMealsEl.innerHTML = '<article class="meal-card meal-engine-error"><div class="meal-top"><div class="meal-slot"><div class="meal-slot-time">Error</div></div><div class="meal-heading"><div class="meal-label">MEALS ENGINE</div><div class="meal-title">Meal engine file not found</div><div class="meal-desc">Keep meals-engine.js and meals-main.js in the same folder as meals.html.</div></div><div class="meal-badge optional-badge">Fix</div></div></article>';
      return;
    }
    const state = ensureState();
    currentDayIndex = Math.max(0, Math.min(6, state.dayIndex || 0));
    const day = state.week.days[currentDayIndex];
    todayLabelEl.textContent = niceDayLabel(currentDayIndex);
    dayCurrentBtn.textContent = niceDayLabel(currentDayIndex);
    renderDayTabs();
    renderProtein(day);
    renderMeals(day, currentDayIndex);
  }

  dayPrevBtn.addEventListener('click', () => {
    const state = ensureState();
    currentDayIndex = (currentDayIndex + 6) % 7;
    state.dayIndex = currentDayIndex;
    saveState(state);
    render();
  });
  dayNextBtn.addEventListener('click', () => {
    const state = ensureState();
    currentDayIndex = (currentDayIndex + 1) % 7;
    state.dayIndex = currentDayIndex;
    saveState(state);
    render();
  });
  dayCurrentBtn.addEventListener('click', () => {
    const state = ensureState();
    currentDayIndex = 0;
    state.dayIndex = 0;
    saveState(state);
    render();
  });
  generateWeekBtn.addEventListener('click', regenerateWeek);
  downloadWeekBtn.addEventListener('click', () => {
    const state = ensureState();
    printList('7-Day Shopping List', collectShoppingItems(state.week.days));
  });
  downloadMonthBtn.addEventListener('click', () => {
    const state = ensureState();
    const rows = [];
    for(let i = 0; i < 4; i += 1) rows.push(...collectShoppingItems(state.week.days));
    printList('30-Day Shopping List', rows);
  });

  window.HeartyMealsPage = {
    regenerateWeek,
    getWeek: () => ensureState().week,
    getEngine
  };

  render();
})();
