# Resend Domain Verification - Step-by-Step Guide

## Why This Matters

Without verifying your domain in Resend:
- ❌ Emails may go to spam
- ❌ Emails may not deliver at all
- ❌ Your sender reputation gets damaged
- ❌ Your account may get blocked

With verification:
- ✅ Emails arrive in inbox
- ✅ Professional sender reputation
- ✅ Better deliverability rates

---

## Quick Start (5 Steps)

### 1. Add Domain to Resend
1. Go to https://resend.com/dashboard
2. Click **Domains** (left sidebar)
3. Click **Add Domain**
4. Type: `harmonyresourcehub.ca`
5. Click **Add**

### 2. Get DNS Records from Resend
Resend will show 3 records:
```
Type: CNAME
Name: default._domainkey.harmonyresourcehub.ca
Value: [something-long].dkim.resend.domains

Type: TXT
Name: @
Value: v=spf1 include:sendingdomain.resend.domains ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:postmaster@harmonyresourcehub.ca
```

Copy these exactly!

### 3. Add Records to Your Domain Registrar

**If you use GoDaddy:**
1. Log in to GoDaddy.com
2. Find **My Products** → **Domain Manager**
3. Select `harmonyresourcehub.ca`
4. Click **Manage DNS**
5. Scroll to **DNS Records**
6. For each record from Resend:
   - Click **Add Record**
   - Select the correct **Type** (CNAME or TXT)
   - Enter the **Name** and **Value** from Resend
   - Click **Save**

**If you use Namecheap:**
1. Log in to Namecheap.com
2. Go to **Domain List**
3. Click **Manage** on `harmonyresourcehub.ca`
4. Click **Advanced DNS**
5. For each record from Resend:
   - Click **Add Record**
   - Select **Type** from dropdown
   - Enter **Host** (the Name field)
   - Enter **Value**
   - Click **Save**

**If you use another registrar:**
1. Find the DNS management section
2. Look for "DNS Records" or "Advanced DNS"
3. Add CNAME and TXT records
4. The process is similar across all registrars

### 4. Wait for DNS Propagation
- Usually: **5-10 minutes**
- Maximum: **24-48 hours**
- Check status: https://mxtoolbox.com/ (enter your domain)

### 5. Verify in Resend
1. Go back to Resend: https://resend.com/dashboard
2. Click **Domains**
3. Find `harmonyresourcehub.ca`
4. Click **Verify** button
5. Resend will check DNS records
6. ✅ When verified, status changes to **Verified**

---

## What You Can Send After Verification

Once verified, you can send from:

```
FROM email = "Harmony Resource Hub <admin@harmonyresourcehub.ca>"
FROM email = "Harmony Resource Hub <noreply@harmonyresourcehub.ca>"
FROM email = "Support <support@harmonyresourcehub.ca>"
FROM email = "Any Name <any-name@harmonyresourcehub.ca>"
```

**Do NOT send from:**
```
❌ onboarding@resend.dev (unless testing)
❌ unverified@otherdomain.com
❌ fake@fakeemail.com
```

---

## Current Configuration

Your app is set to use:
```
HRH_FROM_EMAIL = Harmony Resource Hub <admin@harmonyresourcehub.ca>
```

This means:
- **Sender Name:** Harmony Resource Hub
- **Sender Email:** admin@harmonyresourcehub.ca

⚠️ This email MUST be verified in Resend for emails to work!

---

## Testing After Verification

### Test 1: Send via Resend Dashboard
1. Go to https://resend.com/dashboard
2. Click **Emails**
3. Click **Send Test Email**
4. Fill form:
   - To: `your@email.com`
   - From: `admin@harmonyresourcehub.ca`
   - Subject: Test Email
5. Click **Send**
6. Check your inbox for delivery

### Test 2: Use Your App
1. Deploy to Vercel with RESEND_API_KEY set
2. Open: https://www.harmonyresourcehub.ca/signin.html
3. Register a test account
4. Check if approval email arrives

### Test 3: Check Email Headers
If emails arrive, check they have:
- ✅ SPF: PASS
- ✅ DKIM: PASS
- ✅ DMARC: PASS

Use: https://www.mail-tester.com/

---

## Common Issues & Solutions

### "Domain not verified" error when sending
**Solution:**
1. Wait 5-30 minutes for DNS propagation
2. Check DNS records are correct in your registrar
3. Click "Verify" again in Resend
4. If still failing, delete and re-add domain in Resend

### Emails go to spam
**Solution:**
1. Make sure domain is verified (status = Verified)
2. Add all DNS records (SPF, DKIM, DMARC)
3. Wait 24 hours for reputation to improve
4. Test with: https://www.mail-tester.com/

### Only test emails work, production doesn't
**Solution:**
1. Ensure FROM email matches verified domain
2. Check HRH_FROM_EMAIL in environment variables
3. Verify domain matches what's in Resend
4. Check RESEND_API_KEY is correct

### "Invalid API key" error
**Solution:**
1. Go to https://resend.com/api-keys
2. Generate new API key
3. Copy entire key (starts with `re_`)
4. Update RESEND_API_KEY in Vercel
5. Redeploy

---

## DNS Record Explanation

**SPF Record** (Sender Policy Framework)
- Tells email providers: "Only Resend can send from my domain"
- Prevents email spoofing

**DKIM Record** (DomainKeys Identified Mail)
- Digitally signs emails from your domain
- Proves authenticity

**DMARC Record** (Domain-based Message Authentication)
- Sets policy for emails that fail DKIM/SPF
- Quarantine or reject failures

All three together = best email reputation

---

## After Everything is Verified

Your setup:
```
✅ Domain: harmonyresourcehub.ca (verified in Resend)
✅ API Key: re_xxxxx (set in Vercel)
✅ FROM Email: admin@harmonyresourcehub.ca (matches verified domain)
✅ DNS Records: SPF, DKIM, DMARC (added to registrar)

Result:
✅ Registration emails → Approved emails → User receives
✅ Approval notifications → Approved/rejected user emails
✅ All emails arrive in inbox (not spam)
✅ Your domain has good reputation
```

---

## Quick Checklist

- [ ] Create Resend account
- [ ] Create API key at https://resend.com/api-keys
- [ ] Go to https://resend.com/domains
- [ ] Add domain: harmonyresourcehub.ca
- [ ] Copy DNS records from Resend
- [ ] Add DNS records to your registrar
- [ ] Wait 5-30 minutes
- [ ] Click "Verify" in Resend
- [ ] See status: "Verified" ✅
- [ ] Set RESEND_API_KEY in Vercel
- [ ] Set HRH_FROM_EMAIL to use verified domain
- [ ] Redeploy to Vercel
- [ ] Test sending email
- [ ] Check email arrives in inbox

✅ All done! Authentication ready to use.
