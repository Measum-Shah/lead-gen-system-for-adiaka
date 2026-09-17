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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .highlight-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .highlight-box p {
            margin: 0;
            color: #555555;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
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
            <h1>Welcome, ${firstName}! 👋</h1>
        </div>
        
        <div class="content">
            <p>Hi ${firstName},</p>
            
            <p>${settings.emailGreeting.replace(/\\n/g, '<br>')}</p>
            
            <div class="highlight-box">
                <p><strong>What happens next?</strong></p>
                <p>${settings.emailBody.replace(/\\n/g, '<br>')}</p>
            </div>
            
            <p>${settings.emailNextSteps.replace(/\\n/g, '<br>')}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}" class="cta-button">Contact Us on WhatsApp</a>
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
  
  return \`
Welcome, \${firstName}!

Hi \${firstName},

\${settings.emailGreeting}

WHAT HAPPENS NEXT?
\${settings.emailBody}

\${settings.emailNextSteps}

Contact Us on WhatsApp: https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}

NEED IMMEDIATE ASSISTANCE?
You can reply directly to this email or call us at \${settings.supportPhone}

\${settings.footerSignature}
\${settings.companyName} Team

---
\${settings.companyName}
\${settings.companyAddress}
\${settings.supportEmail} | \${settings.supportPhone}

You're receiving this email because you submitted a contact form on our website.
  \`.trim();
};

