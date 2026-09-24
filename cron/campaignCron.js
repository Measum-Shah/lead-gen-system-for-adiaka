import cron from 'node-cron';
import Lead from '../models/Lead.js';
import { sendFirstTouchEmail, sendFollowUpEmail } from '../services/emailService.js';
import { consumeQuota } from '../services/quotaManager.js';

const FOLLOWUP1_DELAY_DAYS = parseInt(process.env.FOLLOWUP1_DELAY_DAYS || '2');
const FOLLOWUP2_DELAY_DAYS = parseInt(process.env.FOLLOWUP2_DELAY_DAYS || '3');

export const initCampaignCron = () => {
  // Run hourly
  cron.schedule('0 * * * *', async () => {
    console.log('Running campaign scheduler job...');
    await processQueue();
  });
  console.log('✓ Campaign scheduler cron job initialized (hourly)');
};

const tiers = [
  { type: 'website', status: 'instant_pending', dueField: null },
  { type: 'website', status: 'followup2_pending', dueField: 'followup2DueAt' },
  { type: 'website', status: 'followup1_pending', dueField: 'followup1DueAt' },
  { type: 'imported', status: 'followup2_pending', dueField: 'followup2DueAt' },
  { type: 'imported', status: 'followup1_pending', dueField: 'followup1DueAt' }
];

const processQueue = async () => {
  const now = new Date();

  for (const tier of tiers) {
    let hasMore = true;

    while (hasMore) {
      const isImported = tier.type === 'imported';
      
      // Before even trying to claim, check if we might have quota
      // (consumeQuota actually atomic increments if allowed, so we do it right before sending)
      // Actually, if we just check quota here we avoid pulling docs unnecessarily,
      // but the exact quota decrement happens when we know we have a lead.

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

      // We claimed a lead! Let's check quota and consume it.
      const gotQuota = await consumeQuota(isImported);

      if (!gotQuota) {
        // Quota exhausted. Revert the lead and abort the entire queue run.
        await Lead.updateOne({ _id: lead._id }, { $set: { campaignStatus: tier.status } });
        console.log(`Quota exhausted during ${tier.type} ${tier.status}. Halting scheduler.`);
        return; // Exit the cron run completely
      }

      // We have quota and the lead. Send the email!
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
          result = await sendFollowUpEmail(lead, 3); // 3 maps to the Day 3 email template in existing code
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
          await refundQuota(isImported);
          lead.campaignStatus = tier.status; // revert to retry
          await lead.save();
        }

      } catch (error) {
        console.error(`Error processing lead ${lead._id} in tier ${tier.status}:`, error);
        
        // Revert status and refund quota on error
        const { refundQuota } = await import('../services/quotaManager.js');
        await refundQuota(isImported);
        await Lead.updateOne({ _id: lead._id }, { $set: { campaignStatus: tier.status } });
      }
    }
  }
};
