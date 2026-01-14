# Harmony Resource Hub - Complete Setup Guide

## Prerequisites

This guide covers the complete setup needed to get authentication and email working properly.

## Part 1: Resend Setup (Email Service)

### 1.1 Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

### 1.2 Get Your API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: `harmony-resource-hub`
4. Copy the key (starts with `re_`)
5. Keep this safe - you'll need it for environment variables

### 1.3 Verify Your Domain (IMPORTANT for email deliverability)

**Option A: Use Your Own Domain (Recommended)**

If you own `harmonyresourcehub.ca`:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `harmonyresourcehub.ca`
4. Resend will give you DNS records to add
5. Add these records to your domain registrar:
   - Copy the **DKIM**, **DMARC**, and **SPF** records
   - Login to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add these records to your DNS settings
   - Wait 5-30 minutes for DNS propagation
6. Come back to Resend and click "Verify" when ready

**Option B: Test with Resend Domain (For Development)**

If you're testing locally:
1. Use sender: `onboarding@resend.dev`
2. This will work but may have limited deliverability
3. Can only send to verified test emails

### 1.4 Email Sending Rules

Once domain is verified in Resend:
- ✅ You can send from: `noreply@harmonyresourcehub.ca`
- ✅ You can send from: `admin@harmonyresourcehub.ca`
- ✅ You can send from: `Any Name <admin@harmonyresourcehub.ca>`
- ✅ Display name: `Harmony Resource Hub <admin@harmonyresourcehub.ca>`

**DO NOT:**
- ❌ Use unverified domains
- ❌ Mix different sender domains in emails
- ❌ Use generic emails like `noreply@resend.dev`

## Part 2: Environment Variables Setup

### 2.1 Required Environment Variables

Set these in your Vercel project settings (Environment Variables):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
HRH_AUTH_PASSWORD=your_secure_password_here
HRH_ALLOWED_USERS=admin@harmonyresourcehub.ca,user@example.com
HRH_TO_EMAIL=admin@harmonyresourcehub.ca
HRH_FROM_EMAIL=Harmony Resource Hub <admin@harmonyresourcehub.ca>
HRH_SITE_URL=https://www.harmonyresourcehub.ca
HRH_ALLOWED_ORIGINS=https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca
```

### 2.2 Environment Variable Descriptions

| Variable | Example | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | `re_xxx...` | Your Resend API key for sending emails |
| `HRH_AUTH_PASSWORD` | `MySecurePass123!` | Password for login (/api/auth/login) |
| `HRH_ALLOWED_USERS` | `admin@harmonyresourcehub.ca,user@example.com` | Comma-separated emails allowed to log in |
| `HRH_TO_EMAIL` | `admin@harmonyresourcehub.ca` | Where approval requests are sent |
| `HRH_FROM_EMAIL` | `Harmony Resource Hub <admin@harmonyresourcehub.ca>` | Sender name and email (must match verified domain) |
| `HRH_SITE_URL` | `https://www.harmonyresourcehub.ca` | Your website URL for approval links |
| `HRH_ALLOWED_ORIGINS` | `https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca` | CORS allowed origins |

## Part 3: Authentication Flow

### 3.1 Complete User Registration → Approval → Login Flow

**Step 1: User Registration**
```
User fills registration form on signin.html
↓
POST /api/auth/register with: email, name, phone, address
↓
Server validates and generates approval token
↓
Email sent to admin@harmonyresourcehub.ca with approval link
↓
User gets: "Check your email for approval notification"
```

**Step 2: Admin Approval**
```
Admin receives email with approval link
↓
Admin clicks "Approve" or "Reject" button
↓
Browser opens approval page showing status
↓
Server sends approval/rejection email to user
↓
Account status stored in memory (globalThis)
```

**Step 3: User Login**
```
User submits email + password on signin.html
↓
POST /api/auth/login with: email, password
↓
Server checks if account is approved (HRH_ALLOWED_USERS)
↓
If approved: Returns session token + redirects to portal
↓
Token stored in localStorage
↓
User accesses personalized portal at /portal/index.html
```

**Step 4: Verify Account Status**
```
Optional: Call GET /api/auth/verify?email=user@example.com
↓
Returns: { approved: true/false, pending: true/false }
↓
Useful for checking approval status before login
```

### 3.2 API Endpoints Reference

**POST /api/auth/register**
```javascript
Request body:
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St"
}

Response (success):
{
  "ok": true,
  "message": "Registration request received. Check your email."
}

Response (error):
{
  "ok": false,
  "error": "Rate limited or invalid input"
}
```

**GET /api/auth/approve?token=XXXX&email=user@example.com&action=approve**
```
Called from email link
Renders HTML page showing approval status
Also updates account in globalThis.__HRH_APPROVED_ACCOUNTS__
```

**POST /api/auth/approve**
```javascript
Same as GET but returns JSON instead of HTML
{
  "ok": true,
  "message": "Account approved"
}
```

**GET /api/auth/verify?email=user@example.com**
```
Returns approval status
{
  "ok": true,
  "status": "pending" | "approved" | "rejected"
}
```

**POST /api/auth/login**
```javascript
Request body:
{
  "email": "admin@harmonyresourcehub.ca",
  "password": "HRH_AUTH_PASSWORD"
}

Response (success):
{
  "ok": true,
  "token": "base64_encoded_token",
  "email": "admin@harmonyresourcehub.ca",
  "redirectTo": "/portal/index.html"
}

Response (error):
{
  "ok": false,
  "error": "Invalid credentials or account not approved"
}
```

## Part 4: Testing the System Locally

### 4.1 Test Registration
1. Open: `https://www.harmonyresourcehub.ca/signin.html`
2. Click "Request account"
3. Fill form:
   - Email: `test@example.com`
   - Name: `Test User`
   - Phone: `555-1234`
   - Address: `123 Test St`
4. Click "Register"
5. Should see: "Registration request received. Check your email."

### 4.2 Test Email Reception
1. Check your email at the admin address you configured
2. Should receive email with subject: "New Account Request"
3. Email should contain:
   - User details (name, email, phone, address)
   - Two buttons: "Approve" and "Reject"
   - Approval link: `https://www.harmonyresourcehub.ca/api/auth/approve?token=XXXXX&email=test@example.com&action=approve`

### 4.3 Test Approval
1. Click "Approve" button in email
2. Browser should show green checkmark page: "Account Approved!"
3. User at `test@example.com` should receive approval email

### 4.4 Test Login
1. Open: `https://www.harmonyresourcehub.ca/signin.html`
2. Click "Sign in"
3. Enter credentials:
   - Email: from HRH_ALLOWED_USERS environment variable
   - Password: HRH_AUTH_PASSWORD
4. Click "Sign in"
5. Should redirect to `/portal/index.html`
6. Should see personalized portal with all 6 features

## Part 5: Production Deployment to Vercel

### 5.1 Deploy to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Setup complete"
git push origin main

# Deploy to Vercel
vercel --prod
```

### 5.2 Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project: `Harmonyweb.2`
3. Go to Settings → Environment Variables
4. Add all variables from Part 2.1
5. Redeploy: Click "Deployments" → Select latest → Click "Redeploy"

### 5.3 Verify Domain on Resend
1. Complete Resend domain verification before deploying
2. Test send an email
3. Verify it arrives in inbox (not spam)

### 5.4 Update Email Links
Make sure all email templates use your production domain:
- Approval links should use your `HRH_SITE_URL`
- Test one approval before declaring ready

## Part 6: Troubleshooting

### Issue: "Email could not be sent" or "Invalid credentials"
**Solution:** 
- Check RESEND_API_KEY is set in environment variables
- Verify API key is correct (starts with `re_`)
- Check Resend account hasn't hit rate limits

### Issue: Emails going to spam
**Solution:**
- Verify your domain in Resend (Part 1.3)
- Make sure HRH_FROM_EMAIL uses verified domain
- Wait for DNS propagation (5-30 minutes)
- Test domain SPF/DKIM: https://www.mail-tester.com/

### Issue: "This content is blocked" on approval link
**Solution:**
- Ensure HRH_SITE_URL matches your actual domain
- Clear browser cache and try again
- Check CORS settings (HRH_ALLOWED_ORIGINS)

### Issue: Login says "Account not approved"
**Solution:**
- Make sure account email was approved via email link
- Check if account is in HRH_ALLOWED_USERS
- Call GET /api/auth/verify?email=user@example.com to check status
- Approval status is in-memory (restarts reset state)

### Issue: "Authentication not configured"
**Solution:**
- Set all required environment variables (Part 2.1)
- Deploy to Vercel with environment variables
- For local testing: Create `.env.local` file with variables
- Restart dev server after adding .env.local

## Part 7: Email Templates

All emails are sent with:
- **From:** HRH_FROM_EMAIL (default: `Harmony Resource Hub <admin@harmonyresourcehub.ca>`)
- **Subject:** Descriptive subject line
- **Body:** HTML formatted with Tailwind CSS styling

### Registration Approval Email
- **To:** HRH_TO_EMAIL
- **Subject:** "New Account Request"
- **Contains:** User details + Approve/Reject buttons

### Account Approved Email
- **To:** User email
- **Subject:** "Your Harmony Resource Hub Account Has Been Approved!"
- **Contains:** Login link + next steps

### Account Rejected Email
- **To:** User email
- **Subject:** "Update on Your Harmony Resource Hub Application"
- **Contains:** Contact support link

## Next Steps

1. ✅ Set up Resend account and get API key
2. ✅ Verify your domain in Resend
3. ✅ Set environment variables in Vercel
4. ✅ Test registration → approval → login flow
5. ✅ Deploy to production
6. ✅ Monitor email deliverability

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Verify all environment variables are set
3. Check Resend dashboard for email logs
4. Review server logs in Vercel dashboard
