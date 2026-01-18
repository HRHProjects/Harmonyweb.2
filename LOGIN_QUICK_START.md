# ⚡ QUICK FIX: Enable Login in 5 Minutes

> **TL;DR:** Your login system is built but needs environment variables on Vercel to work.

## The Problem

When users click "Sign in," nothing happens because the backend doesn't have credentials configured.

## The Solution (5 Steps)

### Step 1: Go to Vercel Dashboard
📍 Visit: https://vercel.com/dashboard

### Step 2: Select Your Project
- Click on **Harmonyweb.2** project
- Open **Settings**
- Click **Environment Variables**

### Step 3: Add Password Variable
**Name:** `HRH_AUTH_PASSWORD`
**Value:** `ChooseAStrongPassword123!`
**Environments:** ✓ Production ✓ Preview ✓ Development

### Step 4: Add Allowed Users
**Name:** `HRH_ALLOWED_USERS`
**Value:** `admin@harmonyresourcehub.ca,client1@example.com`
**Environments:** ✓ Production ✓ Preview ✓ Development

> **Format:** Email addresses separated by commas (no spaces between them)

### Step 5: Redeploy
Either:
- Push a change to GitHub (triggers auto-deploy), OR
- Click a deployment in **Deployments** tab and click "Redeploy"

## Test It Works

1. Go to https://www.harmonyresourcehub.ca/signin.html
2. Enter email: `admin@harmonyresourcehub.ca`
3. Enter password: `ChooseAStrongPassword123!` (from step 3)
4. Click "Sign in"

**Expected result:** Redirects to `/portal/` with "Welcome back!" message

## What Just Happened?

```
Browser (User enters credentials)
    ↓
Form submits to https://harmonyweb-2.vercel.app/api/auth/login
    ↓
Backend checks environment variables
    ↓
✓ Email found in HRH_ALLOWED_USERS
✓ Password matches HRH_AUTH_PASSWORD
    ↓
Server returns authentication token
    ↓
Browser saves token in localStorage
    ↓
User redirected to portal
    ↓
Portal unlocks and shows dashboard
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still doesn't work | Wait 2-3 min for deployment, refresh browser |
| "Invalid credentials" | Double-check email and password spelling |
| Can't find Settings tab | Make sure you're on the project page, not dashboard |
| Deployment hasn't finished | Check green checkmark next to deployment status |

## What to Do Next

### For Users/Clients:
1. Share sign-in credentials with them
2. They visit `/signin.html`
3. They upload documents in the portal
4. Done! 🎉

### For Admin:
- Users can now:
  - ✓ Upload documents
  - ✓ Check application status
  - ✓ Message support team
  - ✓ Manage payments
  - ✓ Access 24/7

## Advanced: Multiple Users

Change `HRH_ALLOWED_USERS` to include multiple emails:

```
admin@harmonyresourcehub.ca,john@example.com,sarah@example.com,mike@example.com
```

Each person uses the same password from `HRH_AUTH_PASSWORD`.

## Demo Mode (No Setup Needed)

Want to see how the portal looks without setting up? Share this link:

```
https://www.harmonyresourcehub.ca/portal/?demo=1
```

Perfect for showing clients what they'll have access to!

## Still Having Issues?

Check [LOGIN_TROUBLESHOOTING.md](LOGIN_TROUBLESHOOTING.md) for detailed debugging steps.

---

**That's it! Your login system is now live.** 🚀
