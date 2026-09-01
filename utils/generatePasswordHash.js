import bcrypt from 'bcryptjs';
import readline from 'readline';

/**
 * Utility script to generate bcrypt password hash for admin account
 * 
 * Usage: node utils/generatePasswordHash.js
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(60));
console.log('Admin Password Hash Generator');
console.log('='.repeat(60));
console.log('\nThis will generate a bcrypt hash for your admin password.');
console.log('Add the generated hash to your .env file as ADMIN_PASSWORD_HASH\n');

rl.question('Enter admin password: ', async (password) => {
  if (!password || password.length < 6) {
    console.log('\n✗ Password must be at least 6 characters long');
    rl.close();
    return;
  }
  
  try {
    console.log('\nGenerating hash...');
    const hash = await bcrypt.hash(password, 10);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Password hash generated successfully!');
    console.log('='.repeat(60));
    console.log('\nYour bcrypt hash:');
    console.log(hash);
    console.log('\nAdd this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('\nMake sure to also set:');
    console.log('ADMIN_EMAIL=your-email@example.com');
    console.log('JWT_SECRET=your-random-secret-key');
    console.log('JWT_EXPIRES_IN=7d');
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Error generating hash:', error.message);
  }
  
  rl.close();
});
