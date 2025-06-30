// Test script to check backend connection
// Run this with: node test-backend-connection.js

const https = require('https');

// Railway URL patterns for your specific project
const POSSIBLE_URLS = [
    'https://swift-hire-production.up.railway.app',
    'https://web-production-158707cb.up.railway.app',
    'https://backend-production-158707cb.up.railway.app',
    'https://swift-hire-158707cb.up.railway.app',
    'https://main-production-158707cb.up.railway.app',
    // Add your actual URL here when you find it
];

function testConnection(url) {
    console.log(`🔍 Testing connection to: ${url}`);
    
    const testUrl = `${url}/docs`;
    
    https.get(testUrl, (res) => {
        console.log(`✅ Status Code: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);
        
        if (res.statusCode === 200) {
            console.log('🎉 Backend is accessible!');
            console.log(`📖 API Documentation available at: ${testUrl}`);
        } else {
            console.log('⚠️  Backend responded but with non-200 status');
        }
    }).on('error', (err) => {
        console.log('❌ Connection failed:', err.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check if your Railway backend is deployed and running');
        console.log('2. Verify the URL is correct (check Railway dashboard)');
        console.log('3. Make sure the backend service is not sleeping');
    });
}

// Test all possible URLs
console.log('🔍 Testing multiple Railway URL patterns...\n');
POSSIBLE_URLS.forEach((url, index) => {
    setTimeout(() => {
        console.log(`\n--- Testing URL ${index + 1}/${POSSIBLE_URLS.length} ---`);
        testConnection(url);
    }, index * 3000);
});

console.log('\n📋 Instructions to find your Railway URL:');
console.log('1. Go to railway.app and login');
console.log('2. Click on your swift-hire project');
console.log('3. Click on your backend service');
console.log('4. Look for "Domains" or "Settings" tab');
console.log('5. Copy the public URL and update the configuration');
console.log('\n⏳ Testing will continue with common patterns...');
