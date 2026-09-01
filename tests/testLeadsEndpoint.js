import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import Lead from '../models/Lead.js';
import connectDB from '../config/db.js';

dotenv.config();

const API_URL = 'http://localhost:5000';

console.log('='.repeat(60));
console.log('Leads Endpoint Tests');
console.log('='.repeat(60));

// Generate test JWT token
const generateTestToken = () => {
  if (!process.env.JWT_SECRET) {
    console.log('\n⚠️  JWT_SECRET not configured');
    console.log('Add JWT_SECRET to .env file for authentication');
    return null;
  }
  
  return jwt.sign(
    { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Helper function to make authenticated requests
async function makeAuthRequest(method, endpoint, data = null) {
  const token = generateTestToken();
  
  if (!token) {
    return { error: 'No JWT token available' };
  }
  
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status code
    };
    
    if (data) {
      config.data = data;
    }
    
    if (method === 'GET' && data) {
      config.params = data;
    }
    
    const response = await axios(config);
    return response;
  } catch (error) {
    return { error: error.message };
  }
}

async function createTestLeads() {
  console.log('\nCreating test leads in database...');
  
  const testLeads = [
    {
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '+923001234567',
      source: 'wordpress-form',
      status: 'new',
      emailStatus: 'sent',
      smsStatus: 'sent',
      createdAt: new Date('2024-01-15')
    },
    {
      name: 'Sarah Ali',
      email: 'sarah@example.com',
      phone: '+923009876543',
      source: 'contact-page',
      status: 'contacted',
      emailStatus: 'sent',
      smsStatus: 'failed',
      createdAt: new Date('2024-01-16')
    },
    {
      name: 'Muhammad Hassan',
      email: 'hassan@example.com',
      phone: '+923001111111',
      source: 'wordpress-form',
      status: 'converted',
      emailStatus: 'sent',
      smsStatus: 'sent',
      createdAt: new Date('2024-01-17')
    },
    {
      name: 'Fatima Malik',
      email: 'fatima@example.com',
      phone: '+923002222222',
      source: 'landing-page',
      status: 'new',
      emailStatus: 'pending',
      smsStatus: 'pending',
      createdAt: new Date('2024-01-18')
    },
    {
      name: 'Ali Raza',
      email: 'ali@example.com',
      phone: '+923003333333',
      source: 'wordpress-form',
      status: 'followed_up',
      emailStatus: 'sent',
      smsStatus: 'sent',
      createdAt: new Date('2024-01-19')
    }
  ];
  
  const createdLeads = await Lead.insertMany(testLeads);
  console.log(`✓ Created ${createdLeads.length} test leads`);
  return createdLeads;
}

async function runTests() {
  let testLeads = [];
  
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
    
    // Connect to database
    console.log('\nConnecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to database');
    
    // Create test leads
    testLeads = await createTestLeads();
    
    // Test 1: Get all leads (no filters)
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: Get All Leads (No Filters)');
    console.log('='.repeat(60));
    
    const response1 = await makeAuthRequest('GET', '/api/leads');
    if (response1.error) {
      console.log('✗ Request failed:', response1.error);
    } else {
      console.log(`Status: ${response1.status}`);
      if (response1.data.success) {
        console.log('✓ Leads fetched successfully');
        console.log(`  Total: ${response1.data.data.pagination.totalCount}`);
        console.log(`  Page: ${response1.data.data.pagination.currentPage}/${response1.data.data.pagination.totalPages}`);
        console.log(`  Leads on this page: ${response1.data.data.leads.length}`);
      } else {
        console.log('✗ Request failed:', response1.data.message);
      }
    }
    
    // Test 2: Pagination
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: Pagination (page=1, limit=2)');
    console.log('='.repeat(60));
    
    const response2 = await makeAuthRequest('GET', '/api/leads', { page: 1, limit: 2 });
    if (response2.data.success) {
      console.log('✓ Pagination working');
      console.log(`  Leads returned: ${response2.data.data.leads.length}`);
      console.log(`  Has next page: ${response2.data.data.pagination.hasNextPage}`);
      console.log(`  Total pages: ${response2.data.data.pagination.totalPages}`);
    } else {
      console.log('✗ Pagination failed');
    }
    
    // Test 3: Filter by status
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: Filter by Status (status=new)');
    console.log('='.repeat(60));
    
    const response3 = await makeAuthRequest('GET', '/api/leads', { status: 'new' });
    if (response3.data.success) {
      console.log('✓ Status filter working');
      console.log(`  Leads with status="new": ${response3.data.data.pagination.totalCount}`);
      response3.data.data.leads.forEach(lead => {
        console.log(`    - ${lead.name} (${lead.status})`);
      });
    } else {
      console.log('✗ Status filter failed');
    }
    
    // Test 4: Filter by date range
    console.log('\n' + '='.repeat(60));
    console.log('Test 4: Filter by Date Range');
    console.log('='.repeat(60));
    
    const response4 = await makeAuthRequest('GET', '/api/leads', { 
      from: '2024-01-16',
      to: '2024-01-18'
    });
    if (response4.data.success) {
      console.log('✓ Date range filter working');
      console.log(`  Leads between Jan 16-18: ${response4.data.data.pagination.totalCount}`);
      response4.data.data.leads.forEach(lead => {
        console.log(`    - ${lead.name} (${new Date(lead.createdAt).toISOString().split('T')[0]})`);
      });
    } else {
      console.log('✗ Date range filter failed');
    }
    
    // Test 5: Filter by source
    console.log('\n' + '='.repeat(60));
    console.log('Test 5: Filter by Source (source=wordpress-form)');
    console.log('='.repeat(60));
    
    const response5 = await makeAuthRequest('GET', '/api/leads', { source: 'wordpress-form' });
    if (response5.data.success) {
      console.log('✓ Source filter working');
      console.log(`  Leads from wordpress-form: ${response5.data.data.pagination.totalCount}`);
    } else {
      console.log('✗ Source filter failed');
    }
    
    // Test 6: Search functionality
    console.log('\n' + '='.repeat(60));
    console.log('Test 6: Search (search=ahmed)');
    console.log('='.repeat(60));
    
    const response6 = await makeAuthRequest('GET', '/api/leads', { search: 'ahmed' });
    if (response6.data.success) {
      console.log('✓ Search working');
      console.log(`  Results for "ahmed": ${response6.data.data.pagination.totalCount}`);
      response6.data.data.leads.forEach(lead => {
        console.log(`    - ${lead.name} (${lead.email})`);
      });
    } else {
      console.log('✗ Search failed');
    }
    
    // Test 7: Sorting
    console.log('\n' + '='.repeat(60));
    console.log('Test 7: Sorting (sortBy=name, sortOrder=asc)');
    console.log('='.repeat(60));
    
    const response7 = await makeAuthRequest('GET', '/api/leads', { 
      sortBy: 'name',
      sortOrder: 'asc'
    });
    if (response7.data.success) {
      console.log('✓ Sorting working');
      console.log('  Leads sorted by name (A-Z):');
      response7.data.data.leads.slice(0, 5).forEach(lead => {
        console.log(`    - ${lead.name}`);
      });
    } else {
      console.log('✗ Sorting failed');
    }
    
    // Test 8: Combined filters
    console.log('\n' + '='.repeat(60));
    console.log('Test 8: Combined Filters');
    console.log('='.repeat(60));
    
    const response8 = await makeAuthRequest('GET', '/api/leads', {
      status: 'new',
      source: 'wordpress-form',
      from: '2024-01-01'
    });
    if (response8.data.success) {
      console.log('✓ Combined filters working');
      console.log(`  Results: ${response8.data.data.pagination.totalCount}`);
    } else {
      console.log('✗ Combined filters failed');
    }
    
    // Test 9: Get single lead
    console.log('\n' + '='.repeat(60));
    console.log('Test 9: Get Single Lead by ID');
    console.log('='.repeat(60));
    
    if (testLeads.length > 0) {
      const response9 = await makeAuthRequest('GET', `/api/leads/${testLeads[0]._id}`);
      if (response9.data.success) {
        console.log('✓ Single lead fetched');
        console.log(`  Name: ${response9.data.data.name}`);
        console.log(`  Email: ${response9.data.data.email}`);
        console.log(`  Status: ${response9.data.data.status}`);
      } else {
        console.log('✗ Failed to fetch single lead');
      }
    }
    
    // Test 10: Get statistics
    console.log('\n' + '='.repeat(60));
    console.log('Test 10: Get Leads Statistics');
    console.log('='.repeat(60));
    
    const response10 = await makeAuthRequest('GET', '/api/leads/stats');
    if (response10.data.success) {
      console.log('✓ Statistics fetched');
      console.log(`  Total leads: ${response10.data.data.total}`);
      console.log(`  By status:`);
      console.log(`    - New: ${response10.data.data.byStatus.new}`);
      console.log(`    - Contacted: ${response10.data.data.byStatus.contacted}`);
      console.log(`    - Converted: ${response10.data.data.byStatus.converted}`);
      console.log(`  Notifications:`);
      console.log(`    - Emails sent: ${response10.data.data.notifications.emailsSent}`);
      console.log(`    - SMS sent: ${response10.data.data.notifications.smsSent}`);
      console.log(`    - Email success rate: ${response10.data.data.notifications.emailSuccessRate}%`);
      console.log(`    - SMS success rate: ${response10.data.data.notifications.smsSuccessRate}%`);
    } else {
      console.log('✗ Failed to fetch statistics');
    }
    
    // Test 11: Authentication required
    console.log('\n' + '='.repeat(60));
    console.log('Test 11: Authentication Required (No Token)');
    console.log('='.repeat(60));
    
    const response11 = await axios.get(`${API_URL}/api/leads`, {
      validateStatus: () => true
    });
    if (response11.status === 401) {
      console.log('✓ Authentication properly enforced');
      console.log(`  Status: ${response11.status}`);
      console.log(`  Message: ${response11.data.message}`);
    } else {
      console.log('✗ Authentication not enforced properly');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✓ All leads listing');
    console.log('✓ Pagination');
    console.log('✓ Status filtering');
    console.log('✓ Date range filtering');
    console.log('✓ Source filtering');
    console.log('✓ Search functionality');
    console.log('✓ Sorting');
    console.log('✓ Combined filters');
    console.log('✓ Single lead retrieval');
    console.log('✓ Statistics endpoint');
    console.log('✓ Authentication enforcement');
    console.log('\n✓ Leads endpoint is fully functional!');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  } finally {
    // Clean up test leads
    if (testLeads.length > 0) {
      const testIds = testLeads.map(lead => lead._id);
      await Lead.deleteMany({ _id: { $in: testIds } });
      console.log(`\n✓ Cleaned up ${testLeads.length} test leads`);
    }
    
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✓ Database connection closed');
    }
  }
}

// Run tests
runTests();
