import dotenv from 'dotenv';
import verifyWebhookSecret from './verifyWebhookSecret.js';

dotenv.config();

// Mock Express request, response, and next function
const createMockReq = (headers = {}) => ({
  headers
});

const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const createMockNext = () => {
  let called = false;
  const next = () => {
    called = true;
  };
  next.wasCalled = () => called;
  return next;
};

console.log('Testing Webhook Authentication Middleware...\n');

// Set a test webhook secret
process.env.WEBHOOK_SECRET = 'test-secret-123';

// Test 1: Valid webhook secret
console.log('Test 1: Valid webhook secret');
const req1 = createMockReq({ 'x-webhook-secret': 'test-secret-123' });
const res1 = createMockRes();
const next1 = createMockNext();

verifyWebhookSecret(req1, res1, next1);
if (next1.wasCalled()) {
  console.log('✓ Valid secret accepted - next() was called\n');
} else {
  console.log('✗ Test failed - next() was not called\n');
}

// Test 2: Missing webhook secret header
console.log('Test 2: Missing webhook secret header');
const req2 = createMockReq({});
const res2 = createMockRes();
const next2 = createMockNext();

verifyWebhookSecret(req2, res2, next2);
if (res2.statusCode === 401 && !next2.wasCalled()) {
  console.log('✓ Missing secret rejected with 401');
  console.log('  Response:', res2.jsonData.message);
  console.log();
} else {
  console.log('✗ Test failed - should return 401\n');
}

// Test 3: Invalid webhook secret
console.log('Test 3: Invalid webhook secret');
const req3 = createMockReq({ 'x-webhook-secret': 'wrong-secret' });
const res3 = createMockRes();
const next3 = createMockNext();

verifyWebhookSecret(req3, res3, next3);
if (res3.statusCode === 401 && !next3.wasCalled()) {
  console.log('✓ Invalid secret rejected with 401');
  console.log('  Response:', res3.jsonData.message);
  console.log();
} else {
  console.log('✗ Test failed - should return 401\n');
}

// Test 4: Empty webhook secret
console.log('Test 4: Empty webhook secret header');
const req4 = createMockReq({ 'x-webhook-secret': '' });
const res4 = createMockRes();
const next4 = createMockNext();

verifyWebhookSecret(req4, res4, next4);
if (res4.statusCode === 401 && !next4.wasCalled()) {
  console.log('✓ Empty secret rejected with 401');
  console.log('  Response:', res4.jsonData.message);
  console.log();
} else {
  console.log('✗ Test failed - should return 401\n');
}

// Test 5: Case sensitivity test
console.log('Test 5: Case sensitivity test');
const req5 = createMockReq({ 'x-webhook-secret': 'TEST-SECRET-123' });
const res5 = createMockRes();
const next5 = createMockNext();

verifyWebhookSecret(req5, res5, next5);
if (res5.statusCode === 401 && !next5.wasCalled()) {
  console.log('✓ Case-sensitive comparison works - uppercase secret rejected');
  console.log();
} else {
  console.log('✗ Test failed - secrets should be case-sensitive\n');
}

// Test 6: Missing environment variable
console.log('Test 6: Missing WEBHOOK_SECRET environment variable');
const originalSecret = process.env.WEBHOOK_SECRET;
delete process.env.WEBHOOK_SECRET;

const req6 = createMockReq({ 'x-webhook-secret': 'test-secret-123' });
const res6 = createMockRes();
const next6 = createMockNext();

verifyWebhookSecret(req6, res6, next6);
if (res6.statusCode === 500 && !next6.wasCalled()) {
  console.log('✓ Missing environment variable returns 500');
  console.log('  Response:', res6.jsonData.message);
  console.log();
} else {
  console.log('✗ Test failed - should return 500 for missing config\n');
}

// Restore environment variable
process.env.WEBHOOK_SECRET = originalSecret;

console.log('✓ All webhook middleware tests completed!');
