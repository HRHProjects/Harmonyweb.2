# Harmony Resource Hub - Authentication & Email Setup

## 🚨 IMPORTANT: You Must Complete These Steps

Your authentication system is fully built but **NOT YET ACTIVATED**. Follow these steps:

### Step 1️⃣: Create Resend Account & Get API Key
1. Go to https://resend.com
2. Sign up for free
3. Go to https://resend.com/api-keys
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### Step 2️⃣: Verify Your Email Domain in Resend (Critical!)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `harmonyresourcehub.ca`
4. Resend will show DNS records
5. Add these records to your domain registrar (GoDaddy, Namecheap, etc.)
6. Wait 5-30 minutes for DNS
7. Click "Verify" in Resend

**⚠️ Skip this step = emails go to spam!**

### Step 3️⃣: Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Select `Harmonyweb.2` project
3. Settings → Environment Variables
4. Add these 7 variables:

```
RESEND_API_KEY=re_your_key_from_step_1
HRH_AUTH_PASSWORD=pick_a_strong_password
HRH_ALLOWED_USERS=admin@harmonyresourcehub.ca,your_email@example.com
HRH_TO_EMAIL=admin@harmonyresourcehub.ca
HRH_FROM_EMAIL=Harmony Resource Hub <admin@harmonyresourcehub.ca>
HRH_SITE_URL=https://www.harmonyresourcehub.ca
HRH_ALLOWED_ORIGINS=https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca
```

5. Click Save
6. Go to Deployments → Latest → Click "Redeploy"

### Step 4️⃣: Test the System

**Test 1: Registration**
1. Open: https://www.harmonyresourcehub.ca/signin.html
2. Click "Request account"
3. Fill form with test data
4. Click "Register"
5. ✅ Should see: "Registration request received"
6. Check email inbox for approval request

**Test 2: Approval**
1. Check email at admin@harmonyresourcehub.ca
2. Click "Approve" button
3. ✅ Should see green checkmark page

**Test 3: Login**
1. Open: https://www.harmonyresourcehub.ca/signin.html
2. Click "Sign in"
3. Use email from `HRH_ALLOWED_USERS`
4. Use password from `HRH_AUTH_PASSWORD`
5. ✅ Should see portal with 6 features

---

## 📚 Full Documentation

- **[CRITICAL_SETUP.md](CRITICAL_SETUP.md)** - Detailed checklist with troubleshooting
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Complete technical guide
- **[verify-setup.sh](verify-setup.sh)** - Automated verification script

## 🔧 Run Verification

After setting up environment variables locally:

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your values
nano .env.local

# Verify setup
bash verify-setup.sh
```

Expected output: All ✓ green checks

## 🎯 What You Get After Setup

- ✅ User registration with approval workflow
- ✅ Personalized client portal with 6 features
- ✅ Automated approval emails
- ✅ Session-based authentication
- ✅ Responsive design (mobile, tablet, desktop)

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| Emails not arriving | Domain not verified in Resend |
| Emails going to spam | Add DNS records from Resend to your registrar |
| Login fails | Check HRH_ALLOWED_USERS and HRH_AUTH_PASSWORD |
| "Authentication not configured" | Set environment variables in Vercel |
| Approval link "content blocked" | Clear cache, check HRH_SITE_URL matches |

## 📞 Next Steps

1. ✅ Create Resend account
2. ✅ Verify domain (https://resend.com/domains)
3. ✅ Set environment variables in Vercel
4. ✅ Redeploy
5. ✅ Test registration → approval → login
6. ✅ Done!

**Questions?** Check [CRITICAL_SETUP.md](CRITICAL_SETUP.md) or [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
