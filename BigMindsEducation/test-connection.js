// Test script to check if backend server is reachable
// Run this from the BigMindsEducation directory: node test-connection.js

const axios = require('axios');

const IP_ADDRESS = '172.31.96.1'; // Change this to your actual IP
const PORT = 5000;
const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;

console.log('🔍 Testing Backend Server Connection...\n');
console.log(`📍 Target URL: ${BASE_URL}\n`);

async function testConnection() {
  try {
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.data.success) {
      console.log('   ✅ Health check passed!');
      console.log('   📊 Response:', JSON.stringify(healthResponse.data, null, 2));
    } else {
      console.log('   ⚠️  Health check returned but success is false');
    }
    
    console.log('\n2️⃣  Testing login endpoint (should fail with validation, not network)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@test.com',
        password: 'test'
      }, {
        timeout: 5000
      });
    } catch (error) {
      if (error.response) {
        // Server responded (even with error) = connection works!
        console.log('   ✅ Login endpoint is reachable!');
        console.log('   📊 Status:', error.response.status);
        console.log('   📊 Message:', error.response.data?.message || 'N/A');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ Connection refused - Server is not running or IP is wrong');
        console.log('   💡 Make sure:');
        console.log('      - Backend server is running (npm start in bigminds-backend)');
        console.log('      - IP address is correct');
        console.log('      - Both devices are on same network');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        console.log('   ❌ Request timeout - Server might be unreachable');
        console.log('   💡 Check:');
        console.log('      - Firewall settings');
        console.log('      - Network connectivity');
        console.log('      - IP address is correct');
      } else {
        console.log('   ❌ Network error:', error.message);
      }
    }
    
    console.log('\n✅ Connection test completed!');
    console.log('\n📝 Summary:');
    console.log(`   Base URL: ${BASE_URL}`);
    console.log('   Status: Server is reachable ✅');
    console.log('\n💡 If tests passed, your app should be able to connect!');
    
  } catch (error) {
    console.log('\n❌ Connection test failed!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔴 Problem: Connection Refused');
      console.log('   This means the server is not running or not accessible at this IP/port');
      console.log('\n💡 Solutions:');
      console.log('   1. Start the backend server:');
      console.log('      cd bigminds-backend');
      console.log('      npm start');
      console.log('   2. Check if IP address is correct');
      console.log('   3. Ensure both devices are on same network');
      console.log('   4. Check firewall settings');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('🔴 Problem: Request Timeout');
      console.log('   Server did not respond within 5 seconds');
      console.log('\n💡 Solutions:');
      console.log('   1. Check if server is running');
      console.log('   2. Check firewall/network settings');
      console.log('   3. Try pinging the IP address');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.log('🔴 Problem: DNS Lookup Failed');
      console.log('   Cannot resolve the IP address');
      console.log('\n💡 Solutions:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify IP address is correct');
    } else {
      console.log('🔴 Problem: Unknown Error');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }
    
    console.log('\n📋 Quick Checklist:');
    console.log('   [ ] Backend server is running (npm start)');
    console.log('   [ ] IP address is correct (current: ' + IP_ADDRESS + ')');
    console.log('   [ ] Port is correct (current: ' + PORT + ')');
    console.log('   [ ] Both devices on same Wi-Fi network');
    console.log('   [ ] Firewall allows connections on port ' + PORT);
    console.log('   [ ] MongoDB is running (if required)');
    
    process.exit(1);
  }
}

testConnection();

