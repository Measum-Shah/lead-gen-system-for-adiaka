import Lead from '../models/Lead.js';
import { sendFirstTouchEmail } from './emailService.js';
import { sendFirstTouchSMS } from './smsService.js';

/**
 * Notification Orchestrator Service
 * 
 * Coordinates sending both email and SMS notifications to new leads.
 * Uses Promise.allSettled to ensure both attempts complete regardless of individual failures.
 */

/**
 * Trigger first-touch notifications for a lead
 * Sends both email and SMS in parallel
 * 
 * @param {string} leadId - MongoDB ObjectId of the lead
 * @returns {Promise<Object>} - Result object with both notification statuses
 */
export const triggerFirstTouch = async (leadId) => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Triggering first-touch notifications for lead: ${leadId}`);
    console.log('='.repeat(60));
    
    // Fetch lead from database
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      console.error(`✗ Lead not found: ${leadId}`);
      return {
        success: false,
        error: 'Lead not found',
        emailSent: false,
        smsSent: false
      };
    }
    
    console.log(`Lead Details:`);
    console.log(`  Name: ${lead.name}`);
    console.log(`  Email: ${lead.email}`);
    console.log(`  Phone: ${lead.phone}`);
    console.log(`  Source: ${lead.source}`);
    
    // Send both email and SMS in parallel using Promise.allSettled
    // This ensures both attempts complete, even if one fails
    console.log(`\nSending notifications in parallel...`);
    
    const [emailResult, smsResult] = await Promise.allSettled([
      sendFirstTouchEmail(lead),
      sendFirstTouchSMS(lead)
    ]);
    
    // Process email result
    const emailSuccess = emailResult.status === 'fulfilled' && emailResult.value.success;
    const emailError = emailResult.status === 'rejected' 
      ? emailResult.reason.message 
      : (!emailResult.value.success ? emailResult.value.error : null);
    
    // Process SMS result
    const smsSuccess = smsResult.status === 'fulfilled' && smsResult.value.success;
    const smsError = smsResult.status === 'rejected'
      ? smsResult.reason.message
      : (!smsResult.value.success ? smsResult.value.error : null);
    
    // Log results
    console.log(`\nNotification Results:`);
    console.log(`  Email: ${emailSuccess ? '✓ Sent' : '✗ Failed'}`);
    if (emailError) {
      console.log(`    Error: ${emailError}`);
    }
    console.log(`  SMS: ${smsSuccess ? '✓ Sent' : '✗ Failed'}`);
    if (smsError) {
      console.log(`    Error: ${smsError}`);
    }
    
    // Update lead with final notification timestamp if at least one succeeded
    if (emailSuccess || smsSuccess) {
      if (!lead.firstTouchSentAt) {
        lead.firstTouchSentAt = new Date();
        await lead.save();
        console.log(`✓ Lead firstTouchSentAt timestamp updated`);
      }
    }
    
    // Reload lead to get updated status
    const updatedLead = await Lead.findById(leadId);
    
    console.log(`\nFinal Lead Status:`);
    console.log(`  Email Status: ${updatedLead.emailStatus}`);
    console.log(`  SMS Status: ${updatedLead.smsStatus}`);
    console.log(`  First Touch Sent: ${updatedLead.firstTouchSentAt ? updatedLead.firstTouchSentAt.toISOString() : 'Not yet'}`);
    console.log('='.repeat(60));
    
    return {
      success: emailSuccess || smsSuccess, // Success if at least one notification sent
      leadId: lead._id,
      emailSent: emailSuccess,
      smsSent: smsSuccess,
      emailError: emailError,
      smsError: smsError,
      emailStatus: updatedLead.emailStatus,
      smsStatus: updatedLead.smsStatus,
      firstTouchSentAt: updatedLead.firstTouchSentAt
    };
    
  } catch (error) {
    console.error(`✗ Error in notification orchestrator:`, error);
    console.log('='.repeat(60));
    
    return {
      success: false,
      error: error.message,
      emailSent: false,
      smsSent: false
    };
  }
};

/**
 * Retry failed notifications for a lead
 * Only retries notifications that previously failed
 * 
 * @param {string} leadId - MongoDB ObjectId of the lead
 * @returns {Promise<Object>} - Result object with retry statuses
 */
export const retryFailedNotifications = async (leadId) => {
  try {
    console.log(`\nRetrying failed notifications for lead: ${leadId}`);
    
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return {
        success: false,
        error: 'Lead not found'
      };
    }
    
    const retryPromises = [];
    let emailRetried = false;
    let smsRetried = false;
    
    // Only retry failed or pending notifications
    if (lead.emailStatus === 'failed' || lead.emailStatus === 'pending') {
      console.log(`Retrying email (current status: ${lead.emailStatus})`);
      retryPromises.push(sendFirstTouchEmail(lead));
      emailRetried = true;
    } else {
      console.log(`Skipping email (status: ${lead.emailStatus})`);
    }
    
    if (lead.smsStatus === 'failed' || lead.smsStatus === 'pending') {
      console.log(`Retrying SMS (current status: ${lead.smsStatus})`);
      retryPromises.push(sendFirstTouchSMS(lead));
      smsRetried = true;
    } else {
      console.log(`Skipping SMS (status: ${lead.smsStatus})`);
    }
    
    if (retryPromises.length === 0) {
      console.log('No failed notifications to retry');
      return {
        success: true,
        message: 'No failed notifications to retry',
        emailRetried: false,
        smsRetried: false
      };
    }
    
    // Execute retries in parallel
    const results = await Promise.allSettled(retryPromises);
    
    let emailSuccess = false;
    let smsSuccess = false;
    
    if (emailRetried) {
      emailSuccess = results[0].status === 'fulfilled' && results[0].value.success;
    }
    
    if (smsRetried) {
      const smsIndex = emailRetried ? 1 : 0;
      smsSuccess = results[smsIndex].status === 'fulfilled' && results[smsIndex].value.success;
    }
    
    // Reload lead to get updated status
    const updatedLead = await Lead.findById(leadId);
    
    console.log(`Retry Results:`);
    if (emailRetried) {
      console.log(`  Email: ${emailSuccess ? '✓ Sent' : '✗ Failed again'}`);
    }
    if (smsRetried) {
      console.log(`  SMS: ${smsSuccess ? '✓ Sent' : '✗ Failed again'}`);
    }
    
    return {
      success: emailSuccess || smsSuccess,
      emailRetried,
      smsRetried,
      emailSuccess,
      smsSuccess,
      emailStatus: updatedLead.emailStatus,
      smsStatus: updatedLead.smsStatus
    };
    
  } catch (error) {
    console.error(`✗ Error retrying notifications:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get notification status summary for a lead
 * 
 * @param {string} leadId - MongoDB ObjectId of the lead
 * @returns {Promise<Object>} - Notification status details
 */
export const getNotificationStatus = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return {
        success: false,
        error: 'Lead not found'
      };
    }
    
    return {
      success: true,
      leadId: lead._id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      emailStatus: lead.emailStatus,
      smsStatus: lead.smsStatus,
      firstTouchSent: lead.isFirstTouchSent(),
      fullyNotified: lead.isFullyNotified(),
      firstTouchSentAt: lead.firstTouchSentAt,
      createdAt: lead.createdAt
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  triggerFirstTouch,
  retryFailedNotifications,
  getNotificationStatus
};
