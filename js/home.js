(function(){
  const state = {
    session: null,
    profile: null,
    settings: null,
    access: null,
    today: new Date().toISOString().slice(0,10),
    hydrationTarget: 3000,
    hydrationToday: 0,
    latestWeight: null,
    badges: [],
    checkin: null
  };

  function q(id){ return document.getElementById(id); }
  function fmtDate(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined,{ weekday:'long', month:'short', day:'numeric'});
  }
  function showNotice(message, type='success'){
    const el = q('app-notice');
    el.className = `notice show ${type}`;
    el.textContent = message;
    setTimeout(()=>el.className='notice', 3500);
  }
  function calcHydrationTarget(weight, units='metric'){
    if (!weight || Number.isNaN(Number(weight))) return 3000;
    const kg = units === 'imperial' ? Number(weight) * 0.453592 : Number(weight);
    return Math.max(2000, Math.round(kg * 35));
  }
  function taskState(key){ return !!(state.checkin && state.checkin[key]); }
  function progressPercent(){
    const items = ['weigh_in_complete','walk_complete','lesson_complete'];
    const done = items.filter(taskState).length;
    const hydrationDone = state.hydrationToday >= state.hydrationTarget;
    return Math.round(((done + (hydrationDone ? 1 : 0)) / 4) * 100);
  }
  function ringStroke(percent){
    const circumference = 314.159;
    const active = circumference * percent / 100;
    return `${active} ${circumference}`;
  }
  function supportTitle(){
    if (!state.settings?.support_mode_enabled || !state.settings?.support_mode_type) return 'Support Mode is off';
    const raw = state.settings.support_mode_type;
    return `${raw.charAt(0).toUpperCase()}${raw.slice(1)} support active`;
  }
  function render(){
    q('hello-title').textContent = `Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${state.profile?.full_name?.split(' ')[0] || 'there'}`;
    q('hello-sub').textContent = `${fmtDate(state.today)} · ${supportTitle()}`;
    const percent = progressPercent();
    q('ring-progress').setAttribute('stroke-dasharray', ringStroke(percent));
    q('ring-percent').textContent = `${percent}%`;
    q('today-date').textContent = fmtDate(state.today);
    q('session-email').textContent = state.session?.user?.email || '—';
    q('theme-value').textContent = state.settings?.theme || 'clean';
    q('access-value').textContent = state.access?.hasAccess ? 'Active' : 'Pending';
    q('support-status').textContent = supportTitle();
    q('hydration-target-text').textContent = `${state.hydrationTarget} ml target`;
    q('hydration-total').textContent = `${state.hydrationToday} ml`;
    q('weight-value').textContent = state.latestWeight ? `${Number(state.latestWeight.weight).toFixed(1)} kg` : 'No log yet';
    q('weight-note').textContent = state.latestWeight ? `Logged ${new Date(state.latestWeight.logged_at).toLocaleDateString()}` : 'Add your first weigh-in';
    q('task-weigh').className = `task-toggle ${taskState('weigh_in_complete') ? 'done' : ''}`;
    q('task-weigh').textContent = taskState('weigh_in_complete') ? 'Done' : 'Mark done';
    q('task-walk').className = `task-toggle ${taskState('walk_complete') ? 'done' : ''}`;
    q('task-walk').textContent = taskState('walk_complete') ? 'Done' : 'Mark done';
    q('task-lesson').className = `task-toggle ${taskState('lesson_complete') ? 'done' : ''}`;
    q('task-lesson').textContent = taskState('lesson_complete') ? 'Done' : 'Mark done';
    const hydPct = Math.min(100, Math.round((state.hydrationToday / state.hydrationTarget) * 100));
    q('hydration-bar').style.width = `${hydPct}%`;
    q('hydration-note').textContent = hydPct >= 100 ? 'Target reached' : `${Math.max(0, state.hydrationTarget - state.hydrationToday)} ml to go`;
    Array.from(document.querySelectorAll('.support-chip')).forEach((btn) => {
      const active = !!state.settings?.support_mode_enabled && state.settings?.support_mode_type === btn.dataset.type;
      btn.classList.toggle('active', active);
    });
    q('support-off').classList.toggle('active', !state.settings?.support_mode_enabled);
    const settingsEl = q('settings-lines');
    settingsEl.innerHTML = [
      ['Meal frequency', state.settings?.meal_frequency ?? '—'],
      ['Dietary mode', state.settings?.dietary_mode ?? '—'],
      ['Exercise mode', state.settings?.exercise_mode ?? '—'],
      ['Units', state.settings?.units ?? '—'],
      ['Leftovers', state.settings?.leftovers_enabled ? 'On' : 'Off'],
      ['Access level', state.profile?.access_level || 'pending']
    ].map(([k,v])=>`<div class="stat-line"><span>${k}</span><strong>${v}</strong></div>`).join('');
    const badgeWrap = q('badge-list');
    if (!state.badges.length){
      badgeWrap.innerHTML = '<div class="badge-row"><div class="badge-coin">★</div><div class="badge-copy"><strong>No badges yet</strong><span>Your latest three badges will appear here once earned.</span></div></div>';
    } else {
      badgeWrap.innerHTML = state.badges.map((badge) => `
        <div class="badge-row">
          <div class="badge-coin">★</div>
          <div class="badge-copy"><strong>${badge.badge_slug.replace(/_/g,' ')}</strong><span>Earned ${new Date(badge.earned_at).toLocaleDateString()}</span></div>
        </div>
      `).join('');
    }
  }

  async function loadDashboard(){
    state.session = await window.HEARTY.getSession();
    state.profile = await window.HEARTY.getProfile(state.session.user.id);
    state.settings = await window.HEARTY.getSettings(state.session.user.id);
    state.access = await window.HEARTY.getAccessState(state.session.user.id);
    state.latestWeight = await window.HEARTY.getLatestWeight(state.session.user.id);
    state.hydrationToday = await window.HEARTY.getHydrationForDate(state.session.user.id, state.today);
    state.checkin = await window.HEARTY.getOrCreateDailyCheckin(state.session.user.id, state.today);
    state.badges = await window.HEARTY.getLatestBadges(state.session.user.id);
    const baseWeight = state.latestWeight?.weight || state.settings?.starting_weight;
    state.hydrationTarget = calcHydrationTarget(baseWeight, state.settings?.units || 'metric');
    render();
  }

  async function toggleTask(field){
    const next = !taskState(field);
    state.checkin = await window.HEARTY.updateDailyCheckin(state.session.user.id, state.today, { [field]: next });
    render();
  }

  async function submitWeight(e){
    e.preventDefault();
    const value = Number(q('weight-input').value);
    if (!value) return showNotice('Enter a weight first.', 'error');
    await window.HEARTY.logWeight(state.session.user.id, value, q('weight-note-input').value || null);
    state.latestWeight = await window.HEARTY.getLatestWeight(state.session.user.id);
    state.checkin = await window.HEARTY.updateDailyCheckin(state.session.user.id, state.today, { weigh_in_complete: true });
    state.hydrationTarget = calcHydrationTarget(state.latestWeight.weight, state.settings?.units || 'metric');
    q('weight-form').reset();
    render();
    showNotice('Weight logged.');
  }

  async function addHydration(amount){
    await window.HEARTY.addHydration(state.session.user.id, amount);
    state.hydrationToday = await window.HEARTY.getHydrationForDate(state.session.user.id, state.today);
    render();
    showNotice(`${amount} ml added.`);
  }

  async function setSupport(type){
    const enable = type !== 'off';
    const patch = { support_mode_enabled: enable, support_mode_type: enable ? type : null };
    state.settings = await window.HEARTY.updateSettings(state.session.user.id, patch);
    render();
    showNotice(enable ? `${type} support switched on.` : 'Support Mode switched off.');
  }

  function wireEvents(){
    q('weight-form').addEventListener('submit', submitWeight);
    q('task-weigh').addEventListener('click', ()=>toggleTask('weigh_in_complete'));
    q('task-walk').addEventListener('click', ()=>toggleTask('walk_complete'));
    q('task-lesson').addEventListener('click', ()=>toggleTask('lesson_complete'));
    q('water-250').addEventListener('click', ()=>addHydration(250));
    q('water-500').addEventListener('click', ()=>addHydration(500));
    q('water-custom-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const value = Number(q('water-custom-input').value);
      if (!value) return showNotice('Enter a hydration amount first.', 'error');
      await addHydration(value);
      q('water-custom-form').reset();
    });
    Array.from(document.querySelectorAll('.support-chip[data-type]')).forEach((btn)=>btn.addEventListener('click', ()=>setSupport(btn.dataset.type)));
    q('support-off').addEventListener('click', ()=>setSupport('off'));
    q('logout-button').addEventListener('click', async ()=>{
      await window.HEARTY.signOut();
      window.location.href = 'login.html';
    });
    Array.from(document.querySelectorAll('.nav-btn')).forEach((btn)=>btn.addEventListener('click', ()=>{
      Array.from(document.querySelectorAll('.nav-btn')).forEach((b)=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      Array.from(document.querySelectorAll('[data-screen]')).forEach((screen)=>screen.classList.toggle('hidden', screen.dataset.screen !== view));
    }));
  }

  async function boot(){
    try{
      const result = await window.HEARTY.authRedirect();
      if(!result) return;
      wireEvents();
      await loadDashboard();
    }catch(error){
      q('home-screen').innerHTML = `<div class="notice show error">${error.message}</div>`;
    }
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
