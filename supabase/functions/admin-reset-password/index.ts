// Supabase Edge Function: admin-reset-password
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { authenticateCaller } from '../_shared/auth.ts';

interface ResetPayload {
  userId: string;
  newPassword: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing API Keys.' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Strict caller authentication and authorization (admin/superadmin only)
    const { user: caller, errorResponse } = await authenticateCaller(
      req,
      supabaseAdmin,
      ['admin', 'superadmin', 'super_admin']
    );

    if (errorResponse) {
      return errorResponse;
    }

    // 3. Parse and validate JSON body
    let body: ResetPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body must be valid JSON' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, newPassword } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return new Response(
        JSON.stringify({ error: 'Valid userId (UUID) is required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update user password in Supabase Auth
    const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError || !updatedUserData.user) {
      return new Response(
        JSON.stringify({ error: updateError?.message || 'Failed to update user password' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Write to audit_logs
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: caller?.id,
        action: 'ADMIN_RESET_PASSWORD',
        target_id: userId,
        details: {
          target_email: updatedUserData.user.email,
          caller_role: caller?.role,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.warn('Non-fatal audit log failure:', auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password updated successfully.',
        userId: updatedUserData.user.id,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
