import { createClient } from '@supabase/supabase-js';

let _client = null;

export async function getSupabase() {
  if (_client) return _client;

  let url, anonKey;

  // Electron: get config via IPC
  if (typeof window !== 'undefined' && window.ipc?.invoke) {
    const cfg = await window.ipc.invoke('supabase:config');
    url = cfg.url; anonKey = cfg.anonKey;
  } else {
    const res = await fetch('/api/config');
    const cfg  = await res.json();
    url = cfg.supabaseUrl; anonKey = cfg.supabaseAnonKey;
  }

  if (!url || !anonKey) throw new Error('Supabase not configured');
  _client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}
