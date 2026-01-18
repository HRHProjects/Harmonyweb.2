# 🚀 SET UP REAL AUTHENTICATION - 10 MINUTES

> Your system is ready. Follow these steps to enable open registration for all users.

---

## What You're Setting Up

✅ **Anyone can create an account** with their email
✅ **Email verification** with 6-digit code  
✅ **Secure password storage** with hashing
✅ **Full portal access** after sign-in
✅ **Multiple user support** - unlimited accounts

---

## Step 1️⃣: Get Resend API Key (3 minutes)

### Go to Resend
- Visit: https://resend.com
- Click "Sign Up"
- Create account (use your email)

### Get Your API Key
- Click "API Keys" in left menu
- Copy your key (starts with `re_live_...` or `re_test_...`)
- **Keep it safe** - don't share it

---

## Step 2️⃣: Add API Key to Vercel (2 minutes)

### Go to Vercel
1. Visit: https://vercel.com/dashboard
2. Click on **Harmonyweb.2** project
3. Click **Settings**
4. Click **Environment Variables** (left sidebar)

### Add the Key
1. Click **Add new**
2. **Name:** `RESEND_API_KEY`
3. **Value:** Paste your key from Resend
4. **Environments:** Check all (Production, Preview, Development)
5. Click **Save**

### Optional: Email Configuration
1. Click **Add new**
2. **Name:** `HRH_FROM_EMAIL`
3. **Value:** `Harmony Resource Hub <noreply@harmonyresourcehub.ca>`
4. **Environments:** Check all
5. Click **Save**

---

## Step 3️⃣: Redeploy Project (3 minutes)

### Option A: Auto-Deploy (Recommended)
```bash
git add .
git commit -m "chore: enable authentication system"
git push origin main
```
Wait 2-3 minutes for Vercel to auto-deploy.

### Option B: Manual Redeploy
1. Go to Vercel dashboard
2. Click **Harmonyweb.2** project
3. Click **Deployments**
4. Find latest deployment
5. Click it
6. Click **Redeploy**
7. Wait for ✓ Ready

---

## Step 4️⃣: Test It Works (2 minutes)

### Create Test Account
1. Visit: https://www.harmonyresourcehub.ca/signin.html
2. Click **"Create account"** tab
3. Fill in:
   - **Full name:** Your Name
   - **Email:** your_email@example.com
   - **Password:** TestPass123!
4. Click **"Create account"**

### Check Your Email
1. Open your email inbox
2. Look for email from **Resend** (may be spam folder)
3. Find **6-digit code**
4. Go back to browser

### Verify Email
1. Paste **6-digit code** into portal
2. Click **"Verify Email"**
3. Wait for success message

### Sign In
1. You should auto-switch to **"Sign in"** tab
2. Your email should be pre-filled
3. Enter your **password**
4. Click **"Sign in"**

### See Portal
1. You should see: **"Welcome back!"**
2. Your email in top right
3. All portal features visible

**✅ Success! It's working!**

---

## Troubleshooting

### Email never arrives
1. Check **spam folder**
2. Verify RESEND_API_KEY is set on Vercel
3. Wait 2-3 min for deployment to finish
4. Try again

### "Invalid response from server"
1. Wait 2-3 minutes for deployment
2. Refresh browser (Ctrl+F5)
3. Try again
4. Check Vercel deployment status

### Can't see verification step
1. Open browser console (F12)
2. Look for logs starting with "📝"
3. Check for error messages
4. Verify registration endpoint works

### Code doesn't verify
1. Check you copied code correctly
2. No typos
3. Code didn't expire (15 min limit)
4. Try "Resend verification code"

---

## Console Logs to Expect

When you create an account, open F12 and watch for:

```
📝 Registering new account: your_email@example.com
📡 Registration response status: 200
📦 Registration response data: {...}
✅ Registration successful! Showing verification step
```

When you verify:
```
🔐 Verifying email with code: 123456 for email: your_email@example.com
📡 Verification response status: 200
📦 Verification response data: {...}
✅ Email verified! Account created successfully
```

When you sign in:
```
🔐 Attempting login to: https://harmonyweb-2.vercel.app/api/auth/login
📡 Response status: 200
📦 Response data: {...}
✅ Login successful, redirecting to portal
```

---

## Share With Users

Once tested and working, share this link:

```
https://www.harmonyresourcehub.ca/signin.html
```

Users can:
1. Click "Create account"
2. Enter their details
3. Verify email
4. Sign in
5. Access portal

---

## Monitor System

### Check Vercel Logs
1. Go to https://vercel.com/dashboard
2. Select Harmonyweb.2
3. Click **Deployments**
4. Click latest deployment
5. Click **Functions** tab
6. Click `/api/auth/register` or `/api/auth/verify` or `/api/auth/login`
7. See real-time logs

### Common Log Messages
- `Email verification code sent` - Successful registration
- `Email verified successfully` - Account created
- `Invalid credentials` - Wrong password at login
- `Rate limit exceeded` - Too many attempts

---

## What Happens Next

### Users will be able to:
✅ Create account anytime
✅ Verify email
✅ Sign in 24/7
✅ Upload documents
✅ View application status
✅ Message support team
✅ Track payments

### You can:
✅ Monitor user signups
✅ View Vercel logs
✅ Add more users manually if needed
✅ Change email templates (in api files)
✅ Extend features as needed

---

## Success Checklist

After setup, confirm:
- [ ] RESEND_API_KEY set on Vercel
- [ ] Project redeployed
- [ ] Can create account at /signin.html
- [ ] Receive verification email
- [ ] Can verify with code
- [ ] Can sign in with credentials
- [ ] Portal shows after login
- [ ] Email shows in portal header
- [ ] Can sign out
- [ ] Can sign in again

---

## Done! 🎉

Your authentication system is now **fully functional**.

**Anyone can:**
- Create account
- Verify email
- Sign in
- Access portal

**No more configuration needed.**

Just share the link: https://www.harmonyresourcehub.ca/signin.html
