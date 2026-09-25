import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Lead from '../models/Lead.js';
import { getFirstTouchEmailTemplate, getFirstTouchEmailText } from '../templates/firstTouchEmail.js';

/**
 * Process HTML for local uploaded images and convert them into CID inline attachments.
 * This guarantees Gmail, Outlook, Apple Mail display images even when running locally or on ephemeral disks!
 */
const processAttachments = (htmlContent) => {
  const attachments = [];
  if (!htmlContent) return { html: htmlContent, attachments };

  const imgRegex = /src=["'](?:https?:\/\/[^\/"'>]+)?\/uploads\/([a-zA-Z0-9_\-\.]+)(?:["'])/g;
  let match;
  const processedFiles = new Set();

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const filename = match[1];
    if (!processedFiles.has(filename)) {
      processedFiles.add(filename);
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        attachments.push({
          filename: filename,
          path: filePath,
          cid: filename
        });
      }
    }
  }

  let updatedHtml = htmlContent;
  for (const att of attachments) {
    const replacePattern = new RegExp(`src=["'](?:https?:\\/\\/[^\\/"'>]+)?\\/uploads\\/${att.filename}["']`, 'g');
    updatedHtml = updatedHtml.replace(replacePattern, `src="cid:${att.cid}"`);
  }

  return { html: updatedHtml, attachments };
};

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
    
    const firstName = lead.name ? lead.name.split(' ')[0] : 'there';
    const rawSubject = settings.emailSubject || 'Thank You for Your Interest - We\'ll Be In Touch Soon!';
    const personalizedSubject = rawSubject.replace(/{{name}}/g, firstName);

    // Get email templates using dynamic settings
    const htmlContent = getFirstTouchEmailTemplate(lead, settings);
    const textContent = getFirstTouchEmailText(lead, settings);
    const { html: processedHtml, attachments } = processAttachments(htmlContent);
    
    // Email options
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || settings.companyName || 'Dack Credit Services',
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: personalizedSubject,
      html: processedHtml,
      text: textContent,
      ...(attachments.length > 0 && { attachments }),
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
    
    const firstName = lead.name ? lead.name.split(' ')[0] : 'there';
    const rawSubject = day === 1 ? settings.day1EmailSubject : settings.day3EmailSubject;
    const personalizedSubject = (rawSubject || '').replace(/{{name}}/g, firstName);

    const htmlContent = getFollowUpEmailTemplate(lead, settings, day);
    const textContent = getFollowUpEmailText(lead, settings, day);
    const { html: processedHtml, attachments } = processAttachments(htmlContent);
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || settings.companyName,
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: personalizedSubject,
      html: processedHtml,
      text: textContent,
      ...(attachments.length > 0 && { attachments })
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

/**
 * Send generic email (for broadcasts and specific sending)
 */
export const sendEmail = async (to, subject, htmlContent, recipientName = '') => {
  try {
    const Settings = (await import('../models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    let finalSubject = subject;
    let finalHtml = htmlContent;

    if (recipientName) {
      finalSubject = finalSubject.replace(/{{name}}/g, recipientName);
      finalHtml = finalHtml.replace(/{{name}}/g, recipientName);
    }

    if (!finalHtml.includes('<html')) {
      finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${finalSubject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; }
        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; border-bottom: 4px solid #f59e0b; color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; color: #334155; line-height: 1.6; font-size: 16px; }
        .cta-button { display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin: 20px 0; font-size: 15px; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>${settings.companyName}</h1>
        </div>
        <div class="content">
            ${finalHtml}
            ${settings.whatsappNumber ? `
            <div style="text-align: center; margin: 24px 0;">
                <a href="https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}" class="cta-button" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: #ffffff;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/64px-WhatsApp.svg.png" alt="WhatsApp" width="18" height="18" style="vertical-align: middle; margin-right: 6px; border: none;" />
                    <span style="vertical-align: middle; color: #ffffff;">Contact Us on WhatsApp</span>
                </a>
            </div>` : ''}
            <div style="height: 1px; background-color: #e2e8f0; margin: 24px 0;"></div>
            <p style="margin: 0; font-size: 14px; color: #64748b;">
                ${(settings.footerSignature || '').replace(/\\n/g, '<br>')}<br>
                <strong>${settings.companyName} Team</strong>
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0 0 8px 0;"><strong>${settings.companyName}</strong></p>
            <p style="margin: 0;">${settings.companyAddress} | <a href="mailto:${settings.supportEmail}" style="color: #64748b;">${settings.supportEmail}</a></p>
        </div>
    </div>
</body>
</html>`.trim();
    }

    const { html: processedHtml, attachments } = processAttachments(finalHtml);

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || settings.companyName,
        address: process.env.EMAIL_FROM
      },
      to,
      subject: finalSubject,
      html: processedHtml,
      ...(attachments.length > 0 && { attachments })
    };
    
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    
    console.log(`✓ Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`✗ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendFirstTouchEmail,
  sendTestEmail,
  verifyEmailConnection,
  sendFollowUpEmail,
  sendEmail
};
