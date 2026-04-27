import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://mdsfcnocvelwqiercyci.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc2Zjbm9jdmVsd3FpZXJjeWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTEzNjAsImV4cCI6MjA5MjY4NzM2MH0.TWRwj66PtVhBuf5Ov7AHteNFww1hrCQZuD5ZmEflC5M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Launch stability: expose the initialized client for non-module bridge files.
try {
  window.supabaseClient = supabase;
  window.heartySupabase = supabase;
  window.supabase = supabase;
} catch (error) {
  console.warn("Supabase client initialized, but could not expose it globally:", error);
}
