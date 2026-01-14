# Deployment & Testing Guide for Auth Fixes

## What Was Fixed

This deployment includes fixes for sign-in and authentication issues:

### Core Fixes
1. ✅ Added `credentials: "include"` to all fetch requests for proper CORS handling
2. ✅ Improved error messages to show actual API errors instead of generic text
3. ✅ Fixed register form to show confirmation before redirecting
4. ✅ Added proper CORS headers to all authentication API endpoints
5. ✅ Enhanced cache control for authentication responses
6. ✅ Better error handling for JSON parsing failures

## Deployment Steps

### For Vercel Deployment

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Fix: Resolve sign-in and authentication CORS issues"
   git push origin main
   ```

2. **Vercel auto-deploys on push** (if connected)
   - Check https://vercel.com/dashboard for deployment status
   - Wait for ✓ Ready status

3. **Verify deployment**
   - Visit https://www.harmonyresourcehub.ca
   - Check browser console (F12) for any errors

### For Local Testing

1. **Ensure environment variables are set**
   ```bash
   # Create .env.local if it doesn't exist
   cp .env.local.example .env.local  # if available
   
   # Edit .env.local with your values:
   HRH_AUTH_PASSWORD=test_password_123
   HRH_ALLOWED_USERS=test@example.com
   HRH_FROM_EMAIL=Harmony Resource Hub <noreply@example.com>
   HRH_TO_EMAIL=admin@example.com
   RESEND_API_KEY=re_your_key_here
   HRH_SITE_URL=http://localhost:3000
   HRH_ALLOWED_ORIGINS=http://localhost:3000
   ```

2. **Test sign-in functionality**
   - Open signin.html
   - Try sign-in with test credentials
   - Should redirect to portal/
   - Check console (F12 → Console tab) for errors

3. **Test registration functionality**
   - Click "Create account" tab
   - Fill form and submit
   - Should show "✓ Request received! Check your email for next steps."
   - Form should reset

## Testing Checklist

### Sign-In Tests
- [ ] Valid email + correct password → Redirects to portal
- [ ] Valid email + wrong password → Shows "Invalid credentials."
- [ ] Invalid email → Shows "Valid email is required."
- [ ] Empty fields → Shows "Please enter your email and password."
- [ ] Rate limited (10+ attempts) → Shows rate limit message

### Register Tests
- [ ] All fields filled → Shows "Request received! Check your email..."
- [ ] Password < 8 chars → Shows "Password must be at least 8 characters."
- [ ] Passwords don't match → Shows "Passwords do not match."
- [ ] Unchecked agreement → Shows "You must agree to Terms and Privacy Policy."
- [ ] Missing fields → Shows "Please complete all required fields."
- [ ] Email invalid → Shows "Valid email is required."

### CORS Tests
- [ ] No console CORS errors
- [ ] Network tab shows successful preflight OPTIONS requests
- [ ] Response headers include `Access-Control-Allow-Credentials: true`
- [ ] Response headers include `Content-Type: application/json`

### Error Handling Tests
- [ ] Disconnect internet while signing in → Shows error (not hanging)
- [ ] API endpoint offline → Shows specific error message
- [ ] Invalid JSON from API → Shows "Invalid response from server"
- [ ] 500 error from server → Shows server error message

## Browser Developer Tools Verification

### Console Tab (F12 → Console)
- Should be CLEAN - no errors about CORS
- Register form submission should show successful responses
- Auth errors should be meaningful (not "undefined")

### Network Tab (F12 → Network)
1. Filter by "Fetch/XHR"
2. Submit login form
3. Look for:
   - ✅ POST /api/auth/login
   - ✅ Status 200 (success) or 401 (bad creds)
   - ✅ Headers show `Access-Control-Allow-Origin`
   - ✅ Response is valid JSON

### Application Tab (F12 → Application)
After successful sign-in, check localStorage:
- ✅ `hrh_auth_token` is set
- ✅ `hrh_auth_session` is "true"
- ✅ `hrh_auth_email` is correct email

## Rollback Plan

If issues occur:

1. **Revert to previous version**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or go back in Vercel deployments**
   - https://vercel.com/dashboard/Harmonyweb.2
   - Select Deployments
   - Click "..." on previous good deployment
   - Select "Promote to Production"

## Troubleshooting

### "Sign-in failed" message
- Check HRH_AUTH_PASSWORD matches what you entered
- Check HRH_ALLOWED_USERS includes your email
- Check Vercel environment variables are set

### "CORS error" in console
- Ensure HRH_ALLOWED_ORIGINS includes your domain
- For local: should include http://localhost:3000 (or your port)
- For Vercel: should include your Vercel domain

### Registration email not arriving
- Check RESEND_API_KEY is valid (starts with `re_`)
- Verify domain is confirmed in Resend dashboard
- Check Resend email logs: https://resend.com/emails

### Portal shows "Sign in" gate even after login
- Check localStorage has `hrh_auth_session` = "true"
- Clear cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito/private window

## Performance Notes

- Auth requests are NOT cached (good for security)
- Each sign-in requires fresh API call (expected)
- Portal checks session on page load

## Security Considerations

- Tokens stored in localStorage (not httpOnly cookies)
- Passwords transmitted in request body (should use HTTPS - required)
- No password reset flow yet
- Rate limiting prevents brute force (10 attempts per 10 min)

## Support

For issues:
1. Check browser console (F12 → Console) for errors
2. Check Network tab for failed requests
3. Review Vercel logs
4. Check environment variables are set correctly

---

**Version**: 1.0
**Last Updated**: January 14, 2026
**Status**: Ready for testing
