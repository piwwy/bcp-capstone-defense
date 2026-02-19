// ================================================================
// LCP Alumni Portal — Email Service (Brevo / Sendinblue API)
// ================================================================
// Aligned with Admin-Provided Accounts workflow.
// No public registration = no welcome/verification emails.
//
// Available Email Functions:
//   1. sendAccountReadyEmail    — Admin creates account → notify alumni with credentials
//   2. sendOTPEmail             — 2FA login verification code
//   3. sendNewsletterUpdate     — Broadcast newsletter to subscribers
//   4. sendJobAlert             — Career opportunity matching alumni course
//   5. sendDonationMilestone    — Thank you when a campaign reaches its goal
//   6. sendTracerSurveyEmail    — Annual tracer study / employment update
//   7. sendPasswordResetEmail   — Password reset link
//   8. sendPasswordResetCode    — Admin-initiated password reset OTP
//   9. sendNewCredentialsEmail  — Admin reset password → send new creds
//   10. sendRejectionEmail      — Account rejection (kept for legacy use)
//   11. sendApprovalEmail       — Account approval (kept for legacy use)
// ================================================================

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'perrypesinocute@gmail.com';
const BREVO_SENDER_NAME = import.meta.env.VITE_BREVO_SENDER_NAME || 'LCP Alumni Portal';

// Helper: get base URL of the deployed application
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://alumnibcpportal.netlify.app';
};

// Shared email header/footer for consistent branding
const emailHeader = (title: string, emoji: string = '🎓') => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${emoji} ${title}</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 0.5px;">Linker College of the Philippines</p>
        </td>
      </tr>
`;

const emailFooter = () => `
      <tr>
        <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px 0;">
            Linker College of the Philippines — Alumni Affairs Office
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} LCP Alumni Portal. All rights reserved.
          </p>
          <p style="color: #4b5563; font-size: 11px; margin: 8px 0 0 0;">
            Protected under RA 10173 (Data Privacy Act of 2012)
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

interface EmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export const EmailService = {
  // ============================================================
  // CORE: Send raw email via Brevo API
  // ============================================================
  sendEmail: async ({ to, toName, subject, htmlContent }: EmailParams): Promise<{ success: boolean; error?: string }> => {
    if (!BREVO_API_KEY) {
      console.error('❌ VITE_BREVO_API_KEY is missing in your .env file!');
      return { success: false, error: 'Email service configuration missing (BREVO_API_KEY)' };
    }

    console.log(`📧 Sending email to ${to}...`);

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
          to: [{ email: to, name: toName }],
          subject,
          htmlContent,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ Brevo API Error:', responseData);
        return { success: false, error: responseData.message || `Brevo Error: ${response.status}` };
      }

      console.log('✅ Email sent successfully via Brevo!');
      return { success: true };
    } catch (error: any) {
      console.error('Email service catch error:', error);
      return { success: false, error: error.message || 'Network error while sending email' };
    }
  },

  // ============================================================
  // 1. ACCOUNT READY — Replaces old Welcome/Verification emails
  // ============================================================
  // Sent when Admin creates a new alumni account.
  // Contains: login credentials, portal link, change password reminder.
  sendAccountReadyEmail: async (
    email: string,
    firstName: string,
    temporaryPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const loginUrl = `${getBaseUrl()}/login`;
    const subject = '🎓 Your LCP Alumni Portal Account is Ready!';

    const htmlContent = `
      ${emailHeader('Your Account is Ready!', '🎓')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 22px;">
            Mabuhay, ${firstName}! 👋
          </h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Ang iyong <strong>LCP Alumni Portal</strong> account ay handa na! Ang Admin team ang gumawa ng iyong account para masimulan mo nang i-access ang alumni community.
          </p>

          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 12px; padding: 25px; margin: 0 0 25px 0;">
            <p style="color: #0c4a6e; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0;">🔑 Login Credentials</p>
            <table width="100%">
              <tr>
                <td style="padding-bottom: 10px;">
                  <span style="color: #64748b; font-size: 12px; font-weight: bold;">EMAIL:</span><br>
                  <strong style="color: #1e293b; font-size: 16px;">${email}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <span style="color: #64748b; font-size: 12px; font-weight: bold;">TEMPORARY PASSWORD:</span><br>
                  <strong style="color: #2563eb; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${temporaryPassword}</strong>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 0 0 25px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: bold;">
              ⚠️ Palitan agad ang iyong password pagkatapos ng unang login para sa seguridad ng iyong account.
            </p>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
            Sa loob ng portal, ma-a-access mo ang:
          </p>
          <ul style="color: #4b5563; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
            <li>📋 Alumni Directory & Community Network</li>
            <li>💼 Exclusive Job Opportunities</li>
            <li>📅 Events, Reunions & Batch Activities</li>
            <li>📰 News & Campus Announcements</li>
            <li>🤝 Donation & Giving Programs</li>
          </ul>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${loginUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                    Login to Your Account →
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            Kung may tanong ka, i-reply ang email na ito o kontakin ang Alumni Office.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 2. OTP VERIFICATION CODE — 2FA Login
  // ============================================================
  sendOTPEmail: async (
    email: string,
    firstName: string,
    otpCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Your LCP Alumni Verification Code';

    const htmlContent = `
      ${emailHeader('Verification Code', '🔐')}
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 10px 0;">Hi ${firstName},</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0 0 30px 0;">Use this code to verify your identity:</p>
          <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; display: inline-block;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="color: #ef4444; font-size: 13px; margin: 20px 0 0 0; font-weight: bold;">⏱ This code expires in 90 seconds.</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">If you didn't request this, please ignore this email.</p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 3. NEWSLETTER UPDATE — Broadcast to subscribers
  // ============================================================
  // Called from ManageNewsletter.tsx when admin publishes a newsletter.
  sendNewsletterUpdate: async (
    email: string,
    subscriberName: string,
    newsletterTitle: string,
    summary: string,
    readMoreUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const portalUrl = readMoreUrl || `${getBaseUrl()}/alumni/dashboard`;
    const subject = `📰 ${newsletterTitle} — LCP Alumni Newsletter`;

    const htmlContent = `
      ${emailHeader(newsletterTitle, '📰')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 20px;">
            Kumusta, ${subscriberName}! 👋
          </h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            May bagong balita mula sa LCP Alumni Portal. Narito ang latest update:
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 0 0 25px 0;">
            <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 12px 0;">${newsletterTitle}</h3>
            <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0;">
              ${summary}
            </p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${portalUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
                    Read Full Article →
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Natatanggap mo ang email na ito dahil naka-subscribe ka sa LCP Alumni Newsletter.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: subscriberName, subject, htmlContent });
  },

  // ============================================================
  // 4. JOB ALERT — Career opportunity matching alumni's course
  // ============================================================
  sendJobAlert: async (
    email: string,
    firstName: string,
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    jobUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const portalUrl = jobUrl || `${getBaseUrl()}/alumni/jobs`;
    const subject = `💼 Bagong Job Opportunity: ${jobTitle} — LCP Alumni`;

    const htmlContent = `
      ${emailHeader('Career Opportunity Alert', '💼')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 20px;">
            Hi ${firstName}, may bagong trabaho para sa 'yo! 🎯
          </h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Nakakita kami ng job posting na akma sa iyong profile. Tignan natin:
          </p>

          <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1px solid #e9d5ff; border-radius: 12px; padding: 25px; margin: 0 0 25px 0;">
            <p style="color: #7c3aed; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">📌 JOB DETAILS</p>
            <h3 style="color: #1e293b; font-size: 20px; margin: 0 0 6px 0;">${jobTitle}</h3>
            <p style="color: #7c3aed; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">🏢 ${companyName}</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
              ${jobDescription.length > 200 ? jobDescription.substring(0, 200) + '...' : jobDescription}
            </p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${portalUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">
                    View & Apply →
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Nakakuha ka ng alert na ito base sa iyong course at career profile sa LCP Alumni Portal.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 5. DONATION MILESTONE — Campaign completion thank-you
  // ============================================================
  sendDonationMilestone: async (
    email: string,
    donorName: string,
    campaignTitle: string,
    totalRaised: string,
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const portalUrl = `${getBaseUrl()}/alumni/donations`;
    const subject = `🎉 Goal Achieved: "${campaignTitle}" — Salamat, ${donorName}!`;

    const htmlContent = `
      ${emailHeader('Donation Milestone Reached!', '🎉')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 22px;">
            Salamat sa iyong Tulong, ${donorName}! 🙏
          </h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Dahil sa mga tulad mong mapagbigay na alumni, na-reach na namin ang target!
          </p>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 25px; margin: 0 0 25px 0; text-align: center;">
            <p style="color: #065f46; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">✅ CAMPAIGN COMPLETED</p>
            <h3 style="color: #064e3b; font-size: 20px; margin: 0 0 8px 0;">${campaignTitle}</h3>
            <p style="color: #059669; font-size: 28px; font-weight: 900; margin: 0;">₱${totalRaised}</p>
            <p style="color: #065f46; font-size: 13px; margin: 8px 0 0 0;">Total na Nakolekta</p>
          </div>

          ${message ? `
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 25px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; font-style: italic;">
              "${message}"
            </p>
            <p style="color: #3b82f6; font-size: 12px; margin: 8px 0 0 0;">— LCP Alumni Affairs Office</p>
          </div>
          ` : ''}

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${portalUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);">
                    View Your Giving History →
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Ang bawat piso mo ay malaking tulong sa LCP community. Maraming salamat! 💙
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: donorName, subject, htmlContent });
  },

  // ============================================================
  // 6. TRACER SURVEY — Employment status update request
  // ============================================================
  sendTracerSurveyEmail: async (
    email: string,
    firstName: string,
    portalUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const finalPortalUrl = portalUrl || getBaseUrl();
    const subject = '📋 LCP Alumni — Kamusta ka na? Update Your Status!';

    const htmlContent = `
      ${emailHeader('Alumni Tracer Study', '📋')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 22px;">
            Kumusta ka na, ${firstName}? 👋
          </h2>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Bilang bahagi ng aming <strong>Graduate Tracer Study</strong>, nais naming malaman ang iyong kasalukuyang kalagayan pagkatapos ng iyong pagtatapos sa LCP.
          </p>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Maari mo bang i-update ang iyong <strong>employment status</strong> sa aming Alumni Portal? Ito ay makakatulong sa amin na:
          </p>

          <ul style="color: #4b5563; font-size: 15px; line-height: 2; margin: 0 0 25px 0; padding-left: 20px;">
            <li>📊 Mapabuti ang aming curriculum base sa real-world outcomes</li>
            <li>🤝 Makakonekta ka sa mga kapwa alumni at career opportunities</li>
            <li>📈 Masubaybayan ang success rate ng aming graduates</li>
            <li>🎓 Ma-maintain ang accreditation requirements ng school</li>
          </ul>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 25px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: bold;">
              💡 Ano ang kailangan mong gawin?
            </p>
            <p style="color: #3b82f6; font-size: 14px; margin: 8px 0 0 0;">
              I-click ang button sa baba, mag-login, at i-update ang iyong <strong>Employment Status</strong>, <strong>Current Position</strong>, at <strong>Company</strong>.
            </p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${finalPortalUrl}/login"
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                    I-Update ang Aking Status →
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            Ang iyong datos ay protektado sa ilalim ng <strong>RA 10173 (Data Privacy Act of 2012)</strong>.
            <br>Hindi ibabahagi ang iyong personal na impormasyon sa labas ng LCP.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 7. PASSWORD RESET EMAIL — Reset link
  // ============================================================
  sendPasswordResetEmail: async (
    email: string,
    firstName: string,
    resetLink: string
  ): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Password Reset Request - LCP Alumni Portal';

    const htmlContent = `
      ${emailHeader('Reset Your Password', '🔐')}
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 10px 0;">Hi ${firstName},</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0 0 30px 0;">We received a request to reset your password for your LCP Alumni Portal account.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${resetLink}"
                   style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    Reset Password
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 0 0;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">Button not working? Copy this link: ${resetLink}</p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 8. PASSWORD RESET CODE — Admin-initiated OTP
  // ============================================================
  sendPasswordResetCode: async (
    email: string,
    firstName: string,
    code: string,
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Password Reset Code - LCP Alumni Portal';

    const htmlContent = `
      ${emailHeader('Reset Your Password', '🔐')}
      <tr>
        <td style="padding: 40px 30px; text-align: center;">
          <p style="color: #4b5563; font-size: 16px; margin: 0 0 10px 0;">Hi ${firstName},</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0 0 20px 0;">An administrator has initiated a password reset for your account. Use the code below to proceed.</p>
          <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 30px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">${code}</span>
          </div>
          <div style="margin-top: 10px;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 15px; font-weight: 800; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
              RESET PASSWORD NOW →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin: 25px 0 0 0;">The button will automatically fill in the code for you.</p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  // ============================================================
  // 9. NEW CREDENTIALS — Admin reset password, send new creds
  // ============================================================
  sendNewCredentialsEmail: async (
    email: string,
    firstName: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Delegates to sendAccountReadyEmail since they serve the same purpose
    return EmailService.sendAccountReadyEmail(email, firstName, password);
  },

  // ============================================================
  // 10. REJECTION EMAIL — Account rejection notification (legacy)
  // ============================================================
  sendRejectionEmail: async (
    email: string,
    firstName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const subject = 'LCP Alumni Portal - Application Update';

    const htmlContent = `
      ${emailHeader('Application Update', '📋')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${firstName},</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We regret to inform you that your alumni account application could not be verified at this time.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            This may be due to incomplete or incorrect information provided during the process.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you believe this is an error, please contact the Alumni Office for assistance.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },

  sendDonationReceipt: async (
    email: string,
    donorName: string,
    campaignTitle: string,
    amount: number,
    refNumber: string,
    method: string
  ): Promise<{ success: boolean; error?: string }> => {
    const subject = `💖 Official Receipt: Your Donation to "${campaignTitle}"`;
    const htmlContent = `
      ${emailHeader('Official Donation Receipt', '💖')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 22px;">Maraming Salamat, ${donorName}! 🙏</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
            Tinanggap na namin ang iyong kontribusyon para sa <strong>${campaignTitle}</strong>. Ang iyong suporta ay makakatulong sa pag-abot ng aming layunin para sa BCP Alumni community.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <table width="100%" style="border-collapse: collapse;">
              <tr>
                <td style="padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Reference Number</span><br>
                  <strong style="color: #1e293b; font-size: 16px; font-family: monospace;">${refNumber}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase;">Amount Contributed</span><br>
                  <strong style="color: #059669; font-size: 24px; font-weight: 900;">₱${amount.toLocaleString()}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 12px;">
                  <span style="color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase;">Payment Method</span><br>
                  <strong style="color: #1e293b; font-size: 15px;">${method}</strong>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong>Note:</strong> Ang iyong donasyon ay kasalukuyang sumasailalim sa manual verification ng aming Finance Office. Kapag verified na, makikita mo ito sa iyong "Giving History" sa portal.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
            Kung may katanungan tungkol sa iyong donasyon, mangyaring i-reply ang email na ito.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;
    return EmailService.sendEmail({ to: email, toName: donorName, subject, htmlContent });
  },

  // ============================================================
  // 11. APPROVAL EMAIL — Account approval notification (legacy)
  // ============================================================
  // Kept for backward compatibility; new flow uses sendAccountReadyEmail
  sendApprovalEmail: async (
    email: string,
    firstName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const loginUrl = `${getBaseUrl()}/login`;
    const subject = '🎉 Your LCP Alumni Account Has Been Approved!';

    const htmlContent = `
      ${emailHeader('Welcome to LCP Alumni!', '🎉')}
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 22px;">
            Congratulations, ${firstName}! 🎓
          </h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Great news! Your LCP Alumni Portal account has been <strong style="color: #059669;">verified and approved</strong> by our admin team.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            You now have full access to:
          </p>
          <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 25px 0; padding-left: 20px;">
            <li>📋 Alumni Directory & Community</li>
            <li>💼 Exclusive Job Opportunities</li>
            <li>📅 Events & Reunions</li>
            <li>📰 News & Announcements</li>
            <li>🤝 Networking Features</li>
          </ul>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding: 10px 0 30px 0;">
                <a href="${loginUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                    Login to Your Account →
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            If you have any questions, feel free to reply to this email or contact the Alumni Office.
          </p>
        </td>
      </tr>
      ${emailFooter()}
    `;

    return EmailService.sendEmail({ to: email, toName: firstName, subject, htmlContent });
  },
};

export default EmailService;
