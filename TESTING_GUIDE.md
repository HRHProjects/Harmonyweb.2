# How to Run Tests - Harmony Resource Hub

## Quick Test Commands

### Run All Tests
```bash
# Comprehensive tests (148 tests)
node test-suite.js

# Integration tests (20 tests)
node test-integration.js

# Setup verification
bash verify-setup.sh
```

### View Test Report
```bash
cat TEST_REPORT.md
```

### Run Browser Tests
```bash
# Start a local server
python3 -m http.server 8080

# Then open in browser:
# http://localhost:8080/test-runtime.html
```

## Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `test-suite.js` | Comprehensive validation | 148 tests |
| `test-integration.js` | Integration testing | 20 tests |
| `test-runtime.html` | Browser runtime tests | 15+ tests |
| `verify-setup.sh` | Environment setup check | Setup validation |
| `TEST_REPORT.md` | Detailed test report | Full documentation |

## What's Tested

### ✅ File Structure
- All HTML pages
- JavaScript files
- API endpoints
- Configuration files

### ✅ Code Quality
- JavaScript syntax
- HTML structure
- CSS loading
- Module exports

### ✅ Configuration
- API endpoints configured
- Email settings
- CORS settings
- Environment variables

### ✅ Security
- No hardcoded secrets
- XSS protection
- Input validation
- Rate limiting

### ✅ Accessibility
- ARIA attributes
- Alt text
- Skip links
- Form labels

### ✅ Responsive Design
- Tailwind CSS
- Breakpoints
- Mobile-first

### ✅ Forms
- Field validation
- Error handling
- Submit logic
- Fallback mechanisms

## Test Results Summary

**Status:** ✅ ALL TESTS PASSED

- Comprehensive Tests: **148/148** (100%)
- Integration Tests: **20/20** (100%)
- Syntax Errors: **0**
- Security Issues: **0**

## Continuous Testing

### Before Deployment
```bash
# Run all tests
node test-suite.js && node test-integration.js
```

### After Code Changes
```bash
# Quick validation
node test-suite.js
```

### Environment Setup
```bash
# Check required environment variables
bash verify-setup.sh
```

## Troubleshooting

### If Tests Fail

1. **Check Node.js version**
   ```bash
   node --version  # Should be v14 or higher
   ```

2. **Verify file structure**
   ```bash
   ls -la api/  # Check API files exist
   ```

3. **Check syntax**
   ```bash
   node --check api/appointments.js
   node --check app.js
   ```

4. **Review error output**
   - Tests provide detailed error messages
   - Check line numbers for specific issues

## Next Steps

After all tests pass:

1. ✅ Tests passed - ready for deployment
2. Set environment variables in Vercel
3. Deploy to production
4. Test in production environment
5. Monitor for errors

---

**Need Help?** Check [TEST_REPORT.md](TEST_REPORT.md) for detailed documentation.
