export const VERIFICATION_EMAIL_SUBJECT = 'Verify your email for Ventura';

export function EmailVerificationTemplate(
  firstName: string,
  verificationCode: string,
  expirationMinutes: number = 10,
) {
  if (!verificationCode || !firstName) {
    return null;
  }
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Email Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify Your Email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">Hi ${firstName},</p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #333333;">Thanks for signing up for Ventura! Use the code below to verify your account:</p>
              <table role="presentation" style="width: 100%; margin: 0 0 32px 0;">
                <tr>
                  <td style="padding: 24px; background-color: #f8f9fa; border-radius: 6px; border: 2px dashed #dee2e6; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'Courier New', monospace;">${verificationCode}</div>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; text-align: center;">This code expires in <strong>${expirationMinutes} minutes</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">If you didn't create a Ventura account, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
