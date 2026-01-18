# How the Client Portal Works

## What is the Client Portal?

The **Client Portal** is a secure dashboard where clients can:
- Upload documents for their applications
- Check the status of their requests
- Message the support team
- View invoices and payment history
- Manage their account settings

## How to Access the Portal

### Step 1: Sign In
1. Go to https://www.harmonyresourcehub.ca/signin.html
2. Enter your email and password
3. Click "Sign in"

**Expected result:** You'll see "Sign-in successful! Redirecting to portal..." and be taken to `/portal/`

### Step 2: Explore the Portal

Once logged in, you'll see the portal dashboard with access to:

#### 📤 My Uploads
- Upload documents for your applications
- Drag and drop files or click "Choose files"
- Supported formats: PDF, JPG, PNG, DOCX
- Max 10 MB per file

#### 💬 My Messages
- View messages from the support team
- Secure communication channel
- Stay updated on your applications

#### 💰 My Payments
- View invoices and payment history
- See payment status
- Download receipts

#### ➕ New Application
- Start a new service request
- Choose the service type
- Submit application details

#### 💳 Make Payment
- Pay for services securely
- Multiple payment methods available
- Instant confirmation

#### ⚙️ Account Settings
- Update your profile information
- Change your password
- Manage preferences

## Important: Setting Up Authentication

For the sign-in system to work, the admin must:

1. **Set environment variables on Vercel:**
   - Go to https://vercel.com/dashboard
   - Select the Harmonyweb.2 project
   - Settings → Environment Variables
   - Add `HRH_AUTH_PASSWORD` (master password)
   - Add `HRH_ALLOWED_USERS` (comma-separated email list)

2. **Redeploy the project** after setting variables

3. **Share credentials with clients:**
   - Email: Must be in `HRH_ALLOWED_USERS`
   - Password: The `HRH_AUTH_PASSWORD` value

## Sign In Troubleshooting

### "Sign-in does nothing"
- Check browser console (F12) for errors
- Verify environment variables are set on Vercel
- Ensure email is in `HRH_ALLOWED_USERS` list
- Try a different browser

### "Invalid credentials"
- Double-check the email spelling
- Verify the password matches `HRH_AUTH_PASSWORD`
- Make sure email is in `HRH_ALLOWED_USERS` (not typos)

### "I'm logged out / session expired"
- The session is stored locally in your browser
- Logging out clears the session
- You can sign in again anytime

## What Happens After Sign In?

1. **Session is created:** Your login is stored in browser's localStorage
2. **Portal unlocks:** The auth gate disappears
3. **Dashboard loads:** You see all portal features
4. **Welcome message:** Shows your email in the header

## Portal Storage

The portal stores session data locally:
- `hrh_auth_token` - Your authentication token
- `hrh_auth_session` - Session flag
- `hrh_auth_email` - Your email address

**Note:** This data is stored in your browser and cleared when you:
- Click "Sign out"
- Clear browser cookies/localStorage
- Switch browsers

## Security Notes

✓ Passwords are checked server-side
✓ Tokens are validated on the server
✓ Files are stored securely
✓ Communication is encrypted (HTTPS)

## Need Help?

If you have issues accessing the portal:

1. **Check the [LOGIN_TROUBLESHOOTING.md](LOGIN_TROUBLESHOOTING.md) guide**
2. **Open browser console (F12) and check for errors**
3. **Contact admin at:** admin@harmonyresourcehub.ca

## Admin: Enable Clients to Sign In

### Quick Setup:

```
HRH_AUTH_PASSWORD: SecurePass123!
HRH_ALLOWED_USERS: client1@example.com,client2@example.com
```

### Then:
1. Redeploy on Vercel
2. Share credentials with your clients
3. Clients can now access `/signin.html` and `/portal/`

---

**Current Status:** Portal is fully built and ready to use once environment variables are configured.
