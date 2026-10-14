// Supabase Edge Function: CORS configuration
export function getCorsHeaders(req?: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  const requestOrigin = req?.headers.get('Origin') || req?.headers.get('origin') || '*';

  // If specific origin configured, match it; otherwise reflect request origin or fallback
  const origin = allowedOrigin
    ? (allowedOrigin.split(',').map(o => o.trim()).includes(requestOrigin) ? requestOrigin : allowedOrigin.split(',')[0])
    : (requestOrigin !== '*' ? requestOrigin : '*');

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
