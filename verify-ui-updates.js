#!/usr/bin/env node

// UI Update Verification Script
// This script checks if the updated login components are being served

const http = require('http');

async function checkEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    req.end();
  });
}

async function verifyUpdates() {
  console.log('🔍 Verifying UI Updates...\n');
  
  try {
    // Check if main app is responsive
    console.log('1. Testing main application...');
    const mainApp = await checkEndpoint('/');
    console.log(`   Status: ${mainApp.status}`);
    console.log(`   Contains TrustCareConnect: ${mainApp.data.includes('TrustCareConnect')}`);
    
    // Check if updated content is present in the HTML
    const hasTestAccounts = mainApp.data.includes('Test Patient Accounts') || 
                           mainApp.data.includes('sarah.johnson@email.com') ||
                           mainApp.data.includes('SarahDiabetes2024');
    
    console.log(`   Contains Test Accounts: ${hasTestAccounts}`);
    
    if (hasTestAccounts) {
      console.log('   ✅ Updated home page content is being served!');
    } else {
      console.log('   ⚠️ Updated content not found in HTML - checking React bundle...');
    }
    
    console.log('\n2. Testing patient portal route...');
    const patientPortal = await checkEndpoint('/patient');
    console.log(`   Status: ${patientPortal.status}`);
    
    console.log('\n3. Testing doctor portal route...');
    const doctorPortal = await checkEndpoint('/doctor');
    console.log(`   Status: ${doctorPortal.status}`);
    
    // Check static assets for updated credentials
    console.log('\n4. Checking for updated credentials in served content...');
    const credentialsFound = [
      'SarahDiabetes2024',
      'MikeType1Diabetes',
      'CarlosDiabetes62',
      'DrMaria2024Endo',
      'DrJames2024Endo'
    ];
    
    let foundCount = 0;
    credentialsFound.forEach(cred => {
      if (mainApp.data.includes(cred)) {
        console.log(`   ✅ Found: ${cred}`);
        foundCount++;
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Main app responsive: ${mainApp.status === 200 ? '✅' : '❌'}`);
    console.log(`   - Patient portal responsive: ${patientPortal.status === 200 ? '✅' : '❌'}`);
    console.log(`   - Doctor portal responsive: ${doctorPortal.status === 200 ? '✅' : '❌'}`);
    console.log(`   - Updated credentials found: ${foundCount}/${credentialsFound.length}`);
    
    if (foundCount === 0) {
      console.log('\n🔄 CACHE ISSUE DETECTED:');
      console.log('   The updated code is not being served. This suggests:');
      console.log('   1. React hot reload hasn\'t picked up the changes');
      console.log('   2. Browser is caching old JavaScript bundles');
      console.log('   3. TypeScript compilation issues');
      console.log('\n💡 Recommended Actions:');
      console.log('   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   - Clear browser cache and storage');
      console.log('   - Check React dev server for compilation errors');
      console.log('   - Try incognito/private browsing mode');
    } else if (foundCount < credentialsFound.length) {
      console.log('\n⚠️ PARTIAL UPDATE:');
      console.log('   Some changes are visible, others may need browser refresh.');
    } else {
      console.log('\n🎉 SUCCESS:');
      console.log('   All updated credentials are being served!');
      console.log('   The enhanced UI should be visible in the browser.');
    }
    
    console.log('\n🌐 Access URLs:');
    console.log('   - Main App: http://localhost:3000');
    console.log('   - Patient Portal: http://localhost:3000/patient');
    console.log('   - Doctor Portal: http://localhost:3000/doctor');
    
  } catch (error) {
    console.error('❌ Error checking updates:', error.message);
  }
}

verifyUpdates();