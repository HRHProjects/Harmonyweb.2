#!/usr/bin/env node
/**
 * Comprehensive test suite for Harmony Resource Hub
 * Validates configuration, HTML structure, JavaScript logic, and API endpoints
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const NC = '\x1b[0m'; // No Color

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function pass(msg) {
  console.log(`${GREEN}✓${NC} ${msg}`);
  testsPassed++;
}

function fail(msg, details = '') {
  console.log(`${RED}✗${NC} ${msg}`);
  if (details) console.log(`  ${RED}→${NC} ${details}`);
  testsFailed++;
  errors.push({ test: msg, details });
}

function warn(msg) {
  console.log(`${YELLOW}⚠${NC} ${msg}`);
}

function section(title) {
  console.log(`\n${BLUE}━━━ ${title} ━━━${NC}`);
}

function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch {
    return null;
  }
}

// Test 1: Check essential files exist
section('File Structure');
const essentialFiles = [
  'index.html',
  'booking.html',
  'contact.html',
  'services.html',
  'signin.html',
  'privacy.html',
  'terms.html',
  'config.js',
  'app.js',
  'styles.css',
  'vercel.json',
  'api/appointments.js',
  'api/contact.js',
  'api/auth/register.js',
  'api/auth/login.js',
  'api/auth/verify.js',
  'api/auth/approve.js',
  'portal/index.html'
];

essentialFiles.forEach(file => {
  if (fileExists(file)) {
    pass(`File exists: ${file}`);
  } else {
    fail(`File missing: ${file}`);
  }
});

// Test 2: Check config.js structure
section('Configuration (config.js)');
const configContent = readFile('config.js');
if (configContent) {
  const requiredConfigKeys = [
    'brandName',
    'email',
    'phoneDisplay',
    'API_BASE_URL',
    'BOOKING_ENDPOINT',
    'CONTACT_ENDPOINT',
    'AUTH_LOGIN_ENDPOINT',
    'AUTH_REGISTER_ENDPOINT',
    'AUTH_VERIFY_ENDPOINT',
    'AUTH_APPROVE_ENDPOINT'
  ];

  requiredConfigKeys.forEach(key => {
    if (configContent.includes(key)) {
      pass(`Config has ${key}`);
    } else {
      fail(`Config missing ${key}`);
    }
  });

  // Check API_BASE_URL format
  const apiUrlMatch = configContent.match(/API_BASE_URL:\s*"([^"]*)"/);
  if (apiUrlMatch) {
    const url = apiUrlMatch[1];
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      pass(`API_BASE_URL is properly formatted: ${url}`);
    } else if (url === '') {
      warn('API_BASE_URL is empty (using relative paths)');
    } else {
      fail('API_BASE_URL should start with https:// or http://', `Found: ${url}`);
    }
  }
} else {
  fail('Could not read config.js');
}

// Test 3: Check app.js for common issues
section('Main Application Script (app.js)');
const appContent = readFile('app.js');
if (appContent) {
  // Check for proper IIFE wrapping
  if (appContent.trim().startsWith('(function ()') || appContent.trim().startsWith('(function()')) {
    pass('app.js is wrapped in IIFE');
  } else {
    warn('app.js may not be wrapped in IIFE');
  }

  // Check for essential functions
  const essentialFunctions = [
    'setupBookingForm',
    'setupContactForm',
    'setupAuthTabs',
    'setupRegisterForm',
    'setupPortalApp'
  ];

  essentialFunctions.forEach(fn => {
    if (appContent.includes(`function ${fn}`) || appContent.includes(`${fn}()`)) {
      pass(`Function exists: ${fn}`);
    } else {
      fail(`Function missing: ${fn}`);
    }
  });

  // Check for console.log statements (should be minimal)
  const consoleLogCount = (appContent.match(/console\.log/g) || []).length;
  if (consoleLogCount === 0) {
    pass('No console.log statements (production ready)');
  } else if (consoleLogCount < 5) {
    warn(`Found ${consoleLogCount} console.log statements (consider removing for production)`);
  } else {
    fail(`Found ${consoleLogCount} console.log statements (too many for production)`);
  }

  // Check for proper error handling in fetch calls
  const fetchCalls = appContent.match(/fetch\([^)]+\)/g) || [];
  const tryCatchCount = (appContent.match(/try\s*{/g) || []).length;
  if (fetchCalls.length > 0 && tryCatchCount >= fetchCalls.length / 2) {
    pass('Fetch calls have error handling');
  } else if (fetchCalls.length > 0) {
    warn(`Found ${fetchCalls.length} fetch calls but only ${tryCatchCount} try-catch blocks`);
  }
} else {
  fail('Could not read app.js');
}

// Test 4: Check HTML files for common issues
section('HTML Files');
const htmlFiles = ['index.html', 'booking.html', 'contact.html', 'signin.html', 'portal/index.html'];

htmlFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    // Check for proper DOCTYPE
    if (content.trim().toLowerCase().startsWith('<!doctype html>')) {
      pass(`${file}: Has proper DOCTYPE`);
    } else {
      fail(`${file}: Missing or incorrect DOCTYPE`);
    }

    // Check for config.js inclusion
    if (content.includes('config.js')) {
      pass(`${file}: Includes config.js`);
    } else {
      warn(`${file}: Does not include config.js`);
    }

    // Check for app.js inclusion
    if (content.includes('app.js')) {
      pass(`${file}: Includes app.js`);
    } else {
      warn(`${file}: Does not include app.js`);
    }

    // Check for meta viewport
    if (content.includes('viewport')) {
      pass(`${file}: Has viewport meta tag`);
    } else {
      fail(`${file}: Missing viewport meta tag`);
    }

    // Check for title tag
    if (content.match(/<title>.*<\/title>/)) {
      pass(`${file}: Has title tag`);
    } else {
      fail(`${file}: Missing title tag`);
    }
  } else {
    fail(`Could not read ${file}`);
  }
});

// Test 5: Check API files syntax
section('API Endpoints');
const apiFiles = [
  'api/appointments.js',
  'api/contact.js',
  'api/auth/register.js',
  'api/auth/login.js',
  'api/auth/verify.js',
  'api/auth/approve.js'
];

apiFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    // Check for module.exports
    if (content.includes('module.exports')) {
      pass(`${file}: Has module.exports`);
    } else {
      fail(`${file}: Missing module.exports`);
    }

    // Check for CORS handling
    if (content.includes('setCors') || content.includes('Access-Control-Allow-Origin')) {
      pass(`${file}: Handles CORS`);
    } else {
      fail(`${file}: Missing CORS handling`);
    }

    // Check for rate limiting
    if (content.includes('rateLimitOrThrow') || content.includes('RATE_')) {
      pass(`${file}: Has rate limiting`);
    } else {
      warn(`${file}: No rate limiting found`);
    }

    // Check for input validation
    if (content.includes('isValidEmail') || content.includes('validation')) {
      pass(`${file}: Has input validation`);
    } else {
      warn(`${file}: Limited input validation`);
    }

    // Check for environment variable usage
    if (content.includes('process.env')) {
      pass(`${file}: Uses environment variables`);
    } else {
      warn(`${file}: No environment variables used`);
    }

    // Check for Resend API key check
    if (file.includes('appointments') || file.includes('contact') || file.includes('register')) {
      if (content.includes('RESEND_API_KEY')) {
        pass(`${file}: Checks for RESEND_API_KEY`);
      } else {
        fail(`${file}: Missing RESEND_API_KEY check`);
      }
    }
  } else {
    fail(`Could not read ${file}`);
  }
});

// Test 6: Check vercel.json configuration
section('Vercel Configuration');
const vercelConfig = readFile('vercel.json');
if (vercelConfig) {
  try {
    const config = JSON.parse(vercelConfig);
    
    if (config.rewrites && Array.isArray(config.rewrites)) {
      pass('vercel.json: Has rewrites configuration');
      
      // Check for API rewrites
      const hasApiRewrites = config.rewrites.some(r => 
        r.source && r.source.includes('/api/')
      );
      if (hasApiRewrites) {
        pass('vercel.json: Has API rewrites');
      } else {
        warn('vercel.json: No API rewrites found');
      }
    } else {
      warn('vercel.json: No rewrites configuration');
    }

    if (config.headers && Array.isArray(config.headers)) {
      pass('vercel.json: Has headers configuration');
    }

  } catch (e) {
    fail('vercel.json: Invalid JSON', e.message);
  }
} else {
  fail('Could not read vercel.json');
}

// Test 7: Check for security issues
section('Security Checks');
const allJsFiles = [...apiFiles, 'app.js', 'config.js'];

allJsFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    // Check for hardcoded secrets
    const suspiciousPatterns = [
      /password\s*=\s*['"][^'"]{8,}['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]{10,}['"]/i,
      /secret\s*=\s*['"][^'"]{10,}['"]/i,
      /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/i
    ];

    let foundSuspicious = false;
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content) && !content.includes('process.env')) {
        foundSuspicious = true;
      }
    });

    if (!foundSuspicious) {
      pass(`${file}: No hardcoded secrets found`);
    } else {
      fail(`${file}: Possible hardcoded secrets detected`);
    }

    // Check for SQL injection vulnerabilities (if using SQL)
    if (content.includes('SELECT') || content.includes('INSERT') || content.includes('UPDATE')) {
      warn(`${file}: Contains SQL keywords - ensure proper sanitization`);
    }
  }
});

// Test 8: Check for proper form validation
section('Form Validation');
const formsToCheck = {
  'booking.html': ['clientName', 'clientEmail', 'serviceSelect'],
  'contact.html': ['cName', 'cEmail', 'cMessage'],
  'signin.html': ['rEmail', 'rPassword']
};

Object.entries(formsToCheck).forEach(([file, fields]) => {
  const content = readFile(file);
  if (content) {
    fields.forEach(fieldId => {
      if (content.includes(`id="${fieldId}"`)) {
        pass(`${file}: Has form field ${fieldId}`);
        
        // Check if field has 'required' attribute
        const fieldRegex = new RegExp(`id="${fieldId}"[^>]*required`, 'i');
        if (fieldRegex.test(content)) {
          pass(`${file}: Field ${fieldId} has 'required' attribute`);
        } else {
          warn(`${file}: Field ${fieldId} missing 'required' attribute`);
        }
      } else {
        fail(`${file}: Missing form field ${fieldId}`);
      }
    });
  }
});

// Test 9: Check for accessibility features
section('Accessibility');
htmlFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    // Check for skip links
    if (content.includes('Skip to content') || content.includes('#main')) {
      pass(`${file}: Has skip navigation link`);
    } else {
      warn(`${file}: Missing skip navigation link`);
    }

    // Check for alt text on images
    const imgTags = content.match(/<img[^>]*>/g) || [];
    let missingAlt = 0;
    imgTags.forEach(img => {
      if (!img.includes('alt=')) {
        missingAlt++;
      }
    });

    if (imgTags.length === 0) {
      // No images, that's fine
    } else if (missingAlt === 0) {
      pass(`${file}: All images have alt text`);
    } else {
      fail(`${file}: ${missingAlt} images missing alt text`);
    }

    // Check for aria labels
    const ariaCount = (content.match(/aria-/g) || []).length;
    if (ariaCount > 0) {
      pass(`${file}: Uses ARIA attributes (${ariaCount} found)`);
    } else {
      warn(`${file}: No ARIA attributes found`);
    }

    // Check for lang attribute
    if (content.includes('lang="en"') || content.includes('lang="')) {
      pass(`${file}: Has lang attribute`);
    } else {
      fail(`${file}: Missing lang attribute`);
    }
  }
});

// Test 10: Check for responsive design
section('Responsive Design');
htmlFiles.forEach(file => {
  const content = readFile(file);
  if (content) {
    // Check for Tailwind CSS
    if (content.includes('tailwindcss')) {
      pass(`${file}: Uses Tailwind CSS`);
    }

    // Check for responsive classes
    const responsiveClasses = (content.match(/\b(sm|md|lg|xl|2xl):/g) || []).length;
    if (responsiveClasses > 5) {
      pass(`${file}: Uses responsive classes (${responsiveClasses} found)`);
    } else if (responsiveClasses > 0) {
      warn(`${file}: Limited responsive classes (${responsiveClasses} found)`);
    } else {
      fail(`${file}: No responsive classes found`);
    }
  }
});

// Final Summary
section('Test Summary');
console.log(`\nTotal tests: ${testsPassed + testsFailed}`);
console.log(`${GREEN}Passed: ${testsPassed}${NC}`);
console.log(`${RED}Failed: ${testsFailed}${NC}`);

if (testsFailed > 0) {
  console.log(`\n${RED}━━━ Failed Tests ━━━${NC}`);
  errors.slice(0, 10).forEach(err => {
    console.log(`${RED}✗${NC} ${err.test}`);
    if (err.details) console.log(`  ${RED}→${NC} ${err.details}`);
  });
  if (errors.length > 10) {
    console.log(`\n... and ${errors.length - 10} more errors`);
  }
  process.exit(1);
} else {
  console.log(`\n${GREEN}✅ All tests passed!${NC}`);
  process.exit(0);
}
