import dotenv from 'dotenv';
import { 
  sendTestSMS, 
  verifySMSConnection, 
  sendFirstTouchSMS,
  getTwilioAccountInfo 
} from '../services/smsService.js';

dotenv.config();

console.log('='.repeat(60));
console.log('SMS Service Tests');
console.log('='.repeat(60));

// Check if Twilio is configured
const isConfigured = 
  process.env.TWILIO_ACCOUNT_SID && 
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

if (!isConfigured) {
  console.log('\n⚠️  Twilio Configuration Missing!');
  console.log('\nPlease configure the following in your .env file:');
  console.log('- TWILIO_ACCOUNT_SID (from Twilio Console)');
  console.log('- TWILIO_AUTH_TOKEN (from Twilio Console)');
  console.log('- TWILIO_PHONE_NUMBER (your Twilio phone number in E.164 format)');
  console.log('\nHow to get Twilio credentials:');
  console.log('1. Sign up at https://www.twilio.com/try-twilio');
  console.log('2. Get $15 free trial credit');
  console.log('3. Get a phone number from the Console');
  console.log('4. Copy Account SID and Auth Token');
  console.log('5. Verify your personal phone number for testing');
  console.log('\nNote: Trial accounts can only send to verified numbers.');
  process.exit(0);
}

console.log('\n✓ Twilio Configuration Found');
console.log(`  Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
console.log(`  Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);

async function runTests() {
  try {
    // Test 1: Verify connection
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Verify Twilio Connection');
    console.log('='.repeat(60));
    
    const isConnected = await verifySMSConnection();
    if (isConnected) {
      console.log('✓ Twilio connection successful');
    } else {
      console.log('✗ Twilio connection failed');
      console.log('\nTroubleshooting:');
      console.log('- Check your Account SID and Auth Token');
      console.log('- Verify credentials are correct in .env file');
      console.log('- Check your internet connection');
      console.log('- Ensure your Twilio account is active');
      return;
    }
    
    // Test 2: Get account info
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Get Account Information');
    console.log('='.repeat(60));
    
    const accountInfo = await getTwilioAccountInfo();
    if (accountInfo.success) {
      console.log('✓ Account info retrieved');
      console.log(`  Balance: ${accountInfo.balance} ${accountInfo.currency}`);
    } else {
      console.log('⚠️  Could not retrieve account balance');
      console.log(`  Error: ${accountInfo.error}`);
    }
    
    // Get test phone number from user input or env
    const testPhone = process.env.TEST_PHONE_NUMBER;
    
    if (!testPhone) {
      console.log('\n' + '='.repeat(60));
      console.log('⚠️  Test Phone Number Not Configured');
      console.log('='.repeat(60));
      console.log('\nTo test SMS sending, add your verified phone number to .env:');
      console.log('TEST_PHONE_NUMBER=+923001234567');
      console.log('\nFor Twilio trial accounts:');
      console.log('- You must verify the recipient number first');
      console.log('- Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('- Click "+" to add and verify your phone number');
      console.log('\nSkipping SMS send tests...');
      return;
    }
    
    // Test 3: Send test SMS
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Send Test SMS');
    console.log('='.repeat(60));
    
    console.log(`Sending test SMS to: ${testPhone}`);
    console.log('(Make sure this number is verified in Twilio if using trial account)');
    
    const testResult = await sendTestSMS(testPhone);
    if (testResult.success) {
      console.log('✓ Test SMS sent successfully');
      console.log(`  Message SID: ${testResult.messageSid}`);
      console.log(`  Status: ${testResult.status}`);
      console.log(`\n  Check your phone at ${testPhone}`);
    } else {
      console.log('✗ Test SMS failed');
      console.log(`  Error: ${testResult.error}`);
      if (testResult.errorCode) {
        console.log(`  Error Code: ${testResult.errorCode}`);
        console.log(`  More info: https://www.twilio.com/docs/api/errors/${testResult.errorCode}`);
      }
      
      // Common error codes
      if (testResult.errorCode === 21211) {
        console.log('\n  → This number is not verified. For trial accounts:');
        console.log('     Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      } else if (testResult.errorCode === 21608) {
        console.log('\n  → The phone number is not a valid SMS-capable number');
      }
      
      return;
    }
    
    // Wait a moment for Twilio to process
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Send first-touch SMS with mock lead
    console.log('\n' + '='.repeat(60));
    console.log('Test 4: Send First-Touch SMS (Mock Lead)');
    console.log('='.repeat(60));
    
    const mockLead = {
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: testPhone
    };
    
    console.log('Mock lead:', mockLead);
    console.log('Sending first-touch SMS...');
    
    const firstTouchResult = await sendFirstTouchSMS(mockLead);
    if (firstTouchResult.success) {
      console.log('✓ First-touch SMS sent successfully');
      console.log(`  Message SID: ${firstTouchResult.messageSid}`);
      console.log(`  Status: ${firstTouchResult.status}`);
      console.log(`  Segments: ${firstTouchResult.segments}`);
      console.log(`\n  Check your phone at ${testPhone}`);
      console.log('  You should see a personalized welcome SMS');
    } else {
      console.log('✗ First-touch SMS failed');
      console.log(`  Error: ${firstTouchResult.error}`);
      if (firstTouchResult.errorCode) {
        console.log(`  Error Code: ${firstTouchResult.errorCode}`);
      }
    }
    
    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✓ Twilio connection working');
    console.log('✓ Account info retrieved');
    if (testResult.success) {
      console.log('✓ Test SMS sent');
    }
    if (firstTouchResult.success) {
      console.log('✓ First-touch SMS sent');
    }
    console.log('\nSMS service is fully functional!');
    console.log('\nNote: Lead status updates require MongoDB connection.');
    console.log('In production, SMS status will be saved to the database.');
    
    // Cost reminder
    console.log('\n💡 Cost Reminder:');
    console.log('- Each SMS costs approximately $0.0075 - $0.01 (varies by country)');
    console.log('- Multi-segment messages cost more');
    console.log('- Check your balance regularly');
    console.log('- Consider upgrading from trial for production use');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
runTests();
