import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Webhook Controller Logic...\n');

// Test validation logic
import { validateLeadSubmission } from '../utils/validation.js';

console.log('=== Test 1: Valid Lead Data ===');
const validData = {
  name: 'Ahmed Khan',
  email: 'ahmed@example.com',
  phone: '03001234567'
};
const result1 = validateLeadSubmission(validData);
console.log('Input:', validData);
console.log('Result:', result1);
console.log(result1.valid ? '✓ Valid' : '✗ Invalid');

console.log('\n=== Test 2: Missing Email ===');
const missingEmail = {
  name: 'Test User',
  phone: '03001234567'
};
const result2 = validateLeadSubmission(missingEmail);
console.log('Input:', missingEmail);
console.log('Result:', result2);
console.log(!result2.valid ? '✓ Correctly rejected' : '✗ Should have been rejected');

console.log('\n=== Test 3: Invalid Phone ===');
const invalidPhone = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '123'
};
const result3 = validateLeadSubmission(invalidPhone);
console.log('Input:', invalidPhone);
console.log('Result:', result3);
console.log(!result3.valid ? '✓ Correctly rejected' : '✗ Should have been rejected');

console.log('\n=== Test 4: Phone Normalization ===');
const phoneVariations = [
  '03001234567',
  '+923001234567',
  '923001234567'
];

phoneVariations.forEach(phone => {
  const data = {
    name: 'Test',
    email: 'test@example.com',
    phone
  };
  const result = validateLeadSubmission(data);
  console.log(`Input phone: "${phone}"`);
  console.log(`Normalized: "${result.data.phone}"`);
  console.log(result.valid && result.data.phone === '+923001234567' ? '✓ Normalized correctly' : '✗ Normalization failed');
  console.log();
});

console.log('=== Test 5: Multiple Validation Errors ===');
const multipleErrors = {
  name: 'A', // Too short
  email: 'invalid-email', // Invalid format
  phone: '123' // Invalid phone
};
const result5 = validateLeadSubmission(multipleErrors);
console.log('Input:', multipleErrors);
console.log('Errors:', result5.errors);
console.log(result5.errors.length === 3 ? '✓ All 3 errors caught' : '✗ Should have 3 errors');

console.log('\n=== Test 6: Custom Source Field ===');
const withSource = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '03001234567',
  source: 'landing-page-form'
};
const result6 = validateLeadSubmission(withSource);
console.log('Input:', withSource);
console.log('Result:', result6);
console.log(result6.valid && result6.data.source === 'landing-page-form' ? '✓ Source preserved' : '✗ Source not preserved');

console.log('\n✓ All controller logic tests completed!');
console.log('\nTo test the full endpoint with HTTP requests:');
console.log('1. Start the server: npm run dev');
console.log('2. Run: npm run test:webhook');
