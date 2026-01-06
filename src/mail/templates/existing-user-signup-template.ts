// import { Logger } from '@nestjs/common';

export const ALREADY_REGISTERED_SUBJECT =
  'Security Notice: Sign-up attempt for Ventura';

// const logger = new Logger('ExistingUserSignupTemplate');

export function ExistingUserSignupTemplate(
  firstName: string,
  loginUrl: string = '',
  resetUrl: string = '',
) {
  // if (!loginUrl || !resetUrl) {
  //   logger.warn('Login URL or Reset URL is missing');
  //   return null;
  // }
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Account Already Exists</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">Hi ${firstName},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Someone (hopefully you!) tried to sign up for a Ventura account using this email address. Since you already have an account, you can log in directly:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">Log In to Your Account</a>
              </div>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 20px; color: #666666;">
                If you've forgotten your password, you can reset it <a href="${resetUrl}" style="color: #007bff; text-decoration: none;">here</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">
                <strong>Security Note:</strong> If this wasn't you, your account is still secure. No changes have been made to your account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
