// Supabase Edge Function: create-users
// Creates auth.users entries server-side using service_role key
// Restricted to authenticated admin / superadmin callers only

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { authenticateCaller } from '../_shared/auth.ts';

interface UserPayload {
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  course: string;
  batch_year: string;
  email: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    let body: { users: UserPayload[] };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body must be valid JSON' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { users } = body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users provided. Expected an array of users.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Cap at 50 users per batch to prevent execution timeout
    const batch = users.slice(0, 50);
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const user of batch) {
      const email = (user.email || '').trim().toLowerCase();
      const studentId = (user.student_id || '').trim();
      const firstName = (user.first_name || '').trim();
      const lastName = (user.last_name || '').trim();
      const userPassword = user.password || `${studentId}@Bcp2026!`;

      if (!email || !EMAIL_REGEX.test(email)) {
        results.push({ email: user.email || 'unknown', success: false, error: 'Invalid email format' });
        continue;
      }

      if (!firstName || !lastName) {
        results.push({ email, success: false, error: 'First name and last name are required' });
        continue;
      }

      try {
        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            student_id: studentId,
          },
        });

        if (authError) {
          if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
            results.push({ email, success: false, error: 'Account already exists' });
            continue;
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('User creation returned empty response');
        }

        // Step 2: Upsert profile record
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert(
            {
              id: authData.user.id,
              student_id: studentId || null,
              first_name: firstName,
              last_name: lastName,
              middle_name: user.middle_name?.trim() || null,
              course: user.course?.trim() || 'Unassigned',
              batch_year: user.batch_year?.toString() || new Date().getFullYear().toString(),
              email,
              role: 'alumni',
              status: 'master_list',
              auth_provider: 'email',
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error(`Profile upsert error for ${email}:`, profileError);
        }

        results.push({ email, success: true });
      } catch (err: any) {
        results.push({ email, success: false, error: err.message || 'Creation failed' });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Log batch creation action in audit trail
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: caller?.id,
        action: 'BATCH_CREATE_USERS',
        details: {
          total: batch.length,
          successCount,
          failCount,
          caller_role: caller?.role,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.warn('Non-fatal audit log failure:', auditErr);
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${batch.length} users: ${successCount} created, ${failCount} skipped/failed`,
        results,
        successCount,
        failCount,
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
