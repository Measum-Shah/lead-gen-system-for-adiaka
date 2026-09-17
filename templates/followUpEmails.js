/**
 * Follow-Up Email Templates
 * 
 * HTML email templates for Day 1 and Day 3 follow-ups
 */

const baseEmailStyle = `
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
        font-size: 24px;
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
    .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
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
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}" class="cta-button">Contact Us on WhatsApp</a>
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
  
  return \`
Hi \${firstName},

\${greeting}

\${body}

\${nextSteps}

Contact Us on WhatsApp: https://wa.me/\${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}

\${settings.footerSignature}
\${settings.companyName} Team

---
\${settings.companyName}
\${settings.companyAddress}
\${settings.supportEmail} | \${settings.supportPhone}
  \`.trim();
};
