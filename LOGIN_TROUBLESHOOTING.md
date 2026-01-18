# Login Not Working - Troubleshooting Guide

## Problem: Sign-in doesn't do anything

If clicking "Sign in" doesn't work or shows no response, follow these steps:

## Step 1: Check Browser Console for Errors

1. Open the browser console (Press `F12` or `Ctrl+Shift+I`)
2. Go to the **Console** tab
3. Attempt to sign in
4. Look for error messages starting with `❌`, `🔐`, or `📡`

**Common errors and what they mean:**

- **"Invalid credentials"** → The email/password combination is wrong OR environment variables aren't set
- **"Sign-in failed (401)"** → Authentication failed (wrong credentials or not allowed)
- **"Sign-in failed (500)"** → Server error (check Vercel logs)
- **"Valid email is required"** → Email format is invalid

## Step 2: Verify Vercel Environment Variables

The sign-in system requires environment variables to be configured. To check/set them:

### On Vercel:
1. Go to https://vercel.com/dashboard
2. Select your **Harmonyweb.2** project
3. Click **Settings** → **Environment Variables**
4. Ensure these variables are set:

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `HRH_AUTH_PASSWORD` | `SecurePass123!` | Master password for sign-in |
| `HRH_ALLOWED_USERS` | `admin@harmonyresourcehub.ca,client@example.com` | Comma-separated list of emails allowed to sign in |

### If variables are missing:

1. **Add `HRH_AUTH_PASSWORD`:**
   - Click "Add new"
   - Name: `HRH_AUTH_PASSWORD`
   - Value: Enter a strong password
   - Apply to: Production, Preview, Development
   - Click "Save"

2. **Add `HRH_ALLOWED_USERS`:**
   - Click "Add new"
   - Name: `HRH_ALLOWED_USERS`
   - Value: Enter email addresses (comma-separated, no spaces)
   - Example: `admin@harmonyresourcehub.ca,john@example.com`
   - Apply to: Production, Preview, Development
   - Click "Save"

3. **Redeploy your project:**
   - Push any change to trigger a new deployment, OR
   - Go to Deployments and manually redeploy the latest commit

## Step 3: Test the Login

After setting environment variables and redeploying:

1. Go to https://www.harmonyresourcehub.ca/signin.html
2. Use an email from `HRH_ALLOWED_USERS` (e.g., `admin@harmonyresourcehub.ca`)
3. Use the password from `HRH_AUTH_PASSWORD`
4. Click "Sign in"

**Expected behavior:**
- Status shows "Signing in..."
- You see "Sign-in successful! Redirecting to portal..."
- You're redirected to the client portal at `/portal/`

## Step 4: Access the Client Portal

Once logged in, you should see:

✓ Client Portal dashboard
✓ Document upload area
✓ Application status section
✓ Sign out button

If you see the "Access Required" message instead of the portal content, it means:
- The login didn't actually save the session
- Browser cookies/localStorage are blocked
- The session token wasn't generated

## Debugging Console Logs

Enable detailed logging by checking these console messages:

| Message | What it means |
|---------|--------------|
| `🔐 Attempting login to: https://...` | Trying to connect to the API |
| `📡 Response status: 200` | Server responded successfully |
| `✅ Login successful, redirecting to portal` | Login worked! |
| `❌ Login error: Invalid credentials` | Email/password combo is wrong |
| `❌ Login error: Valid email is required` | Email format is invalid |

## Quick Checklist

- [ ] Environment variables are set on Vercel
- [ ] Project has been redeployed after setting variables
- [ ] Email is in `HRH_ALLOWED_USERS` list
- [ ] Using the correct `HRH_AUTH_PASSWORD`
- [ ] Browser console shows no errors (or expected ones)
- [ ] Cookies are enabled in browser
- [ ] Not using private/incognito mode (may affect localStorage)

## Still Not Working?

1. **Check Vercel deployment logs:**
   - Go to https://vercel.com/dashboard
   - Select Harmonyweb.2 project
   - Click "Deployments"
   - Click the latest deployment
   - Check "Functions" → `/api/auth/login` for errors

2. **Test the API directly:**
   ```bash
   curl -X POST https://harmonyweb-2.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email":"admin@harmonyresourcehub.ca",
       "password":"YourPassword"
     }'
   ```

3. **Check for CORS issues:**
   - Look for "CORS" errors in browser console
   - Verify `HRH_ALLOWED_ORIGINS` includes your site URL

## Next Steps After Login

Once login works, you have access to:

1. **Client Portal** - Manage documents and applications
2. **Account Management** - Update your profile
3. **Document Upload** - Submit required files
4. **Status Updates** - Track application progress

For more information, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) or [SETUP_README.md](SETUP_README.md).
