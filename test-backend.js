#!/usr/bin/env node
/**
 * Backend API Test Script
 * Tests all API endpoints to ensure they're working on Vercel
 */

const https = require('https');

const BASE_URL = 'harmonyweb-2-lpjgpa96w-hrhprojects-projects.vercel.app';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let passed = 0;
let failed = 0;

function makeRequest(path, method = 'OPTIONS', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.harmonyresourcehub.ca'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path) {
  try {
    console.log(`\nTesting ${name}...`);
    const response = await makeRequest(path);
    
    if (response.statusCode === 204 || response.statusCode === 200) {
      console.log(`${GREEN}✓${NC} ${name}: Status ${response.statusCode}`);
      
      // Check CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods'
      ];
      
      let hasCors = false;
      corsHeaders.forEach(header => {
        if (response.headers[header]) {
          hasCors = true;
          console.log(`  ${GREEN}✓${NC} CORS header: ${header}`);
        }
      });
      
      if (!hasCors) {
        console.log(`  ${YELLOW}⚠${NC} Warning: No CORS headers found`);
      }
      
      passed++;
      return true;
    } else {
      console.log(`${RED}✗${NC} ${name}: Status ${response.statusCode}`);
      console.log(`  Response: ${response.body.substring(0, 200)}`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗${NC} ${name}: ${error.message}`);
    failed++;
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Backend APIs on Vercel\n');
  console.log(`Base URL: https://${BASE_URL}\n`);
  console.log('='.repeat(60));

  const endpoints = [
    { name: 'Appointments API', path: '/api/appointments' },
    { name: 'Contact API', path: '/api/contact' },
    { name: 'Register API', path: '/api/auth/register' },
    { name: 'Login API', path: '/api/auth/login' },
    { name: 'Verify API', path: '/api/auth/verify' },
    { name: 'Approve API', path: '/api/auth/approve' }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.path);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n${GREEN}Passed: ${passed}${NC} | ${RED}Failed: ${failed}${NC}`);
  
  if (failed === 0) {
    console.log(`\n${GREEN}✅ All backend APIs are working!${NC}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}❌ Some tests failed${NC}\n`);
    process.exit(1);
  }
}

runTests();
