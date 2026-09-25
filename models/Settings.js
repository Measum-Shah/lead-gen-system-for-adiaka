import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Dack Credit Services' },
  websiteUrl: { type: String, default: 'https://dackcreditservices.com' },
  supportPhone: { type: String, default: '+92 300 1234567' },
  supportEmail: { type: String, default: 'info@dackcreditservices.com' },
  companyAddress: { type: String, default: '123 Business Street, City, Country' },
  emailSubject: { type: String, default: 'Thank You for Contacting Dack Credit Services' },
  emailBody: { 
    type: String, 
    default: "<p>Hi {{name}},</p><p>Thank you for reaching out to us. We understand that navigating credit can be stressful, but you've just taken the most important step: getting started.</p><p>Our team is reviewing your details and will be in touch shortly to schedule your free consultation.</p>" 
  },
  
  // Signature
  footerSignature: { type: String, default: "Regards,\nAyika Hatten" },
  whatsappNumber: { type: String, default: "1234567890" },
  
  // Day 1 Follow-Up
  day1EmailSubject: { type: String, default: "Checking in - did you get my last email?" },
  day1EmailBody: { 
    type: String, 
    default: "<p>Hi {{name}},</p><p>I reached out recently but didn't hear back. I want to make sure my previous email didn't get buried in your spam folder!</p><p>Are you still interested in learning how we can help you achieve your financial goals?</p>" 
  },
  
  // Day 3 Follow-Up
  day3EmailSubject: { type: String, default: "Still looking for help with your goals?" },
  day3EmailBody: { 
    type: String, 
    default: "<p>Hi {{name}},</p><p>We are currently taking on a few new clients this week, and I wanted to see if you were still looking for assistance.</p><p>If now isn't a good time, just let me know and I'll pause our communications.</p>" 
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
