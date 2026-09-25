import cron from 'node-cron';
import Lead from '../models/Lead.js';
import Broadcast from '../models/Broadcast.js';
import { sendFirstTouchEmail, sendFollowUpEmail, sendEmail } from '../services/emailService.js';
import { consumeQuota } from '../services/quotaManager.js';

const FOLLOWUP1_DELAY_DAYS = parseInt(process.env.FOLLOWUP1_DELAY_DAYS || '2');
const FOLLOWUP2_DELAY_DAYS = parseInt(process.env.FOLLOWUP2_DELAY_DAYS || '3');

export const initCampaignCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running campaign scheduler job...');
    await processQueue();
  });
  console.log('✓ Campaign scheduler cron job initialized (hourly)');
};

const tiers = [
  { type: 'website', status: 'instant_pending', dueField: null },
  { type: 'website', status: 'followup2_pending', dueField: 'followup2DueAt' },
  { type: 'website', status: 'followup1_pending', dueField: 'followup1DueAt' }
];

const processQueue = async () => {
  const now = new Date();
  
  // 1. Process Mass Email (Broadcast) First
  const activeBroadcast = await Broadcast.findOne({ status: 'active' });
  const massIsActive = !!activeBroadcast;
  
  if (massIsActive) {
    let hasMoreMass = true;
    while (hasMoreMass) {
      // Find a lead that hasn't received this broadcast
      const lead = await Lead.findOneAndUpdate(
        { 
          unsubscribed: false,
          campaignStatus: { $ne: 'bounced' },
          broadcastsReceived: { $ne: activeBroadcast._id }
        },
        { $push: { broadcastsReceived: activeBroadcast._id } }, // temporarily claim by pushing
        { sort: { createdAt: -1 }, new: true }
      );
      
      if (!lead) {
        // No more leads need this broadcast! Mark it completed.
        activeBroadcast.status = 'completed';
        await activeBroadcast.save();
        console.log(`Mass Email campaign "${activeBroadcast.subject}" completed!`);
        hasMoreMass = false;
        break;
      }
      
      const gotQuota = await consumeQuota('mass', true);
      if (!gotQuota) {
        // Revert claim
        await Lead.updateOne({ _id: lead._id }, { $pull: { broadcastsReceived: activeBroadcast._id } });
        console.log(`Mass Email quota exhausted for today.`);
        hasMoreMass = false;
        break;
      }
      
      // Send Mass Email
      try {
        const result = await sendEmail(
          lead.email,
          activeBroadcast.subject,
          activeBroadcast.body
        );
        
        if (result.success) {
          lead.emailLog = lead.emailLog || [];
          lead.emailLog.push({
            stage: 'mass_email',
            sentAt: new Date(),
            mailgunMessageId: result.messageId || 'unknown',
            status: 'delivered'
          });
          await lead.save();
        } else {
          // Revert on transient failure
          const { refundQuota } = await import('../services/quotaManager.js');
          await refundQuota('mass');
          await Lead.updateOne({ _id: lead._id }, { $pull: { broadcastsReceived: activeBroadcast._id } });
        }
      } catch (error) {
        console.error(`Error sending mass email to ${lead._id}:`, error);
        const { refundQuota } = await import('../services/quotaManager.js');
        await refundQuota('mass');
        await Lead.updateOne({ _id: lead._id }, { $pull: { broadcastsReceived: activeBroadcast._id } });
      }
    }
  }

  // 2. Process Website Automated Emails
  for (const tier of tiers) {
    let hasMore = true;

    while (hasMore) {
      const query = {
        leadType: tier.type,
        campaignStatus: tier.status,
        unsubscribed: false
      };

      if (tier.dueField) {
        query[tier.dueField] = { $lte: now };
      }

      // Claim a lead atomically by shifting its status to a temporary 'processing' state
      const lead = await Lead.findOneAndUpdate(
        query,
        { $set: { campaignStatus: `${tier.status}_processing` } },
        { sort: tier.dueField ? { [tier.dueField]: 1 } : { createdAt: 1 }, new: true }
      );

      if (!lead) {
        hasMore = false; // No more leads in this tier
        continue;
      }

      // Check quota and consume it
      const gotQuota = await consumeQuota('website', massIsActive);

      if (!gotQuota) {
        // Quota exhausted. Revert the lead and abort the entire queue run.
        await Lead.updateOne({ _id: lead._id }, { $set: { campaignStatus: tier.status } });
        console.log(`Website quota exhausted during ${tier.status}. Halting scheduler.`);
        return; // Exit the cron run completely
      }

      // Send the automated email
      try {
        let result;
        let nextStatus = '';
        let stage = '';

        if (tier.status === 'instant_pending') {
          result = await sendFirstTouchEmail(lead);
          stage = 'instant_sent';
          if (result.success) {
            nextStatus = 'followup1_pending';
            lead.instantSentAt = new Date();
            const due = new Date();
            due.setDate(due.getDate() + FOLLOWUP1_DELAY_DAYS);
            lead.followup1DueAt = due;
          }
        } else if (tier.status === 'followup1_pending') {
          result = await sendFollowUpEmail(lead, 1);
          stage = 'followup1_sent';
          if (result.success) {
            nextStatus = 'followup2_pending';
            lead.followup1SentAt = new Date();
            const due = new Date();
            due.setDate(due.getDate() + FOLLOWUP2_DELAY_DAYS);
            lead.followup2DueAt = due;
          }
        } else if (tier.status === 'followup2_pending') {
          result = await sendFollowUpEmail(lead, 3);
          stage = 'followup2_sent';
          if (result.success) {
            nextStatus = 'completed';
            lead.followup2SentAt = new Date();
          }
        }

        if (result.success) {
          // Log success
          lead.campaignStatus = nextStatus;
          lead.emailLog = lead.emailLog || [];
          lead.emailLog.push({
            stage,
            sentAt: new Date(),
            mailgunMessageId: result.messageId || 'unknown',
            status: 'delivered'
          });
          await lead.save();
        } else {
          // Revert status and refund quota on transient failure
          const { refundQuota } = await import('../services/quotaManager.js');
          await refundQuota('website');
          lead.campaignStatus = tier.status; // revert to retry
          await lead.save();
        }

      } catch (error) {
        console.error(`Error processing website lead ${lead._id} in tier ${tier.status}:`, error);
        
        // Revert status and refund quota on error
        const { refundQuota } = await import('../services/quotaManager.js');
        await refundQuota('website');
        await Lead.updateOne({ _id: lead._id }, { $set: { campaignStatus: tier.status } });
      }
    }
  }
};
