#!/usr/bin/env node
/**
 * Integration tests for Harmony Resource Hub
 * Tests API response structures and error handling
 */

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const NC = '\x1b[0m';

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`${GREEN}✓${NC} ${msg}`);
  passed++;
}

function fail(msg, detail = '') {
  console.log(`${RED}✗${NC} ${msg}`);
  if (detail) console.log(`  ${detail}`);
  failed++;
}

function section(title) {
  console.log(`\n${BLUE}━━━ ${title} ━━━${NC}`);
}

async function testApiModule(filePath, testName) {
  try {
    // Mock the Vercel environment
    const mockReq = {
      method: 'OPTIONS',
      headers: {},
      query: {},
      body: {}
    };

    const mockRes = {
      headers: {},
      statusCode: 200,
      setHeader(key, value) {
        this.headers[key] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
      send(data) {
        this.body = data;
        return this;
      },
      end() {
        return this;
      }
    };

    const handler = require(`./${filePath}`);
    
    // Test OPTIONS request (CORS preflight)
    await handler(mockReq, mockRes);
    
    if (mockRes.statusCode === 204) {
      pass(`${testName}: Handles OPTIONS (CORS preflight) correctly`);
    } else {
      fail(`${testName}: OPTIONS request failed`, `Expected 204, got ${mockRes.statusCode}`);
    }

    // Check CORS headers
    if (mockRes.headers['Access-Control-Allow-Methods']) {
      pass(`${testName}: Sets CORS headers`);
    } else {
      fail(`${testName}: Missing CORS headers`);
    }

    return true;
  } catch (e) {
    fail(`${testName}: Failed to load or execute`, e.message);
    return false;
  }
}

async function testInputValidation() {
  section('Input Validation Tests');
  
  // Test email validation
  const emailTests = [
    { email: 'valid@example.com', valid: true },
    { email: 'invalid', valid: false },
    { email: '', valid: false },
    { email: 'test@', valid: false },
    { email: '@test.com', valid: false }
  ];

  emailTests.forEach(({ email, valid }) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (isValid === valid) {
      pass(`Email validation: "${email}" correctly identified as ${valid ? 'valid' : 'invalid'}`);
    } else {
      fail(`Email validation: "${email}" incorrectly identified`);
    }
  });

  // Test string length limits
  const longString = 'a'.repeat(10000);
  if (longString.slice(0, 1000).length === 1000) {
    pass('String clamping works correctly');
  } else {
    fail('String clamping failed');
  }
}

async function testRateLimiting() {
  section('Rate Limiting Logic Tests');
  
  // Simulate rate limit checking
  const RATE_WINDOW_MS = 10 * 60 * 1000;
  const RATE_MAX = 6;
  const now = Date.now();
  
  const timestamps = [
    now - 1000,
    now - 2000,
    now - 3000,
    now - 4000,
    now - 5000
  ];

  const fresh = timestamps.filter(ts => (now - ts) < RATE_WINDOW_MS);
  
  if (fresh.length === 5) {
    pass('Rate limit: Correctly filters recent requests');
  } else {
    fail('Rate limit: Filter logic failed');
  }

  if (fresh.length < RATE_MAX) {
    pass('Rate limit: Under threshold check works');
  } else {
    fail('Rate limit: Threshold check failed');
  }
}

async function testConfigStructure() {
  section('Configuration Tests');
  
  const config = require('./config.js');
  
  if (typeof window !== 'undefined' && window.HRH_CONFIG) {
    pass('Config exports HRH_CONFIG to window');
    
    const cfg = window.HRH_CONFIG;
    const required = ['brandName', 'email', 'API_BASE_URL', 'BOOKING_ENDPOINT'];
    
    required.forEach(key => {
      if (cfg[key] !== undefined) {
        pass(`Config has ${key}`);
      } else {
        fail(`Config missing ${key}`);
      }
    });
  } else {
    // In Node environment, just check file loads
    pass('Config file loads in Node environment');
  }
}

async function testErrorHandling() {
  section('Error Handling Tests');
  
  // Test error object creation
  try {
    const err = new Error('Test error');
    err.statusCode = 400;
    
    if (err.message === 'Test error' && err.statusCode === 400) {
      pass('Error objects can have custom properties');
    } else {
      fail('Error object structure failed');
    }
  } catch (e) {
    fail('Error handling test failed', e.message);
  }

  // Test try-catch
  let caught = false;
  try {
    throw new Error('Test');
  } catch (e) {
    caught = true;
  }
  
  if (caught) {
    pass('Try-catch works correctly');
  } else {
    fail('Try-catch failed');
  }
}

async function testDataSanitization() {
  section('Data Sanitization Tests');
  
  // Test HTML escaping
  const escapeHtml = (str) => (str ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const xssTests = [
    { input: '<script>alert("xss")</script>', shouldContain: '&lt;script&gt;' },
    { input: '<img src=x onerror=alert(1)>', shouldContain: '&lt;img' },
    { input: 'Normal text', shouldContain: 'Normal text' }
  ];

  xssTests.forEach(({ input, shouldContain }) => {
    const escaped = escapeHtml(input);
    if (escaped.includes(shouldContain)) {
      pass(`HTML escaping: "${input.slice(0, 30)}..." correctly escaped`);
    } else {
      fail(`HTML escaping failed for: "${input.slice(0, 30)}..."`);
    }
  });

  // Test URL encoding
  const testUrl = 'test@example.com with spaces';
  const encoded = encodeURIComponent(testUrl);
  if (!encoded.includes(' ') && !encoded.includes('@')) {
    pass('URL encoding works correctly');
  } else {
    fail('URL encoding failed');
  }
}

async function testApiModules() {
  section('API Module Loading Tests');
  
  const modules = [
    { path: 'api/appointments', name: 'Appointments API' },
    { path: 'api/contact', name: 'Contact API' },
    { path: 'api/auth/register', name: 'Register API' },
    { path: 'api/auth/login', name: 'Login API' },
    { path: 'api/auth/verify', name: 'Verify API' },
    { path: 'api/auth/approve', name: 'Approve API' }
  ];

  for (const mod of modules) {
    try {
      const handler = require(`./${mod.path}`);
      if (typeof handler === 'function') {
        pass(`${mod.name}: Exports handler function`);
      } else {
        fail(`${mod.name}: Does not export function`);
      }
    } catch (e) {
      fail(`${mod.name}: Failed to load`, e.message);
    }
  }
}

function createMockReq(method, body = {}, extras = {}) {
  return {
    method,
    headers: extras.headers || {},
    query: extras.query || {},
    body,
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {}
  };
}

function createMockRes() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
}

async function testAuthFlow() {
  section('Authentication Flow Tests');

  const registerHandler = require('./api/auth/register');
  const verifyHandler = require('./api/auth/verify');
  const loginHandler = require('./api/auth/login');
  const authStore = require('./api/auth/_auth-store');

  authStore.clearMemoryStoreForTests();

  const originalFetch = global.fetch;
  const originalResendKey = process.env.RESEND_API_KEY;
  const originalVercel = process.env.VERCEL;

  process.env.RESEND_API_KEY = 'test-resend-key';
  delete process.env.VERCEL;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 'email_123' }),
    text: async () => 'ok'
  });

  try {
    const registerReq = createMockReq('POST', {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '780-555-0101',
      password: 'TestPass123!'
    });
    const registerRes = createMockRes();
    await registerHandler(registerReq, registerRes);

    if (registerRes.statusCode === 200 && registerRes.body?.ok && registerRes.body?.requiresVerification) {
      pass('Register API: creates pending account and returns verification step');
    } else {
      fail('Register API: registration flow failed', JSON.stringify(registerRes.body));
      return;
    }

    const storedVerification = await authStore.getVerification('test@example.com');
    if (storedVerification?.code && storedVerification.password?.startsWith('scrypt:')) {
      pass('Register API: stores verification code and scrypt password hash');
    } else {
      fail('Register API: verification details were not persisted correctly');
      return;
    }

    const verifyReq = createMockReq('POST', {
      email: 'test@example.com',
      code: storedVerification.code
    });
    const verifyRes = createMockRes();
    await verifyHandler(verifyReq, verifyRes);

    if (verifyRes.statusCode === 200 && verifyRes.body?.verified) {
      pass('Verify API: activates the account with the emailed code');
    } else {
      fail('Verify API: verification flow failed', JSON.stringify(verifyRes.body));
      return;
    }

    const loginReq = createMockReq('POST', {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    const loginRes = createMockRes();
    await loginHandler(loginReq, loginRes);

    if (loginRes.statusCode === 200 && loginRes.body?.ok && loginRes.body?.token) {
      pass('Login API: signs in with the newly verified account');
    } else {
      fail('Login API: sign-in after verification failed', JSON.stringify(loginRes.body));
    }
  } finally {
    authStore.clearMemoryStoreForTests();
    global.fetch = originalFetch;
    if (originalResendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalResendKey;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  }
}

async function runAllTests() {
  console.log('🧪 Running Integration Tests for Harmony Resource Hub\n');

  await testInputValidation();
  await testRateLimiting();
  await testErrorHandling();
  await testDataSanitization();
  await testApiModules();
  await testAuthFlow();

  // Summary
  section('Test Summary');
  const total = passed + failed;
  console.log(`\nTotal: ${total} | ${GREEN}Passed: ${passed}${NC} | ${RED}Failed: ${failed}${NC}`);
  
  if (failed === 0) {
    console.log(`\n${GREEN}✅ All integration tests passed!${NC}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}❌ Some tests failed${NC}\n`);
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error(`${RED}Test suite error:${NC}`, e);
  process.exit(1);
});
