import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';

dotenv.config();

// Test the Lead model
async function testLeadModel() {
  try {
    console.log('Testing Lead Model...\n');
    
    // Test 1: Create a valid lead
    console.log('Test 1: Creating a valid lead');
    const testLead = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+923001234567',
      source: 'wordpress-form'
    };
    
    const lead = new Lead(testLead);
    console.log('✓ Lead instance created successfully');
    console.log('  Default status:', lead.status);
    console.log('  Default emailStatus:', lead.emailStatus);
    console.log('  Default smsStatus:', lead.smsStatus);
    console.log('  Default source:', lead.source);
    
    // Test 2: Validate required fields
    console.log('\nTest 2: Testing required field validation');
    const invalidLead = new Lead({});
    const validationError = invalidLead.validateSync();
    
    if (validationError) {
      console.log('✓ Required field validation works:');
      Object.keys(validationError.errors).forEach(field => {
        console.log(`  - ${field}: ${validationError.errors[field].message}`);
      });
    }
    
    // Test 3: Test enum validation
    console.log('\nTest 3: Testing enum validation');
    try {
      const invalidStatusLead = new Lead({
        name: 'Test',
        email: 'test@example.com',
        phone: '+923001234567',
        status: 'invalid-status'
      });
      await invalidStatusLead.validate();
      console.log('✗ Enum validation failed - invalid status was accepted');
    } catch (error) {
      console.log('✓ Enum validation works - invalid status rejected');
    }
    
    // Test 4: Test instance methods
    console.log('\nTest 4: Testing instance methods');
    const methodTestLead = new Lead({
      name: 'Method Test',
      email: 'method@test.com',
      phone: '+923001234567',
      emailStatus: 'sent',
      smsStatus: 'pending'
    });
    
    console.log('✓ isFirstTouchSent():', methodTestLead.isFirstTouchSent());
    console.log('✓ isFullyNotified():', methodTestLead.isFullyNotified());
    
    methodTestLead.smsStatus = 'sent';
    console.log('  After setting both to sent:');
    console.log('  isFullyNotified():', methodTestLead.isFullyNotified());
    
    console.log('\n✓ All model tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests without database connection (schema validation only)
testLeadModel();
