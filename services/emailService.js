import nodemailer from 'nodemailer';
import Lead from '../models/Lead.js';
import { getFirstTouchEmailTemplate, getFirstTouchEmailText } from '../templates/firstTouchEmail.js';

/**
 * Email Service
 * 
 * Handles sending emails using Nodemailer with SMTP configuration.
 * Supports Gmail SMTP, SendGrid, Mailgun, or any SMTP relay.
 */

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };
    
    // Log configuration (without sensitive data)
    console.log('Email service initialized with SMTP:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user
    });
    
    transporter = nodemailer.createTransport(config);
  }
  
  return transporter;
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} - Connection status
 */
export const verifyEmailConnection = async () => {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✓ Email service connection verified');
    return true;
  } catch (error) {
    console.error('✗ Email service connection failed:', error.message);
    return false;
  }
};

/**
 * Send first-touch email to a new lead
 * 
 * @param {Object} lead - Lead document from MongoDB
 * @returns {Promise<Object>} - Result object with success status
 */
export const sendFirstTouchEmail = async (lead) => {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Email service not configured. Missing SMTP environment variables.');
    }
    
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM environment variable is not set.');
    }
    
    // Validate lead object
    if (!lead || !lead.email || !lead.name) {
      throw new Error('Invalid lead object. Email and name are required.');
    }

    // Fetch dynamic template settings from DB
    const Settings = (await import('../models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    // Get email templates using dynamic settings
    const htmlContent = getFirstTouchEmailTemplate(lead, settings);
    const textContent = getFirstTouchEmailText(lead, settings);
    
    // Email options
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Your Company',
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: 'Thank You for Your Interest - We\'ll Be In Touch Soon!',
      html: htmlContent,
      text: textContent,
      // Optional: Add reply-to if different from sender
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM
    };
    
    // Send email
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    
    console.log(`✓ Email sent to ${lead.email} (Message ID: ${info.messageId})`);
    
    // Update lead status in database
    if (lead._id) {
      await Lead.findByIdAndUpdate(lead._id, {
        emailStatus: 'sent',
        firstTouchSentAt: new Date()
      });
      console.log(`✓ Lead ${lead._id} email status updated to 'sent'`);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      email: lead.email
    };
    
  } catch (error) {
    console.error(`✗ Failed to send email to ${lead.email}:`, error.message);
    
    // Update lead status to failed (don't throw - graceful degradation)
    if (lead._id) {
      try {
        await Lead.findByIdAndUpdate(lead._id, {
          emailStatus: 'failed'
        });
        console.log(`✓ Lead ${lead._id} email status updated to 'failed'`);
      } catch (dbError) {
        console.error(`✗ Failed to update lead status:`, dbError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      email: lead.email
    };
  }
};

/**
 * Send a test email to verify configuration
 * 
 * @param {string} testEmail - Email address to send test to
 * @returns {Promise<Object>} - Result object
 */
export const sendTestEmail = async (testEmail) => {
  try {
    const transport = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: 'Lead Capture System - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">Email Service Test</h2>
          <p>This is a test email from your Lead Capture & Follow-Up System.</p>
          <p>If you received this email, your SMTP configuration is working correctly! ✓</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #666;">
            Sent at: ${new Date().toISOString()}<br>
            Server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
          </p>
        </div>
      `,
      text: `Email Service Test\n\nThis is a test email from your Lead Capture & Follow-Up System.\n\nIf you received this email, your SMTP configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`
    };
    
    const info = await transport.sendMail(mailOptions);
    
    console.log(`✓ Test email sent to ${testEmail} (Message ID: ${info.messageId})`);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    };
    
  } catch (error) {
    console.error(`✗ Failed to send test email:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send Follow-Up Email
 */
export const sendFollowUpEmail = async (lead, day) => {
  try {
    const Settings = (await import('../models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    const { getFollowUpEmailTemplate, getFollowUpEmailText } = await import('../templates/followUpEmails.js');
    
    const htmlContent = getFollowUpEmailTemplate(lead, settings, day);
    const textContent = getFollowUpEmailText(lead, settings, day);
    const subject = day === 1 ? settings.day1EmailSubject : settings.day3EmailSubject;
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || settings.companyName,
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    };
    
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    
    console.log(`✓ Day ${day} Follow-Up Email sent to ${lead.email} (Message ID: ${info.messageId})`);
    return { success: true };
    
  } catch (error) {
    console.error(`✗ Failed to send Day ${day} Follow-Up to ${lead.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendFirstTouchEmail,
  sendTestEmail,
  verifyEmailConnection,
  sendFollowUpEmail
};
