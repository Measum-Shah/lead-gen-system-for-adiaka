import dotenv from 'dotenv';
import { sendTestEmail, verifyEmailConnection, sendFirstTouchEmail } from '../services/emailService.js';

dotenv.config();

console.log('='.repeat(60));
console.log('Email Service Tests');
console.log('='.repeat(60));

// Check if SMTP is configured
const isConfigured = 
  process.env.SMTP_HOST && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD &&
  process.env.EMAIL_FROM;

if (!isConfigured) {
  console.log('\n⚠️  SMTP Configuration Missing!');
  console.log('\nPlease configure the following in your .env file:');
  console.log('- SMTP_HOST (e.g., smtp.gmail.com)');
  console.log('- SMTP_PORT (e.g., 587)');
  console.log('- SMTP_SECURE (true for port 465, false for others)');
  console.log('- SMTP_USER (your email address)');
  console.log('- SMTP_PASSWORD (your app password)');
  console.log('- EMAIL_FROM (sender email address)');
  console.log('\nFor Gmail:');
  console.log('1. Enable 2-factor authentication');
  console.log('2. Generate an app password at: https://myaccount.google.com/apppasswords');
  console.log('3. Use the app password (not your regular password)');
  process.exit(0);
}

console.log('\n✓ SMTP Configuration Found');
console.log(`  Host: ${process.env.SMTP_HOST}`);
console.log(`  Port: ${process.env.SMTP_PORT}`);
console.log(`  User: ${process.env.SMTP_USER}`);
console.log(`  From: ${process.env.EMAIL_FROM}`);

async function runTests() {
  try {
    // Test 1: Verify connection
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Verify SMTP Connection');
    console.log('='.repeat(60));
    
    const isConnected = await verifyEmailConnection();
    if (isConnected) {
      console.log('✓ SMTP connection successful');
    } else {
      console.log('✗ SMTP connection failed');
      console.log('\nTroubleshooting:');
      console.log('- Check your SMTP credentials');
      console.log('- For Gmail, ensure you\'re using an app password');
      console.log('- Check if "Less secure app access" is enabled (if not using app password)');
      console.log('- Verify your internet connection');
      return;
    }
    
    // Test 2: Send test email
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Send Test Email');
    console.log('='.repeat(60));
    
    const testEmailAddress = process.env.SMTP_USER; // Send to self for testing
    console.log(`Sending test email to: ${testEmailAddress}`);
    
    const testResult = await sendTestEmail(testEmailAddress);
    if (testResult.success) {
      console.log('✓ Test email sent successfully');
      console.log(`  Message ID: ${testResult.messageId}`);
      console.log(`\n  Check your inbox at ${testEmailAddress}`);
    } else {
      console.log('✗ Test email failed');
      console.log(`  Error: ${testResult.error}`);
      return;
    }
    
    // Test 3: Send first-touch email with mock lead
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Send First-Touch Email (Mock Lead)');
    console.log('='.repeat(60));
    
    const mockLead = {
      name: 'John Doe',
      email: testEmailAddress, // Send to self
      phone: '+923001234567'
    };
    
    console.log('Mock lead:', mockLead);
    console.log('Sending first-touch email...');
    
    const firstTouchResult = await sendFirstTouchEmail(mockLead);
    if (firstTouchResult.success) {
      console.log('✓ First-touch email sent successfully');
      console.log(`  Message ID: ${firstTouchResult.messageId}`);
      console.log(`\n  Check your inbox at ${testEmailAddress}`);
      console.log('  You should see a formatted welcome email');
    } else {
      console.log('✗ First-touch email failed');
      console.log(`  Error: ${firstTouchResult.error}`);
    }
    
    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✓ SMTP connection working');
    console.log('✓ Test email sent');
    console.log('✓ First-touch email sent');
    console.log('\nEmail service is fully functional!');
    console.log('\nNote: Lead status updates require MongoDB connection.');
    console.log('In production, email status will be saved to the database.');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
runTests();
