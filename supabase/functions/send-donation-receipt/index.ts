// Supabase Edge Function: send-donation-receipt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

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
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'alumni-affairs@bcp.edu.ph';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'BCP Alumni Affairs';
    const webhookSecret = Deno.env.get('DONATION_WEBHOOK_SECRET');

    // Authenticate webhook caller via secret if configured, or Bearer auth
    const incomingSecret = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization');

    if (webhookSecret && incomingSecret !== webhookSecret && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized webhook call' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { record, old_record } = await req.json();

    if (!record || record.status !== 'verified' || old_record?.status === 'verified') {
      return new Response(
        JSON.stringify({ message: 'Condition not met: Only newly verified donations trigger receipts' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch campaign title
    let actualCampaignTitle = 'BCP Alumni Giving Fund';
    if (record.campaign_id) {
      const { data: campaignData } = await supabase
        .from('donation_campaigns')
        .select('title')
        .eq('id', record.campaign_id)
        .single();
      if (campaignData?.title) {
        actualCampaignTitle = campaignData.title;
      }
    }

    let recipientEmail = record.guest_email || record.donor_email;
    let recipientName = record.guest_name || record.donor_name || 'Generous Donor';

    if (!recipientEmail && record.profile_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', record.profile_id)
        .single();
      if (profileData?.email) {
        recipientEmail = profileData.email;
        recipientName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || recipientName;
      }
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ message: 'No recipient email available for receipt' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!brevoApiKey) {
      console.warn('BREVO_API_KEY not configured. Skipping email dispatch.');
      return new Response(
        JSON.stringify({ message: 'Email service unconfigured' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipientEmail, name: recipientName }],
        subject: `Contribution Verified: ${actualCampaignTitle}`,
        htmlContent: `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Donation Verified</h1>
              <p style="margin-top: 8px; font-size: 14px; opacity: 0.9;">Thank you for your generous contribution.</p>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #1e293b;">Dear <b>${recipientName}</b>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                Your contribution to the <b>${actualCampaignTitle}</b> has been officially verified by the Alumni Affairs Office.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 4px 0; font-size: 13px; color: #64748b;">Reference Number: <b>${record.reference_number || 'N/A'}</b></p>
                <p style="margin: 4px 0; font-size: 18px; color: #059669; font-weight: bold;">Amount: ₱${Number(record.amount || 0).toLocaleString()}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                Bestlink College of the Philippines — Alumni Affairs Office
              </p>
            </div>
          </div>
        `,
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});