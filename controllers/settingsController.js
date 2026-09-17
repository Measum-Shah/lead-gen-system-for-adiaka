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
      'companyAddress', 'emailGreeting', 'emailBody', 'emailNextSteps',
      'footerSignature', 'whatsappNumber', 'day1EmailSubject', 'day1EmailGreeting', 'day1EmailBody', 'day1EmailNextSteps',
      'day3EmailSubject', 'day3EmailGreeting', 'day3EmailBody', 'day3EmailNextSteps'
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
