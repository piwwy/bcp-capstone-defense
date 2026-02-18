// Email Service using Brevo (Sendinblue) API
// You need to set VITE_BREVO_API_KEY in your .env file

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'perrypesinocute@gmail.com';
const BREVO_SENDER_NAME = import.meta.env.VITE_BREVO_SENDER_NAME || 'LCP Alumni Portal';

// Helper to get the base URL of the application
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://bcpportal.netlify.app'; // Fallback
};

interface EmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export const EmailService = {
  /**
   * Send an email using Brevo API
   */
  sendEmail: async ({ to, toName, subject, htmlContent }: EmailParams): Promise<{ success: boolean; error?: string }> => {
    if (!BREVO_API_KEY) {
      console.error('❌ VITE_BREVO_API_KEY is missing in your .env file!');
      return { success: false, error: 'Email service configuration missing (BREVO_API_KEY)' };
    }

    console.log(`📧 Attempting to send email to ${to}...`);

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: BREVO_SENDER_NAME,
            email: BREVO_SENDER_EMAIL
          },
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

  /**
   * Send account approval notification
   */
  sendApprovalEmail: async (email: string, firstName: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '🎉 Your LCP Alumni Account Has Been Approved!';
    const loginUrl = `${getBaseUrl()}/login`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Welcome to LCP Alumni!</h1>
            </td>
          </tr>
          
          <!-- Body -->
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
              
              <!-- CTA Button -->
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
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
                Linker College of the Philippines - Alumni Portal
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LCP Alumni. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send OTP verification code
   */
  sendOTPEmail: async (email: string, firstName: string, otpCode: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Your LCP Alumni Verification Code';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🔐 Verification Code</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #4b5563; font-size: 16px; margin: 0 0 10px 0;">Hi ${firstName},</p>
              <p style="color: #4b5563; font-size: 15px; margin: 0 0 30px 0;">Use this code to verify your identity:</p>
              <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; display: inline-block;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">${otpCode}</span>
              </div>
              <p style="color: #ef4444; font-size: 13px; margin: 20px 0 0 0; font-weight: bold;">⏱ This code expires in 60 seconds.</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">If you didn't request this, please ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LCP Alumni Portal</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send account rejection notification
   */
  sendRejectionEmail: async (email: string, firstName: string): Promise<{ success: boolean; error?: string }> => {
    const subject = 'LCP Alumni Portal - Application Update';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: #1e3a8a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">LCP Alumni Portal</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${firstName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We regret to inform you that your alumni account application could not be verified at this time.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                This may be due to incomplete or incorrect information provided during registration.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you believe this is an error, please contact the Alumni Office for assistance.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LCP Alumni Portal
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send tracer study / employment status survey email
   */
  sendTracerSurveyEmail: async (email: string, firstName: string, portalUrl?: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '📋 LCP Alumni — Kamusta ka na? Update Your Status!';
    const finalPortalUrl = portalUrl || getBaseUrl();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">📋 Alumni Tracer Study</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">Linker College of the Philippines</p>
            </td>
          </tr>
          
          <!-- Body -->
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
                  I-click ang button sa baba, mag-login sa iyong account, at i-update ang iyong profile — lalo na ang iyong <strong>Employment Status</strong>, <strong>Current Position</strong>, at <strong>Company</strong>.
                </p>
              </div>
              
              <!-- CTA Button -->
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
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">
                Linker College of the Philippines — Alumni Affairs Office
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LCP Alumni Portal. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send password reset initiation email
   */
  sendPasswordResetEmail: async (email: string, firstName: string, resetLink: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Password Reset Request - LCP Alumni Portal';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🔐 Reset Your Password</h1>
            </td>
          </tr>
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
          <tr>
            <td style="background-color: #1f2937; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LCP Alumni Portal</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send password reset OTP code
   */
  sendPasswordResetCode: async (email: string, firstName: string, code: string, resetUrl: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Password Reset Code - LCP Alumni Portal';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🔐 Reset Your Password</h1>
            </td>
          </tr>
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
          <tr>
            <td style="background-color: #1f2937; padding: 20px 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LCP Alumni Portal</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },

  /**
   * Send new credentials (username/email and password) to user
   */
  sendNewCredentialsEmail: async (email: string, firstName: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const subject = '🔐 Your New LCP Alumni Portal Credentials';
    const loginUrl = `${getBaseUrl()}/login`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🔐 Account Credentials Updated</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 20px;">
                Hello, ${firstName}!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                An administrator has reset your password. Here are your new login credentials for the LCP Alumni Portal:
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <table width="100%">
                  <tr>
                    <td style="padding-bottom: 10px;">
                      <span style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Email / Username:</span><br>
                      <strong style="color: #1e293b; font-size: 16px;">${email}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">New Password:</span><br>
                      <strong style="color: #2563eb; font-size: 18px; font-family: monospace; letter-spacing: 1px;">${password}</strong>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #f59e0b; font-size: 14px; font-weight: bold; margin-bottom: 25px;">
                ⚠️ For security reasons, we recommend changing your password after your first login.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="${loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                      Go to Login Page →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                If you did not request this change, please contact the Alumni Office immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
                Linker College of the Philippines - Alumni Portal
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} LCP Alumni Portal
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return EmailService.sendEmail({
      to: email,
      toName: firstName,
      subject,
      htmlContent,
    });
  },
};

export default EmailService;
