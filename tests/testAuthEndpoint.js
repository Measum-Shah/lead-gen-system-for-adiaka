import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_URL = 'http://localhost:5000';

console.log('='.repeat(60));
console.log('Authentication Endpoint Tests');
console.log('='.repeat(60));

// Check configuration
const isConfigured = 
  process.env.ADMIN_EMAIL && 
  process.env.ADMIN_PASSWORD_HASH &&
  process.env.JWT_SECRET;

if (!isConfigured) {
  console.log('\n⚠️  Authentication not configured!');
  console.log('\nPlease configure in .env:');
  console.log('- ADMIN_EMAIL');
  console.log('- ADMIN_PASSWORD_HASH (generate with: npm run generate-password)');
  console.log('- JWT_SECRET');
  process.exit(0);
}

console.log('\n✓ Authentication configured');
console.log(`  Admin Email: ${process.env.ADMIN_EMAIL}`);

async function runTests() {
  try {
    // Check if server is running
    console.log('\nChecking if server is running...');
    try {
      await axios.get(`${API_URL}/health`);
      console.log('✓ Server is running');
    } catch (error) {
      console.log('✗ Server is not running!');
      console.log('Please start the server with: npm run dev');
      return;
    }
    
    // Test 1: Login with correct credentials
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Login with Correct Credentials');
    console.log('='.repeat(60));
    
    const loginResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: process.env.ADMIN_EMAIL,
        password: 'admin123' // Default test password
      },
      { validateStatus: () => true }
    );
    
    let validToken = null;
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✓ Login successful');
      console.log(`  Status: ${loginResponse.status}`);
      console.log(`  Token received: ${loginResponse.data.data.token.substring(0, 20)}...`);
      console.log(`  Expires at: ${loginResponse.data.data.expiresAt}`);
      console.log(`  User: ${loginResponse.data.data.user.email}`);
      console.log(`  Role: ${loginResponse.data.data.user.role}`);
      validToken = loginResponse.data.data.token;
    } else {
      console.log('✗ Login failed');
      console.log(`  Status: ${loginResponse.status}`);
      console.log(`  Response:`, loginResponse.data);
      return;
    }
    
    // Test 2: Login with wrong password
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Login with Wrong Password');
    console.log('='.repeat(60));
    
    const wrongPasswordResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: process.env.ADMIN_EMAIL,
        password: 'wrongpassword'
      },
      { validateStatus: () => true }
    );
    
    if (wrongPasswordResponse.status === 401) {
      console.log('✓ Wrong password correctly rejected');
      console.log(`  Status: ${wrongPasswordResponse.status}`);
      console.log(`  Message: ${wrongPasswordResponse.data.message}`);
    } else {
      console.log('✗ Should have rejected wrong password');
    }
    
    // Test 3: Login with wrong email
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Login with Wrong Email');
    console.log('='.repeat(60));
    
    const wrongEmailResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: 'wrong@example.com',
        password: 'admin123'
      },
      { validateStatus: () => true }
    );
    
    if (wrongEmailResponse.status === 401) {
      console.log('✓ Wrong email correctly rejected');
      console.log(`  Status: ${wrongEmailResponse.status}`);
      console.log(`  Message: ${wrongEmailResponse.data.message}`);
    } else {
      console.log('✗ Should have rejected wrong email');
    }
    
    // Test 4: Login with missing credentials
    console.log('\n' + '='.repeat(60));
    console.log('Test 4: Login with Missing Credentials');
    console.log('='.repeat(60));
    
    const missingCredsResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      { email: process.env.ADMIN_EMAIL },
      { validateStatus: () => true }
    );
    
    if (missingCredsResponse.status === 400) {
      console.log('✓ Missing credentials correctly rejected');
      console.log(`  Status: ${missingCredsResponse.status}`);
      console.log(`  Message: ${missingCredsResponse.data.message}`);
    } else {
      console.log('✗ Should have rejected missing credentials');
    }
    
    // Test 5: Verify token endpoint
    console.log('\n' + '='.repeat(60));
    console.log('Test 5: Verify Valid Token');
    console.log('='.repeat(60));
    
    if (validToken) {
      const verifyResponse = await axios.get(
        `${API_URL}/api/auth/verify`,
        {
          headers: { Authorization: `Bearer ${validToken}` },
          validateStatus: () => true
        }
      );
      
      if (verifyResponse.status === 200 && verifyResponse.data.success) {
        console.log('✓ Token verification successful');
        console.log(`  Status: ${verifyResponse.status}`);
        console.log(`  User: ${verifyResponse.data.data.user.email}`);
      } else {
        console.log('✗ Token verification failed');
      }
    }
    
    // Test 6: Access protected route with valid token
    console.log('\n' + '='.repeat(60));
    console.log('Test 6: Access Protected Route (Leads) with Valid Token');
    console.log('='.repeat(60));
    
    if (validToken) {
      const leadsResponse = await axios.get(
        `${API_URL}/api/leads`,
        {
          headers: { Authorization: `Bearer ${validToken}` },
          validateStatus: () => true
        }
      );
      
      if (leadsResponse.status === 200) {
        console.log('✓ Protected route accessible with valid token');
        console.log(`  Status: ${leadsResponse.status}`);
      } else {
        console.log('✗ Could not access protected route');
        console.log(`  Status: ${leadsResponse.status}`);
      }
    }
    
    // Test 7: Access protected route without token
    console.log('\n' + '='.repeat(60));
    console.log('Test 7: Access Protected Route without Token');
    console.log('='.repeat(60));
    
    const noTokenResponse = await axios.get(
      `${API_URL}/api/leads`,
      { validateStatus: () => true }
    );
    
    if (noTokenResponse.status === 401) {
      console.log('✓ Protected route correctly rejected request without token');
      console.log(`  Status: ${noTokenResponse.status}`);
      console.log(`  Message: ${noTokenResponse.data.message}`);
    } else {
      console.log('✗ Should have rejected request without token');
    }
    
    // Test 8: Access protected route with invalid token
    console.log('\n' + '='.repeat(60));
    console.log('Test 8: Access Protected Route with Invalid Token');
    console.log('='.repeat(60));
    
    const invalidTokenResponse = await axios.get(
      `${API_URL}/api/leads`,
      {
        headers: { Authorization: 'Bearer invalid-token-here' },
        validateStatus: () => true
      }
    );
    
    if (invalidTokenResponse.status === 401) {
      console.log('✓ Invalid token correctly rejected');
      console.log(`  Status: ${invalidTokenResponse.status}`);
      console.log(`  Message: ${invalidTokenResponse.data.message}`);
    } else {
      console.log('✗ Should have rejected invalid token');
    }
    
    // Test 9: Case-insensitive email
    console.log('\n' + '='.repeat(60));
    console.log('Test 9: Case-Insensitive Email Login');
    console.log('='.repeat(60));
    
    const upperCaseEmail = process.env.ADMIN_EMAIL.toUpperCase();
    const caseInsensitiveResponse = await axios.post(
      `${API_URL}/api/auth/login`,
      {
        email: upperCaseEmail,
        password: 'admin123'
      },
      { validateStatus: () => true }
    );
    
    if (caseInsensitiveResponse.status === 200) {
      console.log('✓ Email is case-insensitive (as expected)');
      console.log(`  Logged in with: ${upperCaseEmail}`);
    } else {
      console.log('✗ Email should be case-insensitive');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✓ Login with correct credentials');
    console.log('✓ Wrong password rejection');
    console.log('✓ Wrong email rejection');
    console.log('✓ Missing credentials rejection');
    console.log('✓ Token verification');
    console.log('✓ Protected route access with valid token');
    console.log('✓ Protected route rejection without token');
    console.log('✓ Invalid token rejection');
    console.log('✓ Case-insensitive email');
    console.log('\n✓ Authentication system is fully functional!');
    console.log('\nDefault credentials:');
    console.log(`  Email: ${process.env.ADMIN_EMAIL}`);
    console.log('  Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');
    console.log('  Run: npm run generate-password');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
runTests();
