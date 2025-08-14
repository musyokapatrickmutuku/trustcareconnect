#!/usr/bin/env node

/**
 * Simple test script for TrustCareConnect AI Proxy Server
 * Run with: node test-server.js
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:3001';

// Test data
const testQueries = [
  {
    queryText: "How often should I check my blood sugar levels?",
    condition: "diabetes",
    provider: "mock"
  },
  {
    queryText: "What foods should I avoid with high blood pressure?",
    condition: "hypertension", 
    provider: "mock"
  },
  {
    queryText: "I'm feeling dizzy, what could be the cause?",
    condition: "general",
    provider: "mock"
  }
];

async function testHealthCheck() {
  console.log('🔍 Testing health check endpoint...');
  try {
    const response = await axios.get(`${SERVER_URL}/api/health`);
    console.log('✅ Health check passed:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testProvidersEndpoint() {
  console.log('\n🔍 Testing providers endpoint...');
  try {
    const response = await axios.get(`${SERVER_URL}/api/providers`);
    console.log('✅ Providers endpoint working');
    console.log('Available providers:', response.data.providers.map(p => p.name).join(', '));
    return true;
  } catch (error) {
    console.log('❌ Providers endpoint failed:', error.message);
    return false;
  }
}

async function testAIQuery(query) {
  console.log(`\n🔍 Testing AI query: "${query.queryText.substring(0, 50)}..."`);
  try {
    const response = await axios.post(`${SERVER_URL}/api/query`, query, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ AI query successful');
      console.log('Provider used:', response.data.metadata.provider);
      console.log('Response preview:', response.data.response.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ AI query failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ AI query failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing error handling...');
  
  // Test invalid endpoint
  try {
    await axios.get(`${SERVER_URL}/api/invalid`);
    console.log('❌ Should have returned 404');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ 404 handling works correctly');
    }
  }
  
  // Test invalid request body
  try {
    await axios.post(`${SERVER_URL}/api/query`, { invalid: 'data' });
    console.log('❌ Should have returned 400');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Request validation works correctly');
      return true;
    }
  }
  
  return false;
}

async function runAllTests() {
  console.log('🚀 Starting TrustCareConnect AI Proxy Tests');
  console.log('================================================');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Health check test
  totalTests++;
  if (await testHealthCheck()) passedTests++;
  
  // Providers endpoint test
  totalTests++;
  if (await testProvidersEndpoint()) passedTests++;
  
  // AI query tests
  for (const query of testQueries) {
    totalTests++;
    if (await testAIQuery(query)) passedTests++;
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Error handling test
  totalTests++;
  if (await testErrorHandling()) passedTests++;
  
  // Results
  console.log('\n================================================');
  console.log('🏁 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The AI proxy server is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the server and try again.');
    process.exit(1);
  }
}

// Check if server is running first
async function checkServerRunning() {
  try {
    await axios.get(`${SERVER_URL}/api/health`, { timeout: 3000 });
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not responding');
    console.log('Please start the server first:');
    console.log('  cd ai-proxy');
    console.log('  npm install');
    console.log('  npm start');
    console.log('\nThen run this test again.');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerRunning();
  if (serverRunning) {
    await runAllTests();
  }
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});