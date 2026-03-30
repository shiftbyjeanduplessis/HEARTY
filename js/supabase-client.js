
(function () {
  const cfg = window.HEARTY_CONFIG || {};
  const hasConfig = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;

  function requireConfig() {
    if (!hasConfig) {
      throw new Error('Supabase config is missing. Copy js/config.example.js to js/config.js and add your project URL and anon key.');
    }
  }

  function getClient() {
    requireConfig();
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase library failed to load.');
    }
    if (!client) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  }

  async function signUp({ email, password, fullName }) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const supabase = getClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const supabase = getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const supabase = getClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function ensureProfile(user, fullName) {
    const supabase = getClient();
    const payload = {
      id: user.id,
      email: user.email,
      full_name: fullName || user.user_metadata?.full_name || '',
      theme: 'clean',
      onboarding_complete: false
    };
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  }

  async function ensureUserSettings(userId) {
    const supabase = getClient();
    const payload = {
      user_id: userId,
      target_weight: null,
      meal_frequency: 3,
      leftovers_enabled: false,
      dietary_mode: 'balanced',
      exercise_mode: 'home',
      support_mode_enabled: false,
      support_mode_type: null,
      units: 'metric'
    };
    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async function getProfile(userId) {
    const supabase = getClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getSettings(userId) {
    const supabase = getClient();
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }



  async function updateSettings(userId, patch) {
    const supabase = getClient();
    const payload = { user_id: userId, ...patch };
    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    return getSettings(userId);
  }

  async function getLatestWeight(userId) {
    const supabase = getClient();
    const { data, error } = await supabase.from('weight_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function logWeight(userId, weight, note) {
    const supabase = getClient();
    const { error } = await supabase.from('weight_logs').insert({ user_id: userId, weight, note: note || null });
    if (error) throw error;
  }

  async function getHydrationForDate(userId, dateStr) {
    const supabase = getClient();
    const start = `${dateStr}T00:00:00`;
    const end = `${dateStr}T23:59:59.999`;
    const { data, error } = await supabase.from('hydration_logs').select('amount_ml').eq('user_id', userId).gte('logged_at', start).lte('logged_at', end);
    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + Number(row.amount_ml || 0), 0);
  }

  async function addHydration(userId, amountMl) {
    const supabase = getClient();
    const { error } = await supabase.from('hydration_logs').insert({ user_id: userId, amount_ml: amountMl });
    if (error) throw error;
  }

  async function getOrCreateDailyCheckin(userId, dateStr) {
    const supabase = getClient();
    const { data, error } = await supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('date', dateStr).maybeSingle();
    if (error) throw error;
    if (data) return data;
    const { data: inserted, error: insertError } = await supabase.from('daily_checkins').insert({ user_id: userId, date: dateStr }).select('*').single();
    if (insertError) throw insertError;
    return inserted;
  }

  async function updateDailyCheckin(userId, dateStr, patch) {
    const supabase = getClient();
    await getOrCreateDailyCheckin(userId, dateStr);
    const { error } = await supabase.from('daily_checkins').update(patch).eq('user_id', userId).eq('date', dateStr);
    if (error) throw error;
    const { data, error: reloadError } = await supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('date', dateStr).single();
    if (reloadError) throw reloadError;
    return data;
  }

  async function getLatestBadges(userId, limit = 3) {
    const supabase = getClient();
    const { data, error } = await supabase.from('user_badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function completeOnboarding(userId, profilePatch, settingsPatch) {
    const supabase = getClient();
    const { error: profileError } = await supabase.from('profiles').update({ ...profilePatch, onboarding_complete: true }).eq('id', userId);
    if (profileError) throw profileError;
    const { error: settingsError } = await supabase.from('user_settings').upsert({ user_id: userId, ...settingsPatch }, { onConflict: 'user_id' });
    if (settingsError) throw settingsError;
  }

  async function authRedirect() {
    const session = await getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    const profile = await getProfile(session.user.id);
    if (!profile || !profile.onboarding_complete) {
      window.location.href = 'onboarding.html';
      return null;
    }
    return { session, profile };
  }

  window.HEARTY = {
    hasConfig,
    getClient,
    signUp,
    signIn,
    signOut,
    getSession,
    getUser,
    ensureProfile,
    ensureUserSettings,
    getProfile,
    getSettings,
    updateSettings,
    getLatestWeight,
    logWeight,
    getHydrationForDate,
    addHydration,
    getOrCreateDailyCheckin,
    updateDailyCheckin,
    getLatestBadges,
    completeOnboarding,
    authRedirect
  };
})();
