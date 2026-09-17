import cron from 'node-cron';
import Lead from '../models/Lead.js';
import { sendFollowUpEmail } from '../services/emailService.js';

export const initCronJobs = () => {
  // Run every day at 9:00 AM server time
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily follow-up job...');
    await processDay1FollowUps();
    await processDay3FollowUps();
  });
  
  console.log('✓ Daily follow-up cron jobs initialized');
};

const processDay1FollowUps = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Find leads created strictly before 24 hours ago, still in 'new' status
    const leads = await Lead.find({
      status: 'new',
      createdAt: { $lte: oneDayAgo }
    });
    
    console.log(`Found ${leads.length} leads for Day 1 Follow-Up`);
    
    for (const lead of leads) {
      const result = await sendFollowUpEmail(lead, 1);
      if (result.success) {
        lead.status = 'contacted';
        await lead.save();
      }
    }
  } catch (error) {
    console.error('Error processing Day 1 follow-ups:', error);
  }
};

const processDay3FollowUps = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Find leads created strictly before 3 days ago, still in 'contacted' status
    const leads = await Lead.find({
      status: 'contacted',
      createdAt: { $lte: threeDaysAgo }
    });
    
    console.log(`Found ${leads.length} leads for Day 3 Follow-Up`);
    
    for (const lead of leads) {
      const result = await sendFollowUpEmail(lead, 3);
      if (result.success) {
        lead.status = 'followed_up';
        await lead.save();
      }
    }
  } catch (error) {
    console.error('Error processing Day 3 follow-ups:', error);
  }
};
