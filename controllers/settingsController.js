import Settings from '../models/Settings.js';

/**
 * Get Settings
 * Creates default settings if none exist
 */
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

/**
 * Update Settings
 */
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const allowedFields = [
      'companyName', 'websiteUrl', 'supportPhone', 'supportEmail',
      'companyAddress', 'footerSignature', 'whatsappNumber',
      'emailSubject', 'emailBody',
      'day1EmailSubject', 'day1EmailBody',
      'day3EmailSubject', 'day3EmailBody'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

import Broadcast from '../models/Broadcast.js';

export const getActiveBroadcast = async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({ status: 'active' });
    res.json({ success: true, data: broadcast });
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcast' });
  }
};

export const startBroadcast = async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'Subject and body required' });

    // Mark existing active broadcast as completed
    await Broadcast.updateMany({ status: 'active' }, { status: 'completed' });

    const newBroadcast = new Broadcast({ subject, body });
    await newBroadcast.save();

    res.json({ success: true, message: 'Mass email campaign started', data: newBroadcast });
  } catch (error) {
    console.error('Error starting broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to start broadcast' });
  }
};
