import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_STORAGE_KEY = 'bcp-alumni-auth';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Error: Missing Environment Variables. Please check your .env file.');
}

// Safe storage wrapper for browsers and persistent tabs
const safeLocalStorage = typeof window !== 'undefined' ? window.localStorage : undefined;

// Create persistent Supabase client with auto-refresh and continuous session management
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,               // Keep session in localStorage across reloads & tab switches
      autoRefreshToken: true,             // Proactively auto-refresh JWT before expiry
      detectSessionInUrl: true,           // Handle OAuth / magic link callbacks
      storageKey: SUPABASE_STORAGE_KEY,   // Dedicated storage key to prevent session collisions
      storage: safeLocalStorage,          // Use localStorage explicitly
      flowType: 'pkce',                   // Secure PKCE flow
      // Prevent browser Web Locks (navigator.locks) deadlock in Chromium/Edge
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-client-info': 'bcp-alumni-portal-v2',
      },
    },
  }
);

// Mutex lock to prevent duplicate concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

/**
 * Safely refreshes the Supabase auth session.
 * Deduplicates concurrent refresh attempts and returns the active session.
 */
export async function refreshSupabaseSessionSafely() {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // If refresh fails, try getting current session before failing
        const { data: fallbackSession } = await supabase.auth.getSession();
        return fallbackSession?.session || null;
      }
      return data?.session || null;
    } catch (err) {
      console.warn('Session refresh encountered a transient issue:', err);
      const { data: fallbackSession } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      return fallbackSession?.session || null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Helper to check if an error is due to an expired or invalid JWT token.
 */
export function isJwtExpiredError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || error.details || error.hint || JSON.stringify(error)).toLowerCase();
  const code = String(error.code || error.status || '');

  return (
    msg.includes('jwt expired') ||
    msg.includes('token expired') ||
    msg.includes('invalid jwt') ||
    msg.includes('invalid refresh token') ||
    msg.includes('jwt') ||
    code === 'PGRST301' ||
    code === '401' ||
    code === '403'
  );
}

/**
 * Resilient query executor that automatically intercepts JWT expired / 401 errors,
 * refreshes the auth token in the background, and retries the query once.
 */
export async function executeWithTokenRefresh<T>(queryFn: () => Promise<T>): Promise<T> {
  try {
    const result = await queryFn();
    // Check if result is a Supabase response with an error
    if (result && typeof result === 'object' && 'error' in result && (result as any).error) {
      const err = (result as any).error;
      if (isJwtExpiredError(err)) {
        console.info('Intercepted expired JWT in query response. Auto-refreshing session and retrying...');
        await refreshSupabaseSessionSafely();
        return await queryFn();
      }
    }
    return result;
  } catch (error: any) {
    if (isJwtExpiredError(error)) {
      console.info('Intercepted expired JWT exception. Auto-refreshing session and retrying...');
      await refreshSupabaseSessionSafely();
      return await queryFn();
    }
    throw error;
  }
}
