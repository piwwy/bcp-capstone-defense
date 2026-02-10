import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

serve(async (req) => {
  try {
    const { record, old_record } = await req.json();

    // Condition: Isesend lang kung 'verified' na ang status
    if (record.status !== 'verified' || old_record.status === 'verified') {
      return new Response("Condition not met", { status: 200 });
    }

    // 1. INITIALIZE SUPABASE CLIENT (para makuha ang campaign title)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. FETCH CAMPAIGN TITLE GAMIT ANG campaign_id
    const { data: campaignData } = await supabase
      .from('donation_campaign_records') // Siguraduhin ang tamang table name dito
      .select('title')
      .eq('id', record.campaign_id)
      .single();

    const actualCampaignTitle = campaignData?.title || "LCP Fundraiser";

    // 3. SEND EMAIL VIA BREVO API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY || '',
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "LCP Alumni Association", email: "perrypesinocute@gmail.com" }, // Pwede mong palitan ito sa Brevo dashboard
        subject: `🎉 Contribution Verified: ${actualTitle}`,
        htmlContent: `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 48px 20px; text-align: center; color: white;">
              <div style="background: rgba(255,255,255,0.2); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <span style="font-size: 32px;">💚</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Donation Verified!</h1>
              <p style="margin-top: 8px; font-size: 16px; opacity: 0.9;">Thank you for your incredible generosity.</p>
            </div>
            
            <div style="padding: 40px; background-color: white;">
              <p style="font-size: 18px; color: #1e293b; margin-bottom: 16px;">Hi <b>${record.guest_name}</b>,</p>
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                We are thrilled to inform you that your contribution to the <b>${actualTitle}</b> has been officially verified! Your support directly impacts the lives of our current and future LCP students.
              </p>
              
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; text-align: center;">Official Transaction Details</h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 12px 0; color: #64748b;">Reference No.</td>
                    <td style="padding: 12px 0; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; color: #0f172a;">${record.reference_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b;">Amount Verified</td>
                    <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: 900; color: #059669;">₱${record.amount.toLocaleString()}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0; color: #64748b;">Date Processed</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a;">${new Date().toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 32px;">
                <p style="font-size: 14px; color: #64748b; font-style: italic;">
                  "The heart that gives, gathers."
                </p>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 8px;">
                  You may view your full donation history in your <a href="#" style="color: #059669; text-decoration: none; font-weight: bold;">Alumni Giving Hub</a>.
                </p>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Linker College of the Philippines Alumni Association<br>
                Official Financial Verification System • 2026
              </p>
            </div>
          </div>
        `
      })
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
});