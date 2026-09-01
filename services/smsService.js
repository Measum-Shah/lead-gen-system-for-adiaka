import twilio from 'twilio';
import Lead from '../models/Lead.js';
import { getFirstTouchSMSTemplate } from '../templates/firstTouchSMS.js';

/**
 * SMS Service
 * 
 * Handles sending SMS messages using Twilio API.
 * Supports first-touch SMS notifications to new leads.
 */

// Twilio client instance
let twilioClient = null;

/**
 * Get or create Twilio client
 * @returns {Object} Twilio client instance
 */
const getTwilioClient = () => {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }
    
    twilioClient = twilio(accountSid, authToken);
    
    console.log('SMS service initialized with Twilio');
  }
  
  return twilioClient;
};

/**
 * Verify Twilio configuration and credentials
 * @returns {Promise<boolean>} - Verification status
 */
export const verifySMSConnection = async () => {
  try {
    const client = getTwilioClient();
    
    // Verify account by fetching account details
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    console.log('✓ SMS service connection verified');
    console.log(`  Account: ${account.friendlyName}`);
    console.log(`  Status: ${account.status}`);
    
    return true;
  } catch (error) {
    console.error('✗ SMS service connection failed:', error.message);
    return false;
  }
};

/**
 * Send first-touch SMS to a new lead
 * 
 * @param {Object} lead - Lead document from MongoDB
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendFirstTouchSMS = async (lead) => {
  try {
    // Validate required environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('SMS service not configured. Missing Twilio credentials.');
    }
    
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set.');
    }
    
    // Validate lead object
    if (!lead || !lead.phone || !lead.name) {
      throw new Error('Invalid lead object. Phone and name are required.');
    }
    
    // Get SMS template
    const messageBody = getFirstTouchSMSTemplate(lead);
    
    // Validate message length
    if (messageBody.length > 1600) {
      console.warn('SMS message is very long and will be split into multiple segments');
    }
    
    // Send SMS via Twilio
    const client = getTwilioClient();
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: lead.phone // Must be in E.164 format (e.g., +923001234567)
    });
    
    console.log(`✓ SMS sent to ${lead.phone} (Message SID: ${message.sid})`);
    console.log(`  Status: ${message.status}`);
    console.log(`  Segments: ${message.numSegments || 1}`);
    
    // Update lead status in database
    if (lead._id) {
      await Lead.findByIdAndUpdate(lead._id, {
        smsStatus: 'sent',
        firstTouchSentAt: new Date()
      });
      console.log(`✓ Lead ${lead._id} SMS status updated to 'sent'`);
    }
    
    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
      phone: lead.phone,
      segments: message.numSegments || 1
    };
    
  } catch (error) {
    console.error(`✗ Failed to send SMS to ${lead.phone}:`, error.message);
    
    // Log specific Twilio errors
    if (error.code) {
      console.error(`  Twilio Error Code: ${error.code}`);
      console.error(`  More info: https://www.twilio.com/docs/api/errors/${error.code}`);
    }
    
    // Update lead status to failed (don't throw - graceful degradation)
    if (lead._id) {
      try {
        await Lead.findByIdAndUpdate(lead._id, {
          smsStatus: 'failed'
        });
        console.log(`✓ Lead ${lead._id} SMS status updated to 'failed'`);
      } catch (dbError) {
        console.error(`✗ Failed to update lead status:`, dbError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      phone: lead.phone
    };
  }
};

/**
 * Send a test SMS to verify configuration
 * 
 * @param {string} testPhone - Phone number to send test to (E.164 format)
 * @returns {Promise<Object>} - Result object
 */
export const sendTestSMS = async (testPhone) => {
  try {
    const client = getTwilioClient();
    
    const messageBody = `Lead Capture System - Test SMS\n\nThis is a test message from your Lead Capture & Follow-Up System. If you received this, your Twilio configuration is working correctly! ✓\n\nSent at: ${new Date().toISOString()}`;
    
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: testPhone
    });
    
    console.log(`✓ Test SMS sent to ${testPhone} (Message SID: ${message.sid})`);
    console.log(`  Status: ${message.status}`);
    
    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
      message: 'Test SMS sent successfully'
    };
    
  } catch (error) {
    console.error(`✗ Failed to send test SMS:`, error.message);
    
    if (error.code) {
      console.error(`  Twilio Error Code: ${error.code}`);
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
};

/**
 * Get SMS delivery status for a message
 * 
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<Object>} - Message status details
 */
export const getSMSStatus = async (messageSid) => {
  try {
    const client = getTwilioClient();
    const message = await client.messages(messageSid).fetch();
    
    return {
      success: true,
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      price: message.price,
      priceUnit: message.priceUnit,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error(`✗ Failed to get SMS status:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get account balance and usage info
 * 
 * @returns {Promise<Object>} - Account balance details
 */
export const getTwilioAccountInfo = async () => {
  try {
    const client = getTwilioClient();
    const balance = await client.balance.fetch();
    
    return {
      success: true,
      balance: balance.balance,
      currency: balance.currency
    };
  } catch (error) {
    console.error(`✗ Failed to get account info:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendFirstTouchSMS,
  sendTestSMS,
  verifySMSConnection,
  getSMSStatus,
  getTwilioAccountInfo
};
