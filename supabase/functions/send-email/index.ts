// Supabase Edge Function: send-email
// Dispatches transactional emails via Brevo server-side
// Keeps BREVO_API_KEY secure in Supabase secrets; never exposed to browser

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
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
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'alumni-affairs@bcp.edu.ph';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'BCP Alumni Portal';

    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server email service not configured (missing BREVO_API_KEY)' }),
        { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Caller Authentication: Validate user JWT session
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let callerUserId: string | null = null;

    if (supabaseUrl && serviceRoleKey && authHeader && authHeader.startsWith('Bearer ')) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        callerUserId = user.id;
      }
    }

    // 3. Parse and validate payload
    let body: SendEmailPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body must be valid JSON' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { to, toName, subject, htmlContent } = body;

    if (!to || !EMAIL_REGEX.test(to.trim())) {
      return new Response(
        JSON.stringify({ error: 'Valid recipient email (to) is required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Email subject is required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!htmlContent || typeof htmlContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email htmlContent is required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Dispatch email through Brevo SMTP API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to.trim(), name: toName?.trim() || to.trim() }],
        subject: subject.trim(),
        htmlContent,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo API dispatch error:', responseData);
      return new Response(
        JSON.stringify({
          error: responseData.message || 'Failed to dispatch email via provider',
        }),
        { status: response.status, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Optional audit log for outbound email dispatch
    if (supabaseUrl && serviceRoleKey && callerUserId) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        await supabaseAdmin.from('audit_logs').insert({
          user_id: callerUserId,
          action: 'DISPATCH_EMAIL',
          details: {
            recipient: to.trim(),
            subject: subject.trim(),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (logErr) {
        console.warn('Audit logging error for dispatch_email:', logErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageId: responseData.messageId }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
