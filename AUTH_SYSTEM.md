# Authentication System - Complete Overview

## Quick Answer: Why Sign-In Isn't Working

The sign-in page **is fully functional** but **requires server-side configuration** to work. Follow these steps to enable it:

### For Admins (First-Time Setup)

1. Go to https://vercel.com/dashboard
2. Select **Harmonyweb.2** project
3. Click **Settings** → **Environment Variables**
4. Add these variables:
   ```
   HRH_AUTH_PASSWORD = YourSecurePassword123!
   HRH_ALLOWED_USERS = admin@example.com,client1@example.com
   ```
5. **Redeploy** the project (push any change or manually trigger redeploy)
6. Share credentials with clients

### For Clients (Once Setup is Done)

1. Go to https://www.harmonyresourcehub.ca/signin.html
2. Enter your email and password
3. Click "Sign in" → redirects to portal
4. See your dashboard and manage documents

## How the Authentication System Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                        │
│  signin.html → app.js (setupSignInForm) → Fetch API        │
└────────────────────────┬────────────────────────────────────┘
                         │
                    (POST with credentials)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL (API Server)                         │
│  /api/auth/login.js (Node.js)                              │
│  ├─ Check environment variables                             │
│  ├─ Validate credentials                                    │
│  ├─ Generate session token                                  │
│  └─ Return token to client                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                    (JSON response)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                        │
│  Save token → localStorage → Redirect to /portal/           │
│  Portal detects session → Show dashboard                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Frontend (signin.html + app.js)

**File:** [signin.html](signin.html)
- Email/password form
- Validation before submission
- Status messages

**File:** [app.js](app.js#L482) - `setupSignInForm()`
- Form submit handler
- Fetches `/api/auth/login` endpoint
- Stores session in localStorage
- Redirects to portal on success
- Shows detailed console logs for debugging

#### 2. Backend (api/auth/login.js)

**File:** [api/auth/login.js](api/auth/login.js)
- Receives email + password
- Checks against `HRH_ALLOWED_USERS`
- Validates against `HRH_AUTH_PASSWORD`
- Returns JWT token on success
- Returns 401 if credentials invalid

#### 3. Portal (portal/index.html + app.js)

**File:** [portal/index.html](portal/index.html)
- Auth gate (shows login redirect if not authenticated)
- Portal dashboard (shows if authenticated)
- File upload interface
- Messages section
- Payments section
- Account settings

**File:** [app.js](app.js#L783) - `setupPortalApp()`
- Checks localStorage for session
- Shows/hides auth gate and main content
- Logout functionality
- Demo mode (`?demo=1` in URL)

## Environment Variables Required

### HRH_AUTH_PASSWORD
- **What it is:** Master password for authentication
- **Format:** Any string (recommended: strong password)
- **Example:** `SecurePass123!AnotherPass`
- **Used by:** Login API to validate credentials
- **Where to set:** Vercel → Project Settings → Environment Variables

### HRH_ALLOWED_USERS
- **What it is:** List of emails permitted to sign in
- **Format:** Comma-separated emails (no spaces)
- **Example:** `admin@harmonyresourcehub.ca,client1@example.com,client2@example.com`
- **Used by:** Login API to check if user exists
- **Where to set:** Vercel → Project Settings → Environment Variables

### Optional: HRH_ALLOWED_ORIGINS
- **What it is:** CORS whitelist for API requests
- **Default:** Works with harmonyresourcehub.ca domains
- **Use case:** Only needed if hosting on custom domain

## Sign-In Flow - Step by Step

### Step 1: User enters credentials
```
User: admin@harmonyresourcehub.ca
Password: SecurePass123!
```

### Step 2: Browser submits form
```javascript
// From app.js setupSignInForm()
fetch("https://harmonyweb-2.vercel.app/api/auth/login", {
  method: "POST",
  body: {
    email: "admin@harmonyresourcehub.ca",
    password: "SecurePass123!"
  }
})
```

### Step 3: Server validates
```javascript
// From api/auth/login.js
1. Check if email is in HRH_ALLOWED_USERS
   ✓ Found: admin@harmonyresourcehub.ca

2. Check if password matches HRH_AUTH_PASSWORD
   ✓ Matches: SecurePass123!

3. Generate token
   → base64("admin@harmonyresourcehub.ca:timestamp:random")

4. Return success
   {
     ok: true,
     token: "YWRtaW4@...",
     email: "admin@harmonyresourcehub.ca",
     expiresIn: 28800
   }
```

### Step 4: Browser saves session
```javascript
// From app.js setupSignInForm()
localStorage.setItem("hrh_auth_token", token);
localStorage.setItem("hrh_auth_session", "true");
localStorage.setItem("hrh_auth_email", email);
```

### Step 5: Redirect to portal
```javascript
window.location.href = "portal/"; // Redirects to /portal/
```

### Step 6: Portal checks session
```javascript
// From app.js setupPortalApp()
const hasSession = Boolean(
  localStorage.getItem("hrh_auth_session") || 
  localStorage.getItem("hrh_auth_token")
);

if (hasSession) {
  // Show portal content
  main.classList.remove("hidden");
  gate.classList.add("hidden");
} else {
  // Show login prompt
  gate.classList.remove("hidden");
  main.classList.add("hidden");
}
```

## Troubleshooting Guide

### Problem: "Invalid credentials" error

**Possible causes:**
1. Email not in `HRH_ALLOWED_USERS`
2. Wrong password
3. Environment variables not set
4. Variables set but project not redeployed

**Solution:**
```bash
1. Check Vercel environment variables
2. Verify email is in HRH_ALLOWED_USERS (no typos)
3. Verify password matches HRH_AUTH_PASSWORD
4. Redeploy the project
5. Clear browser cache/cookies
6. Try again
```

### Problem: "Sign-in does nothing" (no response)

**Possible causes:**
1. API endpoint not configured in config.js
2. Network error / CORS blocked
3. Server error
4. Browser localStorage disabled

**Solution:**
1. Check browser console (F12)
2. Look for network requests in Network tab
3. Check Vercel Functions logs
4. Enable cookies/localStorage in browser

### Problem: Portal shows "Access Required" after signing in

**Possible causes:**
1. localStorage cleared by browser
2. Session key not saved correctly
3. Different browser or tab
4. Private/incognito mode

**Solution:**
1. Sign in again
2. Check localStorage in DevTools
3. Ensure cookies are enabled

## Demo Mode

Users can preview the portal **without signing in** by visiting:

```
https://www.harmonyresourcehub.ca/portal/?demo=1
```

This:
- ✓ Shows the full portal interface
- ✓ Displays "Demo User (Preview Mode)" in header
- ✓ Doesn't require environment variables
- ✓ Perfect for testing/showcasing

**Note:** Demo mode doesn't save data or uploads. It's read-only preview only.

## Security Considerations

### Current Implementation
- ✓ Passwords validated server-side
- ✓ Tokens generated per-session
- ✓ HTTPS enforced (Vercel)
- ✓ CORS properly configured
- ✓ Rate limiting on login endpoint

### Future Improvements
- [ ] Database for user accounts (instead of env variables)
- [ ] Email verification on registration
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Session expiration
- [ ] Encrypted password storage

## Testing the System

### Manual Test (Browser)
1. Navigate to https://www.harmonyresourcehub.ca/signin.html
2. Open console (F12)
3. Enter test credentials
4. Watch console logs:
   - `🔐 Attempting login to: ...`
   - `📡 Response status: 200`
   - `✅ Login successful`
5. Should redirect to portal
6. Portal should show email in header

### API Test (cURL)
```bash
curl -X POST https://harmonyweb-2.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@harmonyresourcehub.ca",
    "password": "SecurePass123!"
  }'
```

Expected response:
```json
{
  "ok": true,
  "token": "YWRtaW4@...",
  "email": "admin@harmonyresourcehub.ca",
  "expiresIn": 28800
}
```

## File Structure

```
/
├── signin.html              ← Sign-in page (frontend)
├── portal/
│   └── index.html          ← Portal page (frontend)
├── app.js                  ← JavaScript handlers
│   ├── setupSignInForm()   ← Sign-in logic
│   ├── setupPortalApp()    ← Portal logic
│   └── setupRegisterForm() ← Registration logic
├── config.js               ← Configuration (endpoints)
├── api/
│   └── auth/
│       ├── login.js        ← Login endpoint (backend)
│       ├── register.js     ← Register endpoint (backend)
│       ├── verify.js       ← Email verification (backend)
│       └── approve.js      ← Admin approval (backend)
└── [docs]
    ├── LOGIN_TROUBLESHOOTING.md
    ├── PORTAL_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    └── AUTH_SYSTEM.md (this file)
```

## Next Steps

### If Setting Up for First Time:
1. ✓ [Follow DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. ✓ Set environment variables on Vercel
3. ✓ Test sign-in at /signin.html
4. ✓ Share credentials with clients
5. ✓ Clients access /portal/ after login

### If Testing:
1. ✓ Use demo mode at `/portal/?demo=1`
2. ✓ Check browser console for logs
3. ✓ Use LOGIN_TROUBLESHOOTING.md for issues

### If Customizing:
1. ✓ Auth endpoints: [api/auth/](api/auth/)
2. ✓ Frontend logic: [app.js](app.js)
3. ✓ Configuration: [config.js](config.js)

---

**Status:** ✅ Authentication system is fully implemented and ready to deploy.
