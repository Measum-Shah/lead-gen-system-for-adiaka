import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret-123';

// Helper function to make webhook requests
async function testWebhook(description, data, secret = WEBHOOK_SECRET, expectSuccess = true) {
  console.log(`\nTest: ${description}`);
  try {
    const response = await axios.post(
      `${API_URL}/api/webhook/lead`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret
        },
        validateStatus: () => true // Don't throw on any status code
      }
    );
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    
    if (expectSuccess && response.data.success) {
      console.log('  ✓ Test passed');
    } else if (!expectSuccess && !response.data.success) {
      console.log('  ✓ Test passed (expected failure)');
    } else {
      console.log('  ✗ Test failed');
    }
    
    return response;
  } catch (error) {
    console.log(`  ✗ Request failed: ${error.message}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('Webhook Endpoint Tests');
  console.log('='.repeat(60));
  console.log('\nMake sure the server is running on port 5000!');
  console.log('Run: npm run dev\n');
  
  // Test 1: Valid lead submission
  await testWebhook(
    'Valid lead submission',
    {
      name: 'Ahmed Khan',
      email: 'ahmed.khan@example.com',
      phone: '03001234567'
    },
    WEBHOOK_SECRET,
    true
  );
  
  // Test 2: Missing webhook secret
  await testWebhook(
    'Missing webhook secret',
    {
      name: 'Test User',
      email: 'test@example.com',
      phone: '03001234567'
    },
    '', // Empty secret
    false
  );
  
  // Test 3: Invalid webhook secret
  await testWebhook(
    'Invalid webhook secret',
    {
      name: 'Test User',
      email: 'test2@example.com',
      phone: '03001234567'
    },
    'wrong-secret',
    false
  );
  
  // Test 4: Missing required field (email)
  await testWebhook(
    'Missing required field (email)',
    {
      name: 'Test User',
      phone: '03001234567'
    },
    WEBHOOK_SECRET,
    false
  );
  
  // Test 5: Invalid email format
  await testWebhook(
    'Invalid email format',
    {
      name: 'Test User',
      email: 'not-an-email',
      phone: '03001234567'
    },
    WEBHOOK_SECRET,
    false
  );
  
  // Test 6: Invalid phone number
  await testWebhook(
    'Invalid phone number',
    {
      name: 'Test User',
      email: 'valid@example.com',
      phone: '123'
    },
    WEBHOOK_SECRET,
    false
  );
  
  // Test 7: Valid submission with source
  await testWebhook(
    'Valid submission with custom source',
    {
      name: 'Sarah Ali',
      email: 'sarah.ali@example.com',
      phone: '03009876543',
      source: 'contact-page-form'
    },
    WEBHOOK_SECRET,
    true
  );
  
  // Test 8: Duplicate email (should update existing)
  await testWebhook(
    'Duplicate email submission',
    {
      name: 'Ahmed Khan Updated',
      email: 'ahmed.khan@example.com', // Same as Test 1
      phone: '03001111111'
    },
    WEBHOOK_SECRET,
    true
  );
  
  // Test 9: Phone with international format
  await testWebhook(
    'Phone with +92 prefix',
    {
      name: 'International Format',
      email: 'international@example.com',
      phone: '+923001234567'
    },
    WEBHOOK_SECRET,
    true
  );
  
  // Test 10: Very long name
  await testWebhook(
    'Name validation - too long',
    {
      name: 'A'.repeat(150), // 150 characters
      email: 'longname@example.com',
      phone: '03001234567'
    },
    WEBHOOK_SECRET,
    false
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('All webhook endpoint tests completed!');
  console.log('='.repeat(60));
}

// Check if server is running before running tests
async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.status === 'ok') {
      console.log('✓ Server is running\n');
      return true;
    }
  } catch (error) {
    console.log('✗ Server is not running!');
    console.log('Please start the server with: npm run dev');
    return false;
  }
}

// Run tests if server is available
checkServerHealth().then(isRunning => {
  if (isRunning) {
    runTests();
  }
});
