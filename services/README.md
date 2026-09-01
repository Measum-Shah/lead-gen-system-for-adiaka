# Services Documentation

## Email Service

### Overview
The email service handles sending automated first-touch emails to new leads using Nodemailer with SMTP configuration.

### Configuration

#### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (name it "Lead Capture System")
   - Copy the 16-digit password

3. **Configure .env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop  # 16-digit app password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_FROM_NAME=Your Company Name
   ```

#### Other SMTP Providers

**SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

**Outlook/Office 365**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```

### Testing

#### Test Email Service
```bash
npm run test:email
```

This will:
1. Verify SMTP connection
2. Send a test email
3. Send a sample first-touch email

#### Manual Testing in Node REPL
```javascript
import dotenv from 'dotenv';
import { sendTestEmail, sendFirstTouchEmail } from './services/emailService.js';

dotenv.config();

// Test basic email
await sendTestEmail('recipient@example.com');

// Test first-touch email with mock lead
const mockLead = {
  name: 'John Doe',
  email: 'recipient@example.com',
  phone: '+923001234567'
};
await sendFirstTouchEmail(mockLead);
```

### Functions

#### `sendFirstTouchEmail(lead)`
Sends welcome email to new lead.

**Parameters:**
- `lead` (Object): Lead document with name, email, phone

**Returns:**
```javascript
{
  success: true,
  messageId: '...',
  email: 'lead@example.com'
}
```

**Error Handling:**
- Never throws - returns success: false on error
- Automatically updates lead.emailStatus to 'sent' or 'failed'
- Logs all errors without crashing

**Example:**
```javascript
const lead = await Lead.findById(leadId);
const result = await sendFirstTouchEmail(lead);

if (result.success) {
  console.log('Email sent!');
} else {
  console.log('Email failed:', result.error);
}
```

#### `sendTestEmail(testEmail)`
Sends test email to verify configuration.

**Parameters:**
- `testEmail` (String): Recipient email address

**Returns:**
```javascript
{
  success: true,
  messageId: '...',
  message: 'Test email sent successfully'
}
```

#### `verifyEmailConnection()`
Verifies SMTP connection without sending email.

**Returns:**
- `true` if connection successful
- `false` if connection failed

### Email Template

The first-touch email template is defined in `templates/firstTouchEmail.js` and includes:

- Professional HTML design with gradient header
- Personalized greeting using first name
- Clear "what happens next" section
- Call-to-action button
- Contact information
- Plain text fallback for email clients that don't support HTML

**Customization:**
Edit `templates/firstTouchEmail.js` to match your branding:
- Update company name and contact info
- Change colors (search for `#667eea` and `#764ba2`)
- Modify content and CTAs
- Update links and social media

### Troubleshooting

#### "Invalid login" or "Authentication failed"
- **Gmail**: Use app password, not regular password
- **Gmail**: Enable 2FA first, then create app password
- Verify SMTP_USER matches EMAIL_FROM
- Check for typos in credentials

#### "Connection timeout"
- Check SMTP_HOST and SMTP_PORT
- Verify firewall isn't blocking port 587
- Try port 465 with SMTP_SECURE=true
- Check internet connection

#### "Self-signed certificate" error
- Add to transporter config:
  ```javascript
  tls: { rejectUnauthorized: false }
  ```

#### Gmail "Less secure app access" (Legacy)
- No longer recommended - use app passwords instead
- Visit: https://myaccount.google.com/lesssecureapps

#### Emails going to spam
- Use a verified domain
- Set up SPF, DKIM, and DMARC records
- Use a professional email service (SendGrid, Mailgun)
- Avoid spam trigger words in subject/content

### Production Recommendations

1. **Use Dedicated Email Service**
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - Amazon SES (pay as you go)

2. **Domain Configuration**
   - Use custom domain email (not Gmail)
   - Set up SPF record
   - Set up DKIM signing
   - Set up DMARC policy

3. **Monitoring**
   - Log all email sends
   - Track bounce rates
   - Monitor spam complaints
   - Set up delivery notifications

4. **Rate Limiting**
   - Respect SMTP provider limits
   - Implement queue for bulk sends
   - Add delays between emails if needed

### Security Best Practices

- Never commit SMTP credentials to version control
- Use environment variables for all sensitive data
- Rotate SMTP passwords regularly
- Use app passwords (not main account passwords)
- Enable 2FA on email accounts
- Monitor for unauthorized access

## SMS Service

### Overview
The SMS service handles sending automated first-touch SMS messages to new leads using Twilio API.

### Configuration

#### Twilio Setup

1. **Sign Up for Twilio**
   - Visit: https://www.twilio.com/try-twilio
   - Get $15 free trial credit (no credit card required)
   - Verify your email and phone number

2. **Get Credentials**
   - Go to Twilio Console: https://console.twilio.com
   - Copy your **Account SID**
   - Copy your **Auth Token**

3. **Get a Phone Number**
   - In Console: Phone Numbers → Manage → Buy a number
   - Choose a number with SMS capabilities
   - Trial accounts get one free number

4. **Verify Recipient Numbers (Trial Accounts Only)**
   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   - Click "+" to add your phone number
   - Enter the verification code you receive
   - Trial accounts can only send to verified numbers

5. **Configure .env**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+15551234567  # Your Twilio number (E.164 format)
   TEST_PHONE_NUMBER=+923001234567   # Your verified number for testing
   ```

### Testing

#### Test SMS Service
```bash
npm run test:sms
```

This will:
1. Verify Twilio connection
2. Check account balance
3. Send a test SMS
4. Send a sample first-touch SMS

#### Manual Testing in Node REPL
```javascript
import dotenv from 'dotenv';
import { sendTestSMS, sendFirstTouchSMS } from './services/smsService.js';

dotenv.config();

// Test basic SMS
await sendTestSMS('+923001234567');

// Test first-touch SMS with mock lead
const mockLead = {
  name: 'Ahmed Khan',
  email: 'ahmed@example.com',
  phone: '+923001234567'
};
await sendFirstTouchSMS(mockLead);
```

### Functions

#### `sendFirstTouchSMS(lead)`
Sends welcome SMS to new lead.

**Parameters:**
- `lead` (Object): Lead document with name, email, phone (E.164 format)

**Returns:**
```javascript
{
  success: true,
  messageSid: 'SM...',
  status: 'queued',
  phone: '+923001234567',
  segments: 1
}
```

**Error Handling:**
- Never throws - returns success: false on error
- Automatically updates lead.smsStatus to 'sent' or 'failed'
- Logs all errors without crashing
- Includes Twilio error codes for debugging

**Example:**
```javascript
const lead = await Lead.findById(leadId);
const result = await sendFirstTouchSMS(lead);

if (result.success) {
  console.log('SMS sent!');
} else {
  console.log('SMS failed:', result.error);
  console.log('Error code:', result.errorCode);
}
```

#### `sendTestSMS(testPhone)`
Sends test SMS to verify configuration.

**Parameters:**
- `testPhone` (String): Recipient phone number (E.164 format)

**Returns:**
```javascript
{
  success: true,
  messageSid: 'SM...',
  status: 'queued',
  message: 'Test SMS sent successfully'
}
```

#### `verifySMSConnection()`
Verifies Twilio connection without sending SMS.

**Returns:**
- `true` if connection successful
- `false` if connection failed

#### `getSMSStatus(messageSid)`
Gets delivery status of a sent message.

**Parameters:**
- `messageSid` (String): Twilio message SID

**Returns:**
```javascript
{
  success: true,
  sid: 'SM...',
  status: 'delivered',
  to: '+923001234567',
  price: '-0.0075',
  errorCode: null,
  errorMessage: null
}
```

### SMS Templates

SMS templates are defined in `templates/firstTouchSMS.js` and include:

**Standard Template (Default):**
```
Hi Ahmed! Thanks for your interest. We've received your inquiry and will contact you within 24 hours. - Your Company Team
```

**Additional Templates:**
- `urgent` - For high-priority leads
- `afterHours` - Outside business hours
- `vip` - High-value customers
- `serviceSpecific` - Service-specific responses

**Customization:**
Edit `templates/firstTouchSMS.js` to match your messaging:
- Keep under 160 characters for single SMS
- Always include sender identification
- Personalize with first name
- Be clear and concise
- Include timeframe or next steps

### Troubleshooting

#### "Unable to create record: The 'From' number is not a valid phone number"
- Check TWILIO_PHONE_NUMBER is in E.164 format (+15551234567)
- Verify this is a Twilio phone number you own
- Check for typos in the number

#### "The number is unverified" (Error 21211)
- **Trial accounts only**: Verify recipient at https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Or upgrade to a paid account to send to any number

#### "Authentication Error" (Error 20003)
- Check TWILIO_ACCOUNT_SID starts with "AC"
- Verify TWILIO_AUTH_TOKEN is correct
- Check for extra spaces in .env file

#### "Invalid phone number" (Error 21614)
- Ensure phone number is in E.164 format (+923001234567)
- Include country code with +
- No spaces, dashes, or parentheses

#### SMS not delivered
- Check message status with `getSMSStatus(messageSid)`
- Possible statuses: queued, sent, delivered, failed, undelivered
- For 'failed' status, check errorCode and errorMessage

#### High costs
- Each SMS costs $0.0075 - $0.01 (varies by country)
- Multi-segment messages (>160 chars) cost more
- Monitor usage in Twilio Console
- Set up usage alerts

### Production Recommendations

1. **Upgrade to Paid Account**
   - Remove trial limitations
   - Send to any number
   - Higher volume capabilities
   - Better support

2. **Use Messaging Services (Optional)**
   - Better deliverability
   - Automatic failover
   - Sender pool management
   - Link shortening

3. **Compliance**
   - Follow TCPA regulations (US)
   - Obtain consent before sending
   - Include opt-out instructions
   - Keep records of consent

4. **Monitoring**
   - Log all SMS sends
   - Track delivery rates
   - Monitor failed messages
   - Set up error alerts

5. **Rate Limiting**
   - Respect carrier limits (1 SMS/second recommended)
   - Implement queue for bulk sends
   - Handle rate limit errors gracefully

### Cost Optimization

- Keep messages under 160 characters (single segment)
- Avoid special characters that trigger Unicode encoding
- Use Twilio's free inbound SMS for replies
- Set up budget alerts in Twilio Console
- Monitor usage regularly

### Security Best Practices

- Never commit Twilio credentials to version control
- Use environment variables for all sensitive data
- Rotate Auth Token regularly
- Enable two-factor authentication on Twilio account
- Monitor for unauthorized usage
- Use IP whitelisting if possible

### Common Twilio Error Codes

- **21211**: Number not verified (trial account)
- **21608**: Number not SMS-capable
- **21614**: Invalid phone number format
- **21610**: Message filtered (carrier blocked)
- **30003**: Unreachable destination
- **30005**: Unknown destination
- **30007**: Message filtered (spam)

Full error list: https://www.twilio.com/docs/api/errors

## Notification Orchestrator

### Overview
The notification orchestrator coordinates sending both email and SMS notifications in parallel, ensuring both attempts complete even if one fails. Uses `Promise.allSettled` for robust parallel execution.

### Key Features

- **Parallel Execution**: Sends email and SMS simultaneously for faster delivery
- **Fault Tolerance**: One failure doesn't block the other notification
- **Status Tracking**: Updates lead record with delivery status
- **Retry Support**: Can retry failed notifications independently
- **Detailed Logging**: Comprehensive console output for debugging

### Functions

#### `triggerFirstTouch(leadId)`
Triggers first-touch email and SMS notifications for a new lead.

**Parameters:**
- `leadId` (String): MongoDB ObjectId of the lead

**Returns:**
```javascript
{
  success: true,              // true if at least one notification sent
  leadId: '507f1f77bcf86cd799439011',
  emailSent: true,
  smsSent: true,
  emailError: null,           // Error message if email failed
  smsError: null,             // Error message if SMS failed
  emailStatus: 'sent',        // Current email status from DB
  smsStatus: 'sent',          // Current SMS status from DB
  firstTouchSentAt: '2024-01-15T10:30:00.000Z'
}
```

**Behavior:**
- Fetches lead from database
- Sends email and SMS in parallel using `Promise.allSettled`
- Updates lead statuses independently
- Sets `firstTouchSentAt` if at least one succeeds
- Never throws - returns error details in response

**Example:**
```javascript
import { triggerFirstTouch } from './services/notify.js';

// After creating a lead
const lead = await Lead.create({ name, email, phone });

// Trigger notifications asynchronously
setImmediate(async () => {
  const result = await triggerFirstTouch(lead._id);
  
  if (result.success) {
    console.log('Notifications sent!');
    if (result.emailSent && result.smsSent) {
      console.log('Both email and SMS delivered');
    } else if (result.emailSent) {
      console.log('Email sent, SMS failed:', result.smsError);
    } else {
      console.log('SMS sent, email failed:', result.emailError);
    }
  } else {
    console.log('Both notifications failed');
  }
});
```

#### `retryFailedNotifications(leadId)`
Retries only the failed or pending notifications for a lead.

**Parameters:**
- `leadId` (String): MongoDB ObjectId of the lead

**Returns:**
```javascript
{
  success: true,
  emailRetried: true,         // Whether email was retried
  smsRetried: false,          // Whether SMS was retried
  emailSuccess: true,         // Retry result for email
  smsSuccess: false,          // Retry result for SMS
  emailStatus: 'sent',
  smsStatus: 'failed'
}
```

**Behavior:**
- Only retries notifications with status 'failed' or 'pending'
- Skips notifications already marked as 'sent'
- Parallel execution if both need retry
- Updates statuses independently

**Example:**
```javascript
// Retry failed notifications after some time
const retryResult = await retryFailedNotifications(leadId);

if (retryResult.emailRetried && retryResult.emailSuccess) {
  console.log('Email retry succeeded!');
}
```

#### `getNotificationStatus(leadId)`
Gets comprehensive notification status for a lead.

**Parameters:**
- `leadId` (String): MongoDB ObjectId of the lead

**Returns:**
```javascript
{
  success: true,
  leadId: '507f1f77bcf86cd799439011',
  name: 'Ahmed Khan',
  email: 'ahmed@example.com',
  phone: '+923001234567',
  emailStatus: 'sent',
  smsStatus: 'sent',
  firstTouchSent: true,       // At least one notification sent
  fullyNotified: true,        // Both notifications sent
  firstTouchSentAt: '2024-01-15T10:30:00.000Z',
  createdAt: '2024-01-15T10:29:55.000Z'
}
```

**Example:**
```javascript
const status = await getNotificationStatus(leadId);

if (status.fullyNotified) {
  console.log('Lead is fully notified');
} else if (status.firstTouchSent) {
  console.log('Partial notification sent');
  console.log(`Email: ${status.emailStatus}`);
  console.log(`SMS: ${status.smsStatus}`);
}
```

### Integration

#### Webhook Controller Integration
The orchestrator is called automatically when a new lead is created:

```javascript
// In webhookController.js
res.status(201).json({ success: true, leadId: lead._id });

// Async notification trigger (doesn't block response)
setImmediate(async () => {
  try {
    const { triggerFirstTouch } = await import('../services/notify.js');
    await triggerFirstTouch(lead._id);
  } catch (error) {
    console.error('Notification failed:', error);
  }
});
```

#### Manual Resend Endpoint
Used for manual retries from admin dashboard:

```javascript
// In leadsController.js
export const resendNotifications = async (req, res) => {
  const result = await retryFailedNotifications(req.params.id);
  res.json(result);
};
```

### Promise.allSettled Pattern

The orchestrator uses `Promise.allSettled` instead of `Promise.all`:

**Why Promise.allSettled?**
- ✓ Both notifications attempt even if one fails
- ✓ Get individual results for each notification
- ✓ No short-circuit behavior
- ✓ Predictable execution flow

**Comparison:**
```javascript
// ❌ Promise.all - stops on first failure
const [email, sms] = await Promise.all([
  sendEmail(),  // If this fails...
  sendSMS()     // ...this never runs
]);

// ✓ Promise.allSettled - both run regardless
const [emailResult, smsResult] = await Promise.allSettled([
  sendEmail(),  // Runs
  sendSMS()     // Always runs, even if email fails
]);
```

### Error Handling

The orchestrator handles all error scenarios gracefully:

1. **Lead Not Found**
   ```javascript
   { success: false, error: 'Lead not found' }
   ```

2. **Email Fails, SMS Succeeds**
   ```javascript
   {
     success: true,  // At least one succeeded
     emailSent: false,
     smsSent: true,
     emailError: 'SMTP connection failed'
   }
   ```

3. **Both Fail**
   ```javascript
   {
     success: false,
     emailSent: false,
     smsSent: false,
     emailError: '...',
     smsError: '...'
   }
   ```

4. **Database Error**
   ```javascript
   { success: false, error: 'Database error message' }
   ```

### Testing

#### Test with Database
```bash
npm run test:notify
```

**Prerequisites:**
- MongoDB connection configured
- At least one notification service (email/SMS) configured
- Test phone number verified (for SMS)

**Test Coverage:**
- Lead creation
- Parallel notification triggering
- Status updates in database
- Invalid lead ID handling
- Retry functionality
- Promise.allSettled behavior

#### Manual Testing
```javascript
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Lead from './models/Lead.js';
import { triggerFirstTouch } from './services/notify.js';

await connectDB();

// Create test lead
const lead = await Lead.create({
  name: 'Test User',
  email: 'your-email@example.com',
  phone: '+923001234567'
});

// Trigger notifications
const result = await triggerFirstTouch(lead._id);
console.log(result);

// Check status
const updatedLead = await Lead.findById(lead._id);
console.log({
  emailStatus: updatedLead.emailStatus,
  smsStatus: updatedLead.smsStatus,
  firstTouchSentAt: updatedLead.firstTouchSentAt
});

await mongoose.connection.close();
```

### Best Practices

1. **Always Use Async Trigger**
   ```javascript
   // ✓ Good - doesn't block HTTP response
   res.status(201).json({ success: true });
   setImmediate(() => triggerFirstTouch(leadId));
   
   // ❌ Bad - blocks response until notifications complete
   await triggerFirstTouch(leadId);
   res.status(201).json({ success: true });
   ```

2. **Log All Notification Attempts**
   - Orchestrator provides detailed console output
   - Save to log files in production
   - Monitor failure rates

3. **Retry Failed Notifications**
   - Set up cron job to retry failed notifications
   - Implement exponential backoff
   - Limit retry attempts

4. **Monitor Performance**
   - Track average notification time
   - Monitor parallel execution efficiency
   - Alert on high failure rates

### Performance Considerations

**Parallel Execution Benefits:**
- Email (typical): 1-3 seconds
- SMS (typical): 0.5-2 seconds
- Sequential total: 1.5-5 seconds
- **Parallel total: 1-3 seconds** (faster of the two)

**Memory Usage:**
- Each notification creates temporary buffers
- Parallel execution uses ~2x memory vs sequential
- Still minimal impact (< 1MB per notification)

### Production Recommendations

1. **Implement Queue System**
   - Use Bull/BullMQ for high-volume scenarios
   - Provides retry logic and persistence
   - Better monitoring and management

2. **Rate Limiting**
   - Respect SMTP and Twilio rate limits
   - Implement per-minute caps
   - Queue excess notifications

3. **Monitoring & Alerting**
   - Track delivery rates per service
   - Alert on sustained failures
   - Monitor queue depth

4. **Logging**
   - Log to external service (e.g., LogDNA, Papertrail)
   - Include lead ID in all log entries
   - Structured logging for easier querying

### Troubleshooting

**Both Notifications Fail**
- Check email service configuration
- Check SMS service configuration
- Verify MongoDB connection
- Check console logs for specific errors

**Only Email Fails**
- Check SMTP credentials
- Verify email service status
- Check spam/rate limits

**Only SMS Fails**
- Check Twilio credentials
- Verify phone number format (E.164)
- Check Twilio account balance
- Verify recipient number (trial accounts)

**firstTouchSentAt Not Updated**
- Both notifications failed
- Check notification statuses
- Review error messages in logs
