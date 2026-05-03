// Hearty Community Events — Supabase v1
(function () {
  const SAFE_EVENT_TYPES = new Set([
    'workout_complete',
    'weigh_in_logged',
    'meal_plan_generated',
    'support_mode_on',
    'lesson_complete'
  ]);

  async function getClient() {
    if (window.heartySupabase) return window.heartySupabase;
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase) return window.supabase;
    return null;
  }

  async function getUser(client) {
    try {
      const { data } = await client.auth.getUser();
      return data && data.user ? data.user : null;
    } catch {
      return null;
    }
  }

  window.heartyLogCommunityEvent = async function (eventType, data = {}) {
    if (!SAFE_EVENT_TYPES.has(eventType)) return false;

    const client = await getClient();
    if (!client) return false;

    const user = await getUser(client);
    if (!user) return false;

    const { data: settings } = await client
      .from('community_settings')
      .select('community_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!settings || settings.community_enabled !== true) return false;

    const { error } = await client.from('community_posts').insert({
      user_id: user.id,
      post_type: 'system_event',
      event_type: eventType,
      body: null,
      image_url: null,
      expires_at: null,
      metadata: data || {}
    });

    return !error;
  };
})();
