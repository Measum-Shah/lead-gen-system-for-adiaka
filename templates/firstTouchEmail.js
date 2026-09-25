/**
 * First Touch Email Template
 * 
 * HTML email template sent to new leads as initial contact
 */

export const getFirstTouchEmailTemplate = (lead, settings) => {
  const firstName = lead.name.split(' ')[0]; // Get first name
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Thank You for Your Interest</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #0f172a;
            border-bottom: 4px solid #f59e0b;
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .highlight-box {
            background-color: #f8fafc;
            border-left: 4px solid #f59e0b;
            padding: 24px;
            margin: 32px 0;
            border-radius: 0 8px 8px 0;
        }
        .highlight-box p {
            margin: 0;
            color: #475569;
        }
        .cta-button {
            display: inline-block;
            background-color: #25D366;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            font-size: 16px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #0f172a;
            text-decoration: underline;
        }
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 32px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
                border: none;
            }
            .header {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome, ${firstName}!</h1>
        </div>
        
        <div class="content">
            <div class="email-body">
                ${(settings.emailBody || '').replace(/{{name}}/g, firstName)}
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}" class="cta-button" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="20" height="20" style="vertical-align: middle; margin-right: 8px; border: none;" />
                    <span style="vertical-align: middle;">Contact Us on WhatsApp</span>
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #666666;">
                <strong>Need immediate assistance?</strong><br>
                You can reply directly to this email or call us at <a href="tel:${settings.supportPhone.replace(/\\s/g, '')}" style="color: #667eea; text-decoration: none;">${settings.supportPhone}</a>
            </p>
            
            <p style="margin-top: 30px;">
                ${settings.footerSignature.replace(/\n/g, '<br>')}<br>
                <strong>${settings.companyName} Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>${settings.companyName}</strong>
            </p>
            <p style="margin: 0 0 10px 0;">
                ${settings.companyAddress}<br>
                <a href="mailto:${settings.supportEmail}">${settings.supportEmail}</a> | 
                <a href="tel:${settings.supportPhone.replace(/\\s/g, '')}">${settings.supportPhone}</a>
            </p>
            <p style="margin: 20px 0 0 0; font-size: 12px; color: #999999;">
                You're receiving this email because you submitted a contact form on our website.<br>
                <a href="#" style="color: #999999;">Unsubscribe</a> | 
                <a href="#" style="color: #999999;">Privacy Policy</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
};

/**
 * Get plain text version of the email (fallback for email clients that don't support HTML)
 */
export const getFirstTouchEmailText = (lead, settings) => {
  const firstName = lead.name.split(' ')[0];
  
  const rawBody = (settings.emailBody || '').replace(/{{name}}/g, firstName);
  const plainTextBody = rawBody.replace(/<[^>]*>?/gm, '');
  
  return `
Welcome, ${firstName}!

${plainTextBody}

Contact Us on WhatsApp: https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}

NEED IMMEDIATE ASSISTANCE?
You can reply directly to this email or call us at ${settings.supportPhone}

${settings.footerSignature.replace(/\\n/g, '\n')}
${settings.companyName} Team

---
${settings.companyName}
${settings.companyAddress}
${settings.supportEmail} | ${settings.supportPhone}

You're receiving this email because you submitted a contact form on our website.
  `.trim();
};
