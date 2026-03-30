
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
    completeOnboarding,
    authRedirect
  };
})();
