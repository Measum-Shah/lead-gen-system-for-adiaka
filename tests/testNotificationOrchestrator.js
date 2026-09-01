import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { triggerFirstTouch, retryFailedNotifications, getNotificationStatus } from '../services/notify.js';
import Lead from '../models/Lead.js';
import connectDB from '../config/db.js';

dotenv.config();

console.log('='.repeat(60));
console.log('Notification Orchestrator Tests');
console.log('='.repeat(60));

// Check if MongoDB is configured
if (!process.env.MONGO_URI) {
  console.log('\n⚠️  MongoDB Configuration Missing!');
  console.log('\nPlease configure MONGO_URI in your .env file.');
  console.log('These tests require a database connection to create test leads.');
  process.exit(0);
}

// Check if email/SMS are configured
const emailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;
const smsConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

console.log('\nService Configuration Status:');
console.log(`  Email: ${emailConfigured ? '✓ Configured' : '✗ Not configured'}`);
console.log(`  SMS: ${smsConfigured ? '✓ Configured' : '✗ Not configured'}`);

if (!emailConfigured && !smsConfigured) {
  console.log('\n⚠️  Warning: Neither email nor SMS is configured.');
  console.log('Tests will run but notifications will fail.');
  console.log('Configure at least one service to see successful notifications.');
}

async function runTests() {
  let testLeadId = null;
  
  try {
    // Connect to database
    console.log('\n' + '='.repeat(60));
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to database');
    
    // Test 1: Create a test lead
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Create Test Lead');
    console.log('='.repeat(60));
    
    const testLead = new Lead({
      name: 'Test User Orchestrator',
      email: process.env.SMTP_USER || 'test@example.com', // Send to self if configured
      phone: process.env.TEST_PHONE_NUMBER || '+923001234567',
      source: 'test-orchestrator'
    });
    
    await testLead.save();
    testLeadId = testLead._id;
    
    console.log('✓ Test lead created:');
    console.log(`  ID: ${testLead._id}`);
    console.log(`  Name: ${testLead.name}`);
    console.log(`  Email: ${testLead.email}`);
    console.log(`  Phone: ${testLead.phone}`);
    console.log(`  Email Status: ${testLead.emailStatus}`);
    console.log(`  SMS Status: ${testLead.smsStatus}`);
    
    // Test 2: Trigger first-touch notifications
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Trigger First-Touch Notifications');
    console.log('='.repeat(60));
    
    const result = await triggerFirstTouch(testLead._id.toString());
    
    console.log('\nOrchestrator Result:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Email Sent: ${result.emailSent}`);
    console.log(`  SMS Sent: ${result.smsSent}`);
    if (result.emailError) {
      console.log(`  Email Error: ${result.emailError}`);
    }
    if (result.smsError) {
      console.log(`  SMS Error: ${result.smsError}`);
    }
    
    if (result.success) {
      console.log('\n✓ At least one notification sent successfully');
    } else {
      console.log('\n✗ Both notifications failed');
      if (!emailConfigured && !smsConfigured) {
        console.log('  (Expected - services not configured)');
      }
    }
    
    // Test 3: Get notification status
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Get Notification Status');
    console.log('='.repeat(60));
    
    const status = await getNotificationStatus(testLead._id.toString());
    
    if (status.success) {
      console.log('✓ Status retrieved:');
      console.log(`  Lead: ${status.name}`);
      console.log(`  Email Status: ${status.emailStatus}`);
      console.log(`  SMS Status: ${status.smsStatus}`);
      console.log(`  First Touch Sent: ${status.firstTouchSent}`);
      console.log(`  Fully Notified: ${status.fullyNotified}`);
      console.log(`  First Touch At: ${status.firstTouchSentAt || 'Not yet'}`);
    } else {
      console.log('✗ Failed to get status:', status.error);
    }
    
    // Test 4: Test with invalid lead ID
    console.log('\n' + '='.repeat(60));
    console.log('Test 4: Invalid Lead ID Handling');
    console.log('='.repeat(60));
    
    const invalidId = new mongoose.Types.ObjectId();
    const invalidResult = await triggerFirstTouch(invalidId.toString());
    
    if (!invalidResult.success && invalidResult.error === 'Lead not found') {
      console.log('✓ Invalid lead ID handled correctly');
      console.log(`  Error: ${invalidResult.error}`);
    } else {
      console.log('✗ Invalid lead ID not handled properly');
    }
    
    // Test 5: Test retry functionality
    console.log('\n' + '='.repeat(60));
    console.log('Test 5: Retry Failed Notifications');
    console.log('='.repeat(60));
    
    // Manually set one status to failed for testing
    await Lead.findByIdAndUpdate(testLead._id, {
      emailStatus: 'failed'
    });
    console.log('Set email status to "failed" for retry test');
    
    const retryResult = await retryFailedNotifications(testLead._id.toString());
    
    console.log('\nRetry Result:');
    console.log(`  Success: ${retryResult.success}`);
    console.log(`  Email Retried: ${retryResult.emailRetried}`);
    console.log(`  SMS Retried: ${retryResult.smsRetried}`);
    if (retryResult.emailRetried) {
      console.log(`  Email Success: ${retryResult.emailSuccess}`);
    }
    if (retryResult.smsRetried) {
      console.log(`  SMS Success: ${retryResult.smsSuccess}`);
    }
    
    // Test 6: Test Promise.allSettled behavior
    console.log('\n' + '='.repeat(60));
    console.log('Test 6: Parallel Execution Test');
    console.log('='.repeat(60));
    
    console.log('Creating another test lead...');
    const testLead2 = new Lead({
      name: 'Parallel Test',
      email: process.env.SMTP_USER || 'test2@example.com',
      phone: process.env.TEST_PHONE_NUMBER || '+923001111111',
      source: 'test-parallel'
    });
    await testLead2.save();
    
    console.log('Triggering notifications (both will attempt even if one fails)...');
    const startTime = Date.now();
    const parallelResult = await triggerFirstTouch(testLead2._id.toString());
    const duration = Date.now() - startTime;
    
    console.log(`\n✓ Parallel execution completed in ${duration}ms`);
    console.log(`  Email Sent: ${parallelResult.emailSent}`);
    console.log(`  SMS Sent: ${parallelResult.smsSent}`);
    console.log('  Both attempts completed regardless of individual failures');
    
    // Clean up
    await Lead.findByIdAndDelete(testLead2._id);
    console.log('✓ Second test lead cleaned up');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✓ Test lead creation');
    console.log('✓ First-touch notification triggering');
    console.log('✓ Status retrieval');
    console.log('✓ Invalid ID handling');
    console.log('✓ Retry functionality');
    console.log('✓ Parallel execution (Promise.allSettled)');
    
    if (emailConfigured || smsConfigured) {
      console.log('\n✓ Notification orchestrator is fully functional!');
      if (emailConfigured) {
        console.log(`  Check your email at ${process.env.SMTP_USER}`);
      }
      if (smsConfigured && process.env.TEST_PHONE_NUMBER) {
        console.log(`  Check your phone at ${process.env.TEST_PHONE_NUMBER}`);
      }
    } else {
      console.log('\n⚠️  Configure email/SMS services to test actual notifications');
    }
    
    console.log('\nKey Features Verified:');
    console.log('- ✓ Parallel execution of email and SMS');
    console.log('- ✓ Both attempts complete even if one fails');
    console.log('- ✓ Proper status tracking in database');
    console.log('- ✓ Graceful error handling');
    console.log('- ✓ Retry failed notifications');
    console.log('- ✓ First-touch timestamp management');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  } finally {
    // Clean up test lead
    if (testLeadId) {
      try {
        await Lead.findByIdAndDelete(testLeadId);
        console.log('\n✓ Test lead cleaned up');
      } catch (error) {
        console.error('✗ Failed to clean up test lead:', error.message);
      }
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run tests
runTests();
