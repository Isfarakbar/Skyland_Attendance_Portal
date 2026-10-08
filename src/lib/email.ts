const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'isfarakbar94@gmail.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Skyland Attendance Portal';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
}: {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
}) {
  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to,
        subject,
        htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Brevo Email API Error:', data);
      return { success: false, error: data };
    }
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Failed to send email via Brevo:', error);
    return { success: false, error };
  }
}

/**
 * Sends a 6-digit verification code to the employee upon registration
 */
export async function sendVerificationEmail(
  toEmail: string,
  toName: string,
  code: string
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your Skyland Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; opacity: 0.85; font-size: 13px; }
          .content { padding: 32px 28px; color: #334155; }
          .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 14px; text-align: center; padding: 20px; margin: 24px 0; }
          .code { font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; font-family: 'Courier New', monospace; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SKYLAND PORTAL</h1>
            <p>Workforce & Attendance Verification</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Welcome to Skyland, ${toName}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
              Please use the verification code below to verify your email address and activate your attendance account.
            </p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              This verification code will expire in 15 minutes.
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-top: 24px;">
              If you did not request this account, please disregard this email.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Skyland Corporation. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject: `🔐 Your Skyland Verification Code: ${code}`,
    htmlContent,
  });
}

/**
 * Sends a password reset 6-digit OTP to the employee
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  code: string
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; }
          .content { padding: 32px 28px; color: #334155; }
          .code-box { background: #fff1f2; border: 2px dashed #fecdd3; border-radius: 14px; text-align: center; padding: 20px; margin: 24px 0; }
          .code { font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #e11d48; font-family: 'Courier New', monospace; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SECURITY NOTICE</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Hello, ${toName}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
              We received a request to reset the password for your Skyland Attendance account. Enter the security code below to complete the reset:
            </p>
            <div class="code-box">
              <span class="code">${code}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              This code will expire in 15 minutes.
            </p>
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-top: 24px;">
              If you did not request a password reset, you can safely ignore this message. Your password will remain unchanged.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Skyland Corporation. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: toEmail, name: toName }],
    subject: `🔑 Password Reset Code: ${code} - Skyland Portal`,
    htmlContent,
  });
}
