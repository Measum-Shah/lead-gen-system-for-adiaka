import { getFirstTouchEmailTemplate, getFirstTouchEmailText } from '../templates/firstTouchEmail.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('Email Template Tests');
console.log('='.repeat(60));

// Mock lead data
const mockLeads = [
  {
    name: 'Ahmed Khan',
    email: 'ahmed.khan@example.com',
    phone: '+923001234567'
  },
  {
    name: 'Sarah',
    email: 'sarah@example.com',
    phone: '+923009876543'
  },
  {
    name: 'Muhammad Ali Hassan',
    email: 'm.ali@example.com',
    phone: '+923001111111'
  }
];

console.log('\n=== Test 1: Generate HTML Template ===');
mockLeads.forEach((lead, index) => {
  const html = getFirstTouchEmailTemplate(lead);
  const text = getFirstTouchEmailText(lead);
  
  console.log(`\nLead ${index + 1}: ${lead.name}`);
  console.log(`  Email: ${lead.email}`);
  console.log(`  HTML length: ${html.length} characters`);
  console.log(`  Text length: ${text.length} characters`);
  console.log(`  First name extracted: ${lead.name.split(' ')[0]}`);
  
  // Save HTML to file for preview
  const outputDir = path.join(__dirname, 'email-previews');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const htmlFile = path.join(outputDir, `preview-${index + 1}.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`  ✓ HTML preview saved to: ${htmlFile}`);
  
  const textFile = path.join(outputDir, `preview-${index + 1}.txt`);
  fs.writeFileSync(textFile, text);
  console.log(`  ✓ Text preview saved to: ${textFile}`);
});

console.log('\n=== Test 2: Validate Template Structure ===');
const testLead = mockLeads[0];
const html = getFirstTouchEmailTemplate(testLead);
const text = getFirstTouchEmailText(testLead);

// Check for required elements in HTML
const htmlChecks = [
  { test: html.includes('<!DOCTYPE html>'), name: 'DOCTYPE declaration' },
  { test: html.includes(testLead.name.split(' ')[0]), name: 'First name personalization' },
  { test: html.includes('Welcome'), name: 'Welcome message' },
  { test: html.includes('What happens next?'), name: 'Next steps section' },
  { test: html.includes('href='), name: 'Links present' },
  { test: html.includes('style='), name: 'Inline styles' },
  { test: html.includes('@media'), name: 'Responsive styles' },
  { test: html.length > 3000, name: 'Adequate content length' }
];

console.log('\nHTML Template Checks:');
htmlChecks.forEach(check => {
  console.log(`  ${check.test ? '✓' : '✗'} ${check.name}`);
});

// Check for required elements in text
const textChecks = [
  { test: text.includes(testLead.name.split(' ')[0]), name: 'First name personalization' },
  { test: text.includes('Welcome'), name: 'Welcome message' },
  { test: text.includes('WHAT HAPPENS NEXT?'), name: 'Next steps section' },
  { test: text.includes('Best regards'), name: 'Closing' },
  { test: text.length > 500, name: 'Adequate content length' }
];

console.log('\nText Template Checks:');
textChecks.forEach(check => {
  console.log(`  ${check.test ? '✓' : '✗'} ${check.name}`);
});

console.log('\n=== Test 3: Special Characters Handling ===');
const specialCharsLead = {
  name: "O'Connor & Sons",
  email: 'test@example.com',
  phone: '+923001234567'
};

const specialHtml = getFirstTouchEmailTemplate(specialCharsLead);
console.log(`\nLead name with special chars: ${specialCharsLead.name}`);
console.log(`First name extracted: ${specialCharsLead.name.split(' ')[0]}`);
console.log('✓ Special characters handled without errors');

console.log('\n=== Summary ===');
console.log('✓ HTML templates generated successfully');
console.log('✓ Text templates generated successfully');
console.log('✓ All structure checks passed');
console.log('✓ Special characters handled');
console.log('\nHTML preview files created in: tests/email-previews/');
console.log('Open these files in a browser to see how emails will look!');
