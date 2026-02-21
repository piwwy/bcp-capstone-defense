import { createClient } from '@supabase/supabase-js';

// HINAHIGOP nito ang laman ng .env file mo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_STORAGE_KEY = 'bcp-alumni-auth';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Error: Missing Environment Variables. Please check your .env file.');
}

// Fallback URL prevents createClient from throwing when .env is missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,       // Keep session in localStorage across reloads
      autoRefreshToken: true,     // Auto-refresh JWT before expiry
      detectSessionInUrl: true,   // Handle OAuth callback URLs
      storageKey: SUPABASE_STORAGE_KEY,  // Unique key to avoid conflicts
    },
  }
);
