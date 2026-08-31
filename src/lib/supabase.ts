import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = 'ztdfzpyxurdpljzphhgz';
const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

function normalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SUPABASE_URL;
  let url = rawUrl.trim();
  if (!url || url === '""' || url === "''") return DEFAULT_SUPABASE_URL;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.')) {
      url = `https://${url}`;
    } else {
      url = `https://${url}.supabase.co`;
    }
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SUPABASE_URL;
}

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

const supabaseUrl = normalizeUrl(metaEnv.VITE_SUPABASE_URL);
const supabaseAnonKey = typeof metaEnv.VITE_SUPABASE_ANON_KEY === 'string' ? metaEnv.VITE_SUPABASE_ANON_KEY.trim() : '';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns an initialized Supabase client instance (or null if anon key is not yet provided).
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient && supabaseAnonKey && supabaseAnonKey.length > 10 && supabaseUrl.startsWith('http')) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Supabase initialization warning:', err);
    }
  }
  return supabaseClient;
}

export const isSupabaseConfigured = Boolean(supabaseAnonKey && supabaseAnonKey.length > 10);
export const SUPABASE_CONFIG = {
  projectId: SUPABASE_PROJECT_ID,
  region: 'ap-southeast-2 (Oceania Sydney)',
  url: supabaseUrl,
};
