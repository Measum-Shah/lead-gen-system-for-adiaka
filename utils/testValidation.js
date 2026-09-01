import dotenv from 'dotenv';
import {
  validateEmail,
  validateName,
  validateAndNormalizePhone,
  validateLeadStatus,
  validateLeadSubmission
} from './validation.js';

dotenv.config();

console.log('Testing Validation Utilities...\n');

// Test email validation
console.log('=== Email Validation Tests ===');
console.log('Valid email:', validateEmail('john@example.com'));
console.log('Invalid email:', validateEmail('invalid-email'));
console.log('Empty email:', validateEmail(''));
console.log('Email with spaces:', validateEmail('  TEST@EXAMPLE.COM  '));

// Test name validation
console.log('\n=== Name Validation Tests ===');
console.log('Valid name:', validateName('John Doe'));
console.log('Short name:', validateName('J'));
console.log('Empty name:', validateName(''));
console.log('Name with spaces:', validateName('  John Doe  '));

// Test phone validation (Pakistan numbers)
console.log('\n=== Phone Validation Tests (PK) ===');
console.log('Valid PK mobile:', validateAndNormalizePhone('03001234567', 'PK'));
console.log('Valid PK with +92:', validateAndNormalizePhone('+923001234567', 'PK'));
console.log('Valid PK with 92:', validateAndNormalizePhone('923001234567', 'PK'));
console.log('Invalid phone:', validateAndNormalizePhone('12345', 'PK'));

// Test phone validation (US numbers)
console.log('\n=== Phone Validation Tests (US) ===');
console.log('Valid US mobile:', validateAndNormalizePhone('4155551234', 'US'));
console.log('Valid US with +1:', validateAndNormalizePhone('+14155551234', 'US'));

// Test status validation
console.log('\n=== Status Validation Tests ===');
console.log('Valid status (new):', validateLeadStatus('new'));
console.log('Valid status (converted):', validateLeadStatus('converted'));
console.log('Invalid status:', validateLeadStatus('invalid'));

// Test full lead submission validation
console.log('\n=== Lead Submission Validation Tests ===');

const validSubmission = {
  name: 'Ahmed Khan',
  email: 'ahmed@example.com',
  phone: '03001234567'
};
console.log('\nValid submission:', validateLeadSubmission(validSubmission));

const invalidSubmission = {
  name: 'A',
  email: 'invalid-email',
  phone: '123'
};
console.log('\nInvalid submission:', validateLeadSubmission(invalidSubmission));

const partialSubmission = {
  name: 'Valid Name',
  email: 'valid@email.com'
  // missing phone
};
console.log('\nPartial submission:', validateLeadSubmission(partialSubmission));

console.log('\n✓ All validation tests completed!');
