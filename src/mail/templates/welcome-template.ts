export const WELCOME_EMAIL_SUBJECT = "Welcome to Ventura - Let's get started";

export function WelcomeEmailTemplate(
  firstName: string,
  dashboardUrl: string = 'https://app.ventura.com/dashboard',
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ventura</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">Welcome to Ventura!</h1>
              <p style="margin: 0; font-size: 16px; line-height: 24px; color: #666666;">
                Your business management workspace is ready
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Hi ${firstName},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                Thanks for choosing Ventura to manage your business operations. You now have everything you need to handle invoices, track orders, and monitor your business performance—all in one place.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                      Go to Your Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Quick Start Guide -->
              <div style="background-color: #f8f9fa; padding: 24px; border-radius: 6px; margin: 0 0 32px 0;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Get Started in 3 Steps</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 0 0 16px 0;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                            <div style="width: 24px; height: 24px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px; font-weight: 600;">1</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">Set Up Your Profile</h3>
                            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">Add your business details and customize your workspace</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 0 0 16px 0;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                            <div style="width: 24px; height: 24px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px; font-weight: 600;">2</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">Create Your First Invoice</h3>
                            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">Start managing your finances with professional invoices</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 0;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="width: 32px; vertical-align: top; padding-right: 12px;">
                            <div style="width: 24px; height: 24px; background-color: #2563eb; color: #ffffff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px; font-weight: 600;">3</div>
                          </td>
                          <td style="vertical-align: top;">
                            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">Explore Your Dashboard</h3>
                            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">See real-time insights into your business performance</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Resources -->
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Helpful Resources</h2>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
                <tr>
                  <td style="padding: 0 0 12px 0;">
                    <a href="#" style="color: #2563eb; text-decoration: none; font-size: 15px;">📚 Help Center</a>
                    <span style="color: #999999; font-size: 14px; margin-left: 8px;">- Learn the basics</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 12px 0;">
                    <a href="#" style="color: #2563eb; text-decoration: none; font-size: 15px;">🎥 Video Tutorials</a>
                    <span style="color: #999999; font-size: 14px; margin-left: 8px;">- Watch quick guides</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0;">
                    <a href="#" style="color: #2563eb; text-decoration: none; font-size: 15px;">💬 Contact Support</a>
                    <span style="color: #999999; font-size: 14px; margin-left: 8px;">- We're here to help</span>
                  </td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 32px 0;">
              
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 22px; color: #333333;">
                We're excited to be part of your business journey. If you have any questions, don't hesitate to reach out.
              </p>
              
              <p style="margin: 0; font-size: 15px; line-height: 22px; color: #333333;">
                Best regards,<br>
                <strong>The Ventura Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 18px; color: #666666;">
                Ventura - Business Management Made Simple
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
                You're receiving this email because you signed up for Ventura.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
