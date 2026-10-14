import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from './cors.ts';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
}

/**
 * Validates the caller's JWT, verifies their role from the database,
 * and ensures they have permissions to execute the edge function.
 */
export async function authenticateCaller(
  req: Request,
  supabaseAdmin: SupabaseClient,
  allowedRoles: string[] = ['admin', 'superadmin', 'super_admin']
): Promise<{ user?: AuthenticatedUser; errorResponse?: Response }> {
  const cors = getCorsHeaders(req);
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session token' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Verify role strictly from the database profile, never trusting client metadata
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (profileError || !normalizedAllowed.includes(userRole)) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient administrative privileges' }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: userRole,
    },
  };
}
