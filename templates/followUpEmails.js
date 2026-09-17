/**
 * Follow-Up Email Templates
 * 
 * HTML email templates for Day 1 and Day 3 follow-ups
 */

const baseEmailStyle = `
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
`;

export const getFollowUpEmailTemplate = (lead, settings, day) => {
  const firstName = lead.name.split(' ')[0];
  
  let subject, greeting, body, nextSteps;
  if (day === 1) {
    subject = settings.day1EmailSubject;
    greeting = settings.day1EmailGreeting;
    body = settings.day1EmailBody;
    nextSteps = settings.day1EmailNextSteps;
  } else if (day === 3) {
    subject = settings.day3EmailSubject;
    greeting = settings.day3EmailGreeting;
    body = settings.day3EmailBody;
    nextSteps = settings.day3EmailNextSteps;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>${baseEmailStyle}</style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Checking in, ${firstName}</h1>
        </div>
        
        <div class="content">
            <p>Hi ${firstName},</p>
            <p>${greeting.replace(/\\n/g, '<br>')}</p>
            <p>${body.replace(/\\n/g, '<br>')}</p>
            <p>${nextSteps.replace(/\\n/g, '<br>')}</p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}" class="cta-button" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="20" height="20" style="vertical-align: middle; margin-right: 8px; border: none;" />
                    <span style="vertical-align: middle;">Contact Us on WhatsApp</span>
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="margin-top: 30px;">
                ${settings.footerSignature.replace(/\\n/g, '<br>')}<br>
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
        </div>
    </div>
</body>
</html>
  `.trim();

  return html;
};

export const getFollowUpEmailText = (lead, settings, day) => {
  const firstName = lead.name.split(' ')[0];
  
  let subject, greeting, body, nextSteps;
  if (day === 1) {
    subject = settings.day1EmailSubject;
    greeting = settings.day1EmailGreeting;
    body = settings.day1EmailBody;
    nextSteps = settings.day1EmailNextSteps;
  } else if (day === 3) {
    subject = settings.day3EmailSubject;
    greeting = settings.day3EmailGreeting;
    body = settings.day3EmailBody;
    nextSteps = settings.day3EmailNextSteps;
  }
  
  return `
Hi ${firstName},

${greeting}

${body}

${nextSteps}

Contact Us on WhatsApp: https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}

${settings.footerSignature}
${settings.companyName} Team

---
${settings.companyName}
${settings.companyAddress}
${settings.supportEmail} | ${settings.supportPhone}
  `.trim();
};
