(function () {
  const SUPABASE_URL = 'https://mdsfcnocvelwqiercyci.supabase.co';
  const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Hearty] Supabase library not loaded.');
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.heartySupabase = window.supabaseClient;
})();
