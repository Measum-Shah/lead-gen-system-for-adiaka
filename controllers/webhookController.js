import Lead from '../models/Lead.js';
import { validateLeadSubmission } from '../utils/validation.js';

/**
 * Handle incoming lead submissions from WordPress webhook
 * 
 * @route POST /api/webhook/lead
 * @access Protected (webhook secret required)
 */
export const receiveLead = async (req, res) => {
  try {
    const { name, email, phone, source } = req.body;
    
    // Validate the incoming data
    const validation = validateLeadSubmission({ name, email, phone, source });
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Check if lead with this email already exists
    const existingLead = await Lead.findOne({ email: validation.data.email });
    
    if (existingLead) {
      // Ignore creation but append to duplicateSubmissions array to track
      if (!existingLead.duplicateSubmissions) {
        existingLead.duplicateSubmissions = [];
      }
      existingLead.duplicateSubmissions.push(new Date());
      
      // Optionally update name/phone if they provided new ones, or keep original.
      // We will keep the original but update the interaction history.
      
      await existingLead.save();
      
      console.log(`Duplicate submission tracked: ${existingLead.email} (ID: ${existingLead._id})`);
      
      return res.status(200).json({
        success: true,
        message: 'Duplicate lead tracked successfully',
        leadId: existingLead._id,
        isDuplicate: true
      });
    }
    
    // Create new lead
    const lead = new Lead({
      ...validation.data,
      leadType: 'website',
      campaignStatus: 'instant_pending'
    });
    await lead.save();
    
    console.log(`New lead created: ${lead.email} (ID: ${lead._id})`);
    
    // Respond immediately with 201 Created
    res.status(201).json({
      success: true,
      message: 'Lead received successfully',
      leadId: lead._id
    });
    
    // Trigger first-touch synchronously but in the background
    setImmediate(async () => {
      try {
        const { consumeQuota } = await import('../services/quotaManager.js');
        const hasQuota = await consumeQuota(false); // website lead

        if (hasQuota) {
          const { sendFirstTouchEmail } = await import('../services/emailService.js');
          const emailResult = await sendFirstTouchEmail(lead);

          if (emailResult.success) {
            const twoDays = new Date();
            twoDays.setDate(twoDays.getDate() + 2);

            lead.campaignStatus = 'followup1_pending';
            lead.instantSentAt = new Date();
            lead.followup1DueAt = twoDays;
            
            lead.emailLog = lead.emailLog || [];
            lead.emailLog.push({
              stage: 'instant_sent',
              sentAt: new Date(),
              mailgunMessageId: emailResult.messageId || 'unknown',
              status: 'delivered'
            });

            await lead.save();
            console.log(`First-touch notification sent for lead: ${lead._id}`);
          }
        } else {
          console.log(`Daily quota hit. Lead ${lead._id} queued as instant_pending.`);
        }
      } catch (error) {
        console.error(`Failed to trigger notifications for lead ${lead._id}:`, error.message);
      }
    });
    
  } catch (error) {
    console.error('Error processing lead submission:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Error processing lead submission',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Handle Mailgun bounce/failure webhooks
 * @route POST /api/webhook/mailgun
 */
export const mailgunWebhook = async (req, res) => {
  try {
    const eventData = req.body['event-data'];
    if (!eventData) return res.status(400).send('Invalid webhook payload');

    const email = eventData.recipient;
    const eventType = eventData.event;

    if (eventType === 'failed' || eventType === 'bounced') {
      await Lead.updateMany(
        { email: email },
        { $set: { campaignStatus: 'bounced' } }
      );
      console.log(`Mailgun bounce recorded for: ${email}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Mailgun webhook error:', error);
    res.status(500).send('Error');
  }
};
