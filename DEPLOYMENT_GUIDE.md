# Vercel Deployment Guide - Environment Variables

## Overview
This guide helps you configure the Harmony Resource Hub backend on Vercel with proper environment variables.

## Step-by-Step Setup

### 1. Add Resend API Key

**In Vercel Dashboard:**
1. Go to your project Settings → Environment Variables
2. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Your Resend.com API key (get from https://resend.com/api-keys)
   - **Environments:** Production, Preview, Development

### 2. Configure Email Settings

Add these variables:

| Name | Value | Description |
|------|-------|-------------|
| `HRH_TO_EMAIL` | `admin@harmonyresourcehub.ca` | Where approval requests are sent |
| `HRH_FROM_EMAIL` | `Harmony Resource Hub <onboarding@resend.dev>` | Sender email |
| `HRH_SITE_URL` | `https://www.harmonyresourcehub.ca` | Your domain URL |

### 3. Configure Authentication

For the login endpoint to work, you need:

| Name | Value | Description |
|------|-------|-------------|
| `HRH_AUTH_PASSWORD` | Any strong password | Master auth password (temporary until DB) |
| `HRH_ALLOWED_USERS` | `client1@example.com,client2@example.com` | Comma-separated approved emails |
| `HRH_AUTH_EMAIL` | `admin@harmonyresourcehub.ca` | Optional: single allowed email |

**For testing, use:**
```
HRH_AUTH_PASSWORD: testpassword123
HRH_ALLOWED_USERS: test@example.com,admin@harmonyresourcehub.ca
```

### 4. Configure CORS (if needed)

Add this variable to allow specific origins:

| Name | Value |
|------|-------|
| `HRH_ALLOWED_ORIGINS` | `https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca` |

## Complete Environment Variables List

```
# Email & Resend
RESEND_API_KEY=YOUR_RESEND_KEY_HERE
HRH_TO_EMAIL=admin@harmonyresourcehub.ca
HRH_FROM_EMAIL=Harmony Resource Hub <onboarding@resend.dev>
HRH_SITE_URL=https://www.harmonyresourcehub.ca

# Authentication  
HRH_AUTH_PASSWORD=your_strong_password_here
HRH_ALLOWED_USERS=test@example.com,admin@harmonyresourcehub.ca

# Optional
HRH_ADMIN_EMAIL=admin@harmonyresourcehub.ca
HRH_ALLOWED_ORIGINS=https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca
HRH_SUBJECT_PREFIX=[HRH]
```

## Testing Without Vercel

To test locally, create a `.env.local` file (or `.env` for Node):

```bash
RESEND_API_KEY=your_key_here
HRH_TO_EMAIL=admin@harmonyresourcehub.ca
HRH_FROM_EMAIL=Harmony Resource Hub <onboarding@resend.dev>
HRH_SITE_URL=http://localhost:3000
HRH_AUTH_PASSWORD=testpassword123
HRH_ALLOWED_USERS=test@example.com
```

## Testing the Endpoints

### 1. Test Registration
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "password": "securepass123"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "pending": true,
  "message": "Account request submitted. Check your email for confirmation..."
}
```

### 2. Test Login
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "token": "base64encodedtoken",
  "email": "test@example.com",
  "expiresIn": 28800
}
```

### 3. Test Verification
```bash
curl -X POST https://your-domain.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

## Approval Workflow

### When Admin Clicks Approval Link

1. Admin receives email with approval button
2. Clicking button calls `/api/auth/approve?token=XXX&email=user@example.com`
3. Endpoint displays success page (HTML)
4. User receives approval email

### What Gets Approved

The approval flow:
1. **User submits registration** → Email sent to admin with approval link
2. **Admin clicks approval** → Account marked as approved
3. **User receives email** → Can now sign in with registered password
4. **User visits portal** → Full access to dashboard with personalized features

## Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Test approval email sent to admin
- [ ] Test clicking approval link from email (should see success page)
- [ ] Test user receives approval confirmation email
- [ ] Test login with approved account
- [ ] Test portal access with authenticated user
- [ ] Verify no sensitive data in browser console
- [ ] Setup monitoring for failed approvals
- [ ] Configure email templates in Resend
- [ ] Test on mobile devices

## Troubleshooting

### "This content is blocked" Error
**Problem:** Approval link not rendering HTML
**Solution:** Make sure approve endpoint is returning HTML not JSON for GET requests

### Users not receiving emails
**Problem:** Emails not arriving
**Solution:** 
- Check RESEND_API_KEY is correct
- Verify HRH_TO_EMAIL is correct
- Check Resend dashboard for delivery failures
- Look in spam/junk folders

### Login fails with "not configured"
**Problem:** `HRH_AUTH_PASSWORD` not set
**Solution:** Add `HRH_AUTH_PASSWORD` and `HRH_ALLOWED_USERS` to environment variables

### CORS errors
**Problem:** Frontend can't reach API
**Solution:** Add domain to `HRH_ALLOWED_ORIGINS` environment variable

## Next Steps

1. **Add to Vercel:** Push code and set environment variables
2. **Test workflow:** Register, approve, login, access portal
3. **Monitor:** Watch logs for errors
4. **Iterate:** Add features like actual file uploads, payments integration
5. **Production:** Migrate to permanent database (Postgres, MongoDB)

## Getting Resend API Key

1. Go to https://resend.com
2. Create account (free plan available)
3. Create API key
4. Copy key to Vercel environment variables

That's it! Your authentication system is now configured and ready to use.
