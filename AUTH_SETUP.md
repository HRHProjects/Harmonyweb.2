# Authentication & Account Approval Setup

## Overview

The Harmony Resource Hub uses a multi-step account approval workflow:

1. **User Registration** - User submits account request at `/signin.html`
2. **Admin Email** - Registration details sent to `admin@harmonyresourcehub.ca` with approval link
3. **Admin Approval** - Admin clicks approval link in email or uses API
4. **User Notification** - User receives approval email and can sign in

## Environment Variables

Set these in your Vercel or hosting environment:

### Required
- `RESEND_API_KEY` - Resend.com API key for sending emails

### Optional
- `HRH_TO_EMAIL` - Admin email (default: `admin@harmonyresourcehub.ca`)
- `HRH_FROM_EMAIL` - Sender email (default: `"Harmony Resource Hub <onboarding@resend.dev>"`)
- `HRH_ADMIN_EMAIL` - Confirmation email for admin approvals
- `HRH_SITE_URL` - Your site URL (default: `https://www.harmonyresourcehub.ca`)
- `HRH_ALLOWED_ORIGINS` - CORS origins (comma-separated)
- `HRH_AUTH_PASSWORD` - Password for login (temporary until full auth is setup)
- `HRH_ALLOWED_USERS` - Comma-separated list of allowed email addresses
- `HRH_AUTH_EMAIL` - Single allowed email address

## API Endpoints

### POST /api/auth/register
Register a new account request.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "pending": true,
  "message": "Account request submitted. Check your email for confirmation..."
}
```

### GET /api/auth/approve?token=XXX&email=user@example.com&action=approve
Approve an account via approval link (from email).

**Query Parameters:**
- `token` - Approval token from registration
- `email` - User's email address
- `action` - "approve" or "reject" (default: approve)

**Response:**
```json
{
  "ok": true,
  "approved": true,
  "message": "Account user@example.com has been approved. User notified via email."
}
```

### POST /api/auth/verify
Check if a registered account has been approved.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (Approved):**
```json
{
  "ok": true,
  "approved": true,
  "pending": false,
  "message": "Your account has been approved! Check your email for sign-in instructions.",
  "approvedAt": "2026-01-14T10:30:00Z"
}
```

**Response (Pending):**
```json
{
  "ok": true,
  "approved": false,
  "pending": true,
  "message": "Your account request is pending review."
}
```

### POST /api/auth/login
Sign in with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "ok": true,
  "token": "base64encodedtoken",
  "email": "john@example.com",
  "expiresIn": 28800
}
```

## Approval Workflow

### Step 1: User Registers
User fills out form at `signin.html#register` and submits.

### Step 2: Admin Receives Email
Admin receives email at `admin@harmonyresourcehub.ca` with:
- User's full name, email, phone
- **Green "Approve Account" button** (links to `/api/auth/approve`)
- Alternative curl command for terminal approval

### Step 3: Admin Approves
Admin clicks the approval button in the email. The endpoint:
- Marks account as approved in database
- Sends approval email to user
- User can now sign in

## Frontend Integration

The signup form at `/signin.html`:
- Validates input before submission
- Shows "Submitting request..." during processing
- Displays confirmation message on success
- Allows users to check approval status

## Database Schema (Planned)

When connecting to a real database, use this schema:

```sql
CREATE TABLE account_requests (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40),
  created_at TIMESTAMP DEFAULT NOW(),
  approval_token VARCHAR(32),
  token_expires_at TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  password_hash VARCHAR(255)
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120),
  phone VARCHAR(40),
  approved_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Production Checklist

- [ ] Set `RESEND_API_KEY` environment variable
- [ ] Set `HRH_AUTH_PASSWORD` and `HRH_ALLOWED_USERS` for login
- [ ] Replace in-memory storage with database (Postgres, MongoDB, etc.)
- [ ] Add HTTPS-only cookies for auth tokens
- [ ] Implement password hashing (bcrypt)
- [ ] Add token expiration and refresh logic
- [ ] Setup email templates in Resend
- [ ] Configure CORS properly for your domain
- [ ] Add rate limiting headers
- [ ] Setup monitoring for auth failures
- [ ] Audit approval tokens for security

## Testing

### Test Registration (curl)
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "555-1234",
    "password": "testpassword123"
  }'
```

### Test Approval (curl)
```bash
curl -X GET "https://your-domain.com/api/auth/approve?token=APPROVAL_TOKEN&email=test@example.com&action=approve"
```

### Test Verification (curl)
```bash
curl -X POST https://your-domain.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Security Notes

1. **Approval Tokens** - Currently 32-character random strings. Should be validated against DB in production.
2. **Password Storage** - Currently not stored. Implement bcrypt hashing for production.
3. **Rate Limiting** - Basic IP-based rate limiting implemented.
4. **CORS** - Configured with allowed origins. Ensure your domain is whitelisted.
5. **Email Validation** - Simple regex validation. Consider more robust validation for production.

## Troubleshooting

### "Email provider error"
- Check `RESEND_API_KEY` is set correctly
- Verify email format in Resend dashboard

### "Too many requests"
- Rate limit triggered. Wait before retrying.
- Check your IP-based rate limit configuration.

### "Authentication is not configured yet"
- Set `HRH_AUTH_PASSWORD` and `HRH_ALLOWED_USERS` environment variables

### Approval email not received
- Check spam/junk folder
- Verify admin email in `HRH_TO_EMAIL`
- Check Resend dashboard for delivery logs

## Next Steps

1. **Database Integration** - Connect to Postgres/MongoDB for persistent storage
2. **Password Hashing** - Implement bcrypt or Argon2
3. **Token Management** - Add JWT or session-based authentication
4. **Email Templates** - Design custom email templates in Resend
5. **Admin Dashboard** - Build interface to view and approve/reject requests
6. **2FA** - Add two-factor authentication
