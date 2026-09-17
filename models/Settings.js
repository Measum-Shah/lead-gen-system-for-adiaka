import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Dack Credit Services' },
  websiteUrl: { type: String, default: 'https://dackcreditservices.com' },
  supportPhone: { type: String, default: '+92 300 1234567' },
  supportEmail: { type: String, default: 'info@dackcreditservices.com' },
  companyAddress: { type: String, default: '123 Business Street, City, Country' },
  emailGreeting: { type: String, default: 'Thank you for reaching out to us! We\\'ve received your inquiry and we\\'re excited to connect with you.' },
  emailBody: { type: String, default: 'Our team will review your information and get back to you within 24 hours. We\\'re here to answer any questions you may have and help you find the perfect solution.' },
  emailNextSteps: { type: String, default: 'In the meantime, feel free to:\\n- Visit our website to learn more about our services\\n- Check out our FAQs for quick answers\\n- Follow us on social media for updates and tips' },
  
  // Signature
  footerSignature: { type: String, default: 'Regards,\\nAyika Hatten' },
  whatsappNumber: { type: String, default: '1234567890' },
  
  // Day 1 Follow-Up
  day1EmailSubject: { type: String, default: 'Checking in on your inquiry - Dack Credit Services' },
  day1EmailGreeting: { type: String, default: 'I wanted to personally check in regarding your recent inquiry.' },
  day1EmailBody: { type: String, default: 'We haven\\'t heard back from you yet, but we are ready to assist you with your credit needs. Let us know when you are available for a quick chat.' },
  day1EmailNextSteps: { type: String, default: 'You can reply directly to this email to schedule a call, or use the link below to get started immediately.' },
  
  // Day 3 Follow-Up
  day3EmailSubject: { type: String, default: 'Following up on your request - Next Steps' },
  day3EmailGreeting: { type: String, default: 'I\\'m following up one more time to see if you still need assistance.' },
  day3EmailBody: { type: String, default: 'We know life gets busy! Whenever you are ready to improve your credit profile, our team is here for you.' },
  day3EmailNextSteps: { type: String, default: 'To keep your file active, simply reply to this email or give us a call. We look forward to helping you achieve your goals!' }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
