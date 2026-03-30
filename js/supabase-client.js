(function () {
  const cfg = window.HEARTY_CONFIG || {};
  const hasConfig = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;

  function requireConfig() {
    if (!hasConfig) {
      throw new Error(
        'Supabase config is missing. Copy js/config.example.js to js/config.js and add your project URL and anon key.'
      );
    }
  }

  function getClient() {
    requireConfig();

    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase library failed to load.');
    }

    if (!client) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

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

  async function getProfile(userId) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function ensureProfile(user, fullName) {
    const supabase = getClient();
    const existing = await getProfile(user.id);

    if (existing) {
      const patch = {};

      if (!existing.email && user.email) {
        patch.email = user.email;
      }

      if (
        (!existing.full_name || existing.full_name.trim() === '') &&
        (fullName || user.user_metadata?.full_name)
      ) {
        patch.full_name = fullName || user.user_metadata?.full_name || '';
      }

      if (Object.keys(patch).length) {
        const { error } = await supabase
          .from('profiles')
          .update(patch)
          .eq('id', user.id);

        if (error) throw error;
      }

      return getProfile(user.id);
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: fullName || user.user_metadata?.full_name || '',
      account_type: 'user',
      tester_flag: false,
      source: 'app_signup'
    };

    const { error } = await supabase.from('profiles').insert(payload);
    if (error) throw error;

    return getProfile(user.id);
  }

  async function getSettings(userId) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function ensureUserSettings(userId) {
    const supabase = getClient();

    const payload = {
      user_id: userId,
      onboarding_complete: false,
      theme: 'clean',
      target_weight: null,
      starting_weight: null,
      meal_frequency: 3,
      leftovers_enabled: false,
      dietary_mode: 'balanced',
      exercise_mode: 'home',
      support_mode_enabled: false,
      support_mode_type: null,
      units: 'metric'
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
    return getSettings(userId);
  }

  async function updateSettings(userId, patch) {
    const supabase = getClient();
    const payload = { user_id: userId, ...patch };

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
    return getSettings(userId);
  }

  async function getActiveAccessGrant(userId) {
    const supabase = getClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('access_grants')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && !String(error.message || '').toLowerCase().includes('does not exist')) {
      throw error;
    }

    return data || null;
  }

  function hasProfileAccess(profile, grant) {
    if (!profile) return false;
    if (profile.tester_flag) return true;
    if (grant) return true;
    if (profile.access_expires_at && new Date(profile.access_expires_at).getTime() > Date.now()) {
      return true;
    }
    return false;
  }

  async function getAccessState(userId) {
    const profile = await getProfile(userId);
    const grant = await getActiveAccessGrant(userId);

    return {
      profile,
      grant,
      hasAccess: hasProfileAccess(profile, grant)
    };
  }

  async function getLatestWeight(userId) {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function logWeight(userId, weight, note) {
    const supabase = getClient();

    const { error } = await supabase.from('weight_logs').insert({
      user_id: userId,
      weight,
      note: note || null
    });

    if (error) throw error;
  }

  async function getHydrationForDate(userId, dateStr) {
    const supabase = getClient();
    const start = `${dateStr}T00:00:00`;
    const end = `${dateStr}T23:59:59.999`;

    const { data, error } = await supabase
      .from('hydration_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .gte('logged_at', start)
      .lte('logged_at', end);

    if (error) throw error;

    return (data || []).reduce((sum, row) => sum + Number(row.amount_ml || 0), 0);
  }

  async function addHydration(userId, amountMl) {
    const supabase = getClient();

    const { error } = await supabase.from('hydration_logs').insert({
      user_id: userId,
      amount_ml: amountMl
    });

    if (error) throw error;
  }

  async function getOrCreateDailyCheckin(userId, dateStr) {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: userId,
        date: dateStr
      })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return inserted;
  }

  async function updateDailyCheckin(userId, dateStr, patch) {
    const supabase = getClient();

    await getOrCreateDailyCheckin(userId, dateStr);

    const { error } = await supabase
      .from('daily_checkins')
      .update(patch)
      .eq('user_id', userId)
      .eq('date', dateStr);

    if (error) throw error;

    const { data, error: reloadError } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    if (reloadError) throw reloadError;
    return data;
  }

  async function getLatestBadges(userId, limit = 3) {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async function completeOnboarding(userId, profilePatch, settingsPatch) {
    const supabase = getClient();

    if (profilePatch && Object.keys(profilePatch).length) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePatch)
        .eq('id', userId);

      if (profileError) throw profileError;
    }

    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          onboarding_complete: true,
          ...settingsPatch
        },
        { onConflict: 'user_id' }
      );

    if (settingsError) throw settingsError;
  }

  async function authRedirect() {
    const session = await getSession();

    if (!session) {
      window.location.href = 'login.html';
      return null;
    }

    let settings = await getSettings(session.user.id);
    if (!settings) {
      settings = await ensureUserSettings(session.user.id);
    }

    if (!settings.onboarding_complete) {
      window.location.href = 'onboarding.html';
      return null;
    }

    const access = await getAccessState(session.user.id);

    return {
      session,
      settings,
      access
    };
  }

  window.HEARTY = {
    hasConfig,
    getClient,
    signUp,
    signIn,
    signOut,
    getSession,
    getUser,
    getProfile,
    ensureProfile,
    getSettings,
    ensureUserSettings,
    updateSettings,
    getActiveAccessGrant,
    getAccessState,
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
