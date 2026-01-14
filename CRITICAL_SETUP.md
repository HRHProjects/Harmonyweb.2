# ⚠️ CRITICAL: Email & Authentication Configuration Checklist

## Before Testing - MUST DO These Steps!

### Step 1: Set Up Resend Domain (CRITICAL for email delivery)
- [ ] Create Resend account at https://resend.com
- [ ] Get API key from https://resend.com/api-keys (copy key starting with `re_`)
- [ ] Go to https://resend.com/domains
- [ ] Add your domain: `harmonyresourcehub.ca`
- [ ] Add DNS records from Resend to your domain registrar
- [ ] Wait 5-30 minutes for DNS propagation
- [ ] Verify domain in Resend dashboard
- [ ] Test sending an email via Resend dashboard

### Step 2: Configure Environment Variables

**Option A: For Vercel Deployment**
1. Go to https://vercel.com/dashboard
2. Select `Harmonyweb.2` project
3. Go to Settings → Environment Variables
4. Add these variables:

```
RESEND_API_KEY=re_your_key_here
HRH_AUTH_PASSWORD=secure_password_123
HRH_ALLOWED_USERS=admin@harmonyresourcehub.ca,user@example.com
HRH_TO_EMAIL=admin@harmonyresourcehub.ca
HRH_FROM_EMAIL=Harmony Resource Hub <admin@harmonyresourcehub.ca>
HRH_SITE_URL=https://www.harmonyresourcehub.ca
HRH_ALLOWED_ORIGINS=https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca
```

5. Click "Save"
6. Go to Deployments → Select latest → Click "Redeploy"

**Option B: For Local Testing**
1. Copy file: `cp .env.local.example .env.local`
2. Edit `.env.local` with your actual values
3. Save file

### Step 3: Configure Email URLs to Match Domain
- [ ] Ensure `HRH_FROM_EMAIL` uses your verified domain (e.g., `admin@harmonyresourcehub.ca`)
- [ ] Ensure `HRH_SITE_URL` matches your domain (e.g., `https://www.harmonyresourcehub.ca`)
- [ ] All email links in templates use `HRH_SITE_URL` (they do automatically)
- [ ] NO mix of `onboarding@resend.dev` and your domain in emails

### Step 4: Verify Authentication Setup
- [ ] API endpoints exist: `api/auth/register.js`, `api/auth/login.js`, `api/auth/approve.js`, `api/auth/verify.js`
- [ ] All files have valid JavaScript syntax
- [ ] Run: `bash verify-setup.sh` (check all green ✓)

## Common Issues & Solutions

### ❌ "Email could not be sent" or Email sending fails
**Causes:**
- RESEND_API_KEY not set or incorrect
- Domain not verified in Resend
- API key has wrong permissions

**Fix:**
1. Check RESEND_API_KEY is set: `echo $RESEND_API_KEY`
2. Verify it starts with `re_`
3. Go to https://resend.com/api-keys and regenerate if needed
4. Verify domain at https://resend.com/domains
5. Check Resend email logs for errors

### ❌ Emails going to spam or not arriving
**Causes:**
- Domain not verified in Resend
- Sender email doesn't match verified domain
- SPF/DKIM records not added correctly

**Fix:**
1. Verify domain in Resend: https://resend.com/domains
2. Add all DNS records from Resend to your registrar
3. Wait for DNS propagation (can take up to 30 minutes)
4. Test domain: https://www.mail-tester.com/
5. Ensure FROM email is: `Harmony Resource Hub <admin@harmonyresourcehub.ca>` (NOT onboarding@resend.dev)

### ❌ "Authentication is not configured"
**Causes:**
- Environment variables not set
- API endpoints return 500 errors

**Fix:**
1. Set all required environment variables (see Step 2)
2. For Vercel: Redeploy after adding environment variables
3. For local: Create .env.local file
4. Check server logs for specific error messages

### ❌ "Invalid credentials" during login
**Causes:**
- Wrong email in HRH_ALLOWED_USERS
- Wrong password (doesn't match HRH_AUTH_PASSWORD)
- Account hasn't been approved yet

**Fix:**
1. Check HRH_ALLOWED_USERS includes your test email
2. Use HRH_AUTH_PASSWORD for login password
3. First register account, then get approval, then login

### ❌ Approval link shows "This content is blocked"
**Causes:**
- Browser security policy blocking mixed content
- CORS headers not set correctly
- Domain mismatch in approval URL

**Fix:**
1. Ensure HRH_SITE_URL uses HTTPS (not HTTP)
2. Clear browser cache
3. Check CORS settings (HRH_ALLOWED_ORIGINS)
4. Verify approval URL domain matches HRH_SITE_URL

## Testing Checklist

### Registration Test
- [ ] Open `https://www.harmonyresourcehub.ca/signin.html`
- [ ] Click "Request account"
- [ ] Fill form with test data
- [ ] Click "Register"
- [ ] See message: "Registration request received"
- [ ] Check email (inbox + spam folder) for approval request
- [ ] Email contains user details and Approve/Reject buttons

### Approval Test
- [ ] Click "Approve" in approval email
- [ ] Browser shows green checkmark page
- [ ] Get approval email at test user's inbox
- [ ] Email contains login link

### Login Test
- [ ] Open `https://www.harmonyresourcehub.ca/signin.html`
- [ ] Click "Sign in"
- [ ] Enter email from HRH_ALLOWED_USERS
- [ ] Enter password (HRH_AUTH_PASSWORD)
- [ ] Click "Sign in"
- [ ] Redirect to portal page

### Portal Test
- [ ] See 6 feature cards (My Uploads, Messages, Payments, etc.)
- [ ] See personalized welcome message
- [ ] All buttons work (or show "Coming soon")
- [ ] Can click "Log Out"

## Email URL Configuration Reference

All these should match your domain and use HTTPS:

| What | Should Be | NOT |
|------|-----------|-----|
| FROM email | `admin@harmonyresourcehub.ca` | `onboarding@resend.dev` |
| Approval link in email | `https://www.harmonyresourcehub.ca/api/auth/approve?...` | `http://...` or wrong domain |
| Login link in email | `https://www.harmonyresourcehub.ca/signin.html` | `http://...` or wrong domain |
| Site URL | `https://www.harmonyresourcehub.ca` | `http://...` or localhost |
| CORS origins | Includes your domain | Doesn't include domain |

## Quick Verification Command

Run this to check your setup:
```bash
bash verify-setup.sh
```

Expected output:
```
✓ RESEND_API_KEY = re_xxxx...
✓ HRH_AUTH_PASSWORD = your_...
✓ HRH_ALLOWED_USERS = admin@...
✓ HRH_TO_EMAIL = admin@...
✓ HRH_FROM_EMAIL = Harmony...
✓ HRH_SITE_URL = https://...
✓ HRH_ALLOWED_ORIGINS = https://...
✓ api/auth/register.js - Syntax OK
✓ api/auth/login.js - Syntax OK
✓ api/auth/approve.js - Syntax OK
✓ api/auth/verify.js - Syntax OK

✅ All checks passed! System is ready.
```

If you see red ✗ marks, follow the instructions to fix them.

## Getting Help

1. **Resend Docs:** https://resend.com/docs
2. **Email Troubleshooting:** https://resend.com/docs/troubleshooting
3. **Domain Verification:** https://resend.com/docs/dashboard/domains
4. **SPF/DKIM Testing:** https://www.mail-tester.com/
