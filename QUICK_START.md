# ⚡ Quick Start Guide for Vercel Deployment

## 1️⃣ Set Environment Variables in Vercel

Go to: **Project Settings → Environment Variables**

Add these variables:

```
RESEND_API_KEY = [Get from https://resend.com/api-keys]
HRH_AUTH_PASSWORD = testpassword123
HRH_ALLOWED_USERS = test@example.com,admin@harmonyresourcehub.ca
HRH_TO_EMAIL = admin@harmonyresourcehub.ca
HRH_FROM_EMAIL = Harmony Resource Hub <onboarding@resend.dev>
HRH_SITE_URL = https://www.harmonyresourcehub.ca
```

⏱️ **Time:** 2 minutes

---

## 2️⃣ Test the Approval Link

Once deployed, test that approval link works:

1. Register a test account at `/signin.html#register`
2. Check email at admin@harmonyresourcehub.ca for approval request
3. Click the "Approve Account" button
4. Should see success page with sign-in button

✅ **If this works, your authentication is configured correctly!**

---

## 3️⃣ Sign In & Access Portal

1. Go to `/signin.html`
2. Sign in with test email and password
3. Should redirect to `/portal/`
4. See "Welcome back!" message and dashboard

✅ **If portal appears, full system is working!**

---

## 4️⃣ What's Deployed Now

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/auth/register` | User registration | ✅ Ready |
| `/api/auth/login` | User login | ✅ Ready |
| `/api/auth/approve` | Admin approval | ✅ Ready |
| `/api/auth/verify` | Check status | ✅ Ready |
| `/signin.html` | Sign in/up page | ✅ Ready |
| `/portal/` | Client dashboard | ✅ Ready |

---

## 5️⃣ Portal Features Ready to Use

- ✅ **My Uploads** - Upload area ready for file backend
- ✅ **My Messages** - UI ready for messaging backend
- ✅ **My Payments** - Invoice display area ready
- ✅ **New Application** - Service selector ready
- ✅ **Make Payment** - Payment form ready
- ✅ **Account Settings** - Security settings UI ready

---

## 🔄 Current Authentication Flow

```
User Registration (form)
    ↓
Admin Email (with approval button)
    ↓
Admin Clicks Approval (renders HTML success)
    ↓
User Gets Approval Email
    ↓
User Signs In (creates session token)
    ↓
Portal Access (personalized dashboard)
```

---

## 📧 Admin Approval Email

The approval email sent to `admin@harmonyresourcehub.ca` contains:

- Registrant name, email, phone
- Green "Approve Account" button (click to approve)
- User registration details
- Security notes

---

## 🛠️ If Something Goes Wrong

### Registration email not received by admin
- Check Resend API key is correct
- Check email address in `HRH_TO_EMAIL` is right
- Check Resend dashboard for delivery logs

### Approval link shows error "blocked content"
- ✅ **FIXED** - Now renders proper HTML success page
- Click link should show green success message

### Login fails with "not configured"
- Add `HRH_AUTH_PASSWORD` to environment variables
- Add `HRH_ALLOWED_USERS` to environment variables
- Redeploy after adding variables

### Portal shows "Access required"
- Make sure you're logged in (check localStorage)
- Try signing in again at `/signin.html`
- Check browser console for errors

---

## 📊 Test Credentials (for testing)

```
Email: test@example.com
Password: testpassword123
```

These are configured in `HRH_ALLOWED_USERS` environment variable.

---

## 🔗 Important URLs

- **Sign In/Up:** `https://your-domain/signin.html`
- **Portal:** `https://your-domain/portal/`
- **Admin Approval:** In email (approval link)

---

## 📚 Documentation Files

- `AUTH_SETUP.md` - Detailed auth configuration
- `DEPLOYMENT_GUIDE.md` - Vercel deployment steps
- `CLIENT_PORTAL_GUIDE.md` - User feature documentation
- `IMPLEMENTATION_COMPLETE.md` - Full implementation summary

---

## ✨ What's Next?

### To enable more features:

1. **File Uploads** - Connect to S3 or Cloudinary
2. **Messages** - Add database for messaging
3. **Payments** - Integrate Stripe for payments
4. **Admin Dashboard** - Build approval interface
5. **Database** - Replace in-memory storage with Postgres

See `IMPLEMENTATION_COMPLETE.md` for detailed next steps.

---

## 📞 Quick Reference

**Site:** https://www.harmonyresourcehub.ca
**Email:** admin@harmonyresourcehub.ca
**Phone:** 780-531-4294

---

## ✅ Deployment Checklist

- [ ] Resend API key added to Vercel
- [ ] Authentication password set
- [ ] Allowed users configured
- [ ] Email address configured
- [ ] Site URL set correctly
- [ ] Registration email sends successfully
- [ ] Approval link renders success page
- [ ] User can sign in
- [ ] Portal displays properly
- [ ] All 6 features visible

Once all checked, you're **LIVE**! 🚀

---

**Ready to deploy? Push to Vercel and check your dashboard!**
