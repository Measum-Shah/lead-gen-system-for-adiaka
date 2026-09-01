/**
 * First Touch SMS Template
 * 
 * SMS template sent to new leads as initial contact.
 * Keep it concise - SMS should be under 160 characters for single message.
 */

/**
 * Get first-touch SMS message text
 * 
 * @param {Object} lead - Lead object with name, email, phone
 * @returns {string} - SMS message text
 */
export const getFirstTouchSMSTemplate = (lead) => {
  const firstName = lead.name.split(' ')[0]; // Get first name
  
  // Keep it short and professional
  // Total: ~140 characters (within single SMS limit)
  return `Hi ${firstName}! Thanks for your interest. We've received your inquiry and will contact you within 24 hours. - Your Company Team`;
};

/**
 * Alternative SMS templates for different scenarios
 */

export const getSMSTemplates = {
  // Standard first touch (default)
  standard: (lead) => {
    const firstName = lead.name.split(' ')[0];
    return `Hi ${firstName}! Thanks for your interest. We've received your inquiry and will contact you within 24 hours. - Your Company Team`;
  },
  
  // Urgent response template
  urgent: (lead) => {
    const firstName = lead.name.split(' ')[0];
    return `Hi ${firstName}! We got your message! Our team will call you back within 2 hours. Need immediate help? Call us at +92-300-1234567`;
  },
  
  // After-hours template
  afterHours: (lead) => {
    const firstName = lead.name.split(' ')[0];
    return `Hi ${firstName}! Thanks for reaching out. We're currently closed but will respond first thing in the morning. - Your Company`;
  },
  
  // VIP/High-value lead template
  vip: (lead) => {
    const firstName = lead.name.split(' ')[0];
    return `Hi ${firstName}! Thank you for your interest. A senior team member will personally reach out to you shortly. - Your Company`;
  },
  
  // Specific service inquiry
  serviceSpecific: (lead, serviceName) => {
    const firstName = lead.name.split(' ')[0];
    return `Hi ${firstName}! Thanks for your interest in ${serviceName}. We'll send you detailed information shortly. - Your Company`;
  }
};

/**
 * Get SMS character count (useful for testing)
 */
export const getSMSLength = (message) => {
  return {
    length: message.length,
    segments: Math.ceil(message.length / 160),
    warning: message.length > 160 ? 'Message will be sent as multiple SMS segments' : null
  };
};

export default {
  getFirstTouchSMSTemplate,
  getSMSTemplates,
  getSMSLength
};
