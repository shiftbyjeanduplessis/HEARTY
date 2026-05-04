(function () {
  const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_PROJECT_URL_HERE';
  const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_PUBLIC_KEY_HERE';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Hearty] Supabase library not loaded before config.');
    return;
  }

  if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  window.heartySupabase = window.supabaseClient;
})();
