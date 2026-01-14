# System Architecture Overview

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    HARMONY RESOURCE HUB                         │
│                   Authentication System Flow                    │
└─────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ┌──────────────────────┐
   │  signin.html         │
   │  [Request Account]   │
   └──────────┬───────────┘
              │ (email, name, phone, address)
              ▼
   ┌──────────────────────────────────────┐
   │  POST /api/auth/register             │
   │  - Validate input                    │
   │  - Rate limit (6 per 10 min)        │
   │  - Generate approval token          │
   └──────────┬───────────────────────────┘
              │ (email + approval token)
              ▼
   ┌──────────────────────────────────────┐
   │  RESEND (Email Service)              │
   │  - Send approval request             │
   │  - To: admin@harmonyresourcehub.ca   │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  Admin Email         │
   │  [Approve/Reject]    │
   └──────────────────────┘

2. ADMIN APPROVAL
   ┌──────────────────────┐
   │  Admin Email Link    │
   │  Click "Approve" btn │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │  GET /api/auth/approve               │
   │  ?token=XXX&email=user@...&action=approve
   │  - Validate token                    │
   │  - Store approval in memory          │
   │  - Send approval email to user       │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  HTML Success Page   │
   │  ✅ Account Approved │
   └──────────────────────┘

3. USER LOGIN
   ┌──────────────────────┐
   │  signin.html         │
   │  [Sign in tab]       │
   └──────────┬───────────┘
              │ (email, password)
              ▼
   ┌──────────────────────────────────────┐
   │  POST /api/auth/login                │
   │  - Check HRH_ALLOWED_USERS          │
   │  - Verify password                   │
   │  - Generate session token            │
   └──────────┬───────────────────────────┘
              │ (session token)
              ▼
   ┌──────────────────────────────────────┐
   │  Browser localStorage                │
   │  .setItem('hrh_token', token)        │
   └──────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  portal/index.html   │
   │  6 Features Ready    │
   └──────────────────────┘

4. PERSISTENT LOGIN
   User returns to site
        │
        ▼
   Check localStorage for token
        │
        ├─ Token found ──→ Load portal automatically
        │
        └─ No token ────→ Show signin page
```

## System Components

```
FRONTEND (User-Facing)
├── index.html              (Home page)
├── signin.html             (Sign in / Register)
├── services.html           (Services page)
├── booking.html            (Booking page)
├── contact.html            (Contact page)
├── privacy.html            (Privacy policy)
├── terms.html              (Terms of service)
├── styles.css              (Responsive design)
├── app.js                  (Form validation & API calls)
└── portal/
    └── index.html          (Personalized dashboard - 6 features)

BACKEND (Vercel Serverless)
├── api/
│   ├── appointments.js     (Booking API)
│   ├── contact.js          (Contact form API)
│   └── auth/
│       ├── register.js     (POST - User registration)
│       ├── login.js        (POST - User authentication)
│       ├── approve.js      (GET/POST - Admin approval)
│       └── verify.js       (GET - Check approval status)
│
└── EXTERNAL SERVICES
    ├── Resend API          (Email delivery)
    └── Vercel              (Hosting & serverless)

PERSISTENT STATE
└── globalThis (Memory)
    ├── Rate limiting state (IP-based)
    ├── Approved accounts   (email → approval status)
    └── Session tokens     (token → user data)

NOTE: State resets on redeploy. Use database for production.
```

## Data Flow

### Registration Request
```
User Form
    │
    ├─ email (required)
    ├─ name (required)
    ├─ phone (optional)
    └─ address (optional)
         │
         ▼
    Validation
    ├─ Email format check
    ├─ Rate limit check (6 per 10 min)
    └─ Required fields check
         │
         ▼
    Generate Approval Token (32 random chars)
         │
         ▼
    Store in memory: email → { token, timestamp }
         │
         ▼
    Send Email via Resend
    ├─ To: admin@harmonyresourcehub.ca
    ├─ From: admin@harmonyresourcehub.ca
    ├─ Subject: New Account Request
    └─ Body: HTML with user details + Approve/Reject buttons
```

### Approval Response
```
Admin clicks "Approve" in email
    │
    ├─ Browser makes GET request
    ├─ Validate token & email
    │
    ▼
Store Approval: email → { approved: true, timestamp }
    │
    ▼
Send Approval Email to User
├─ To: user@example.com
├─ From: admin@harmonyresourcehub.ca
└─ Subject: Your Account Has Been Approved!
    │
    ▼
Render HTML Page: Green Checkmark ✅
```

### Login Flow
```
User submits credentials
    │
    ├─ Email (required, must be in HRH_ALLOWED_USERS)
    └─ Password (required, must match HRH_AUTH_PASSWORD)
         │
         ▼
    Validation
    ├─ Email exists in HRH_ALLOWED_USERS
    ├─ Password matches HRH_AUTH_PASSWORD
    └─ Rate limit check (10 per 10 min)
         │
         ▼
    Generate Session Token
    ├─ Format: base64(email:timestamp:random)
    └─ Store in memory for future validation
         │
         ▼
    Return Token + Redirect URL
         │
         ▼
    Browser stores token in localStorage
         │
         ▼
    Redirect to portal/index.html
```

## Environment Configuration

```
ENVIRONMENT VARIABLES (Set in Vercel)
├─ RESEND_API_KEY
│  └─ Get from: https://resend.com/api-keys
│  └─ Format: re_xxxxxxxxxxxxxxxxxx
│
├─ HRH_AUTH_PASSWORD
│  └─ Login password for authenticated users
│  └─ Example: MySecure123Pass!
│
├─ HRH_ALLOWED_USERS
│  └─ Comma-separated emails allowed to login
│  └─ Example: admin@example.com,user@example.com
│
├─ HRH_TO_EMAIL
│  └─ Where approval requests are sent
│  └─ Default: admin@harmonyresourcehub.ca
│
├─ HRH_FROM_EMAIL
│  └─ Sender email (must be verified domain)
│  └─ Example: Harmony Resource Hub <admin@harmonyresourcehub.ca>
│
├─ HRH_SITE_URL
│  └─ Your website URL for approval links
│  └─ Example: https://www.harmonyresourcehub.ca
│
└─ HRH_ALLOWED_ORIGINS
   └─ CORS allowed domains
   └─ Example: https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca
```

## Email Templates

```
REGISTRATION APPROVAL EMAIL (Sent to Admin)
├─ From: admin@harmonyresourcehub.ca
├─ To: admin@harmonyresourcehub.ca
├─ Subject: New Account Request
└─ Contains:
   ├─ User details (name, email, phone, address)
   ├─ Approval Button (click → approve account)
   └─ Rejection Button (click → reject account)

APPROVAL CONFIRMATION EMAIL (Sent to User)
├─ From: admin@harmonyresourcehub.ca
├─ To: user@example.com
├─ Subject: Your Account Has Been Approved!
└─ Contains:
   ├─ Green checkmark icon
   ├─ Login link
   └─ Next steps list

REJECTION EMAIL (Sent to User)
├─ From: admin@harmonyresourcehub.ca
├─ To: user@example.com
├─ Subject: Update on Your Application
└─ Contains:
   ├─ Amber warning icon
   └─ Contact support link
```

## Rate Limiting

```
ENDPOINT           LIMIT            WINDOW
─────────────────────────────────────────────
/api/auth/register  6 requests      10 minutes (per IP)
/api/auth/login     10 requests     10 minutes (per IP)
/api/auth/approve   20 requests     1 minute (per IP)
/api/auth/verify    30 requests     10 minutes (per IP)
```

## Database Schema (Future Implementation)

```
USERS TABLE
├─ id (primary key)
├─ email (unique)
├─ name
├─ phone
├─ address
├─ registration_token (unique)
├─ approval_status ('pending', 'approved', 'rejected')
├─ approved_at (timestamp)
├─ created_at (timestamp)
└─ updated_at (timestamp)

SESSIONS TABLE
├─ id (primary key)
├─ token (unique)
├─ user_id (foreign key → USERS)
├─ expires_at (timestamp)
├─ created_at (timestamp)
└─ ip_address

EMAIL_LOGS TABLE
├─ id (primary key)
├─ type ('registration', 'approval', 'rejection')
├─ to_email
├─ from_email
├─ subject
├─ sent_at (timestamp)
└─ resend_id
```

## Security Considerations

```
✅ IMPLEMENTED
├─ Rate limiting per IP
├─ Input validation (email, length checks)
├─ CORS protection
├─ Session tokens (base64 encoded)
├─ Environment variables for secrets
└─ Password stored only in env (hashed on production DB)

⚠️ BEFORE PRODUCTION
├─ Replace in-memory state with database
├─ Add password hashing (bcrypt)
├─ Implement HTTPS only (already in Vercel)
├─ Add email verification (verify email ownership)
├─ Add session expiration
├─ Add login attempt logging
├─ Add admin activity logging
└─ Use database transactions
```

## Performance Notes

```
RESPONSE TIMES (Expected)
├─ /api/auth/register    → 500-2000ms (email send)
├─ /api/auth/login       → 100-200ms (memory lookup)
├─ /api/auth/approve     → 500-1500ms (email send)
└─ /api/auth/verify      → 50-100ms (memory lookup)

SCALABILITY
├─ Current: Works fine for <1000 users/day
├─ Limitation: In-memory state (resets on deploy)
├─ Solution: Add database (MongoDB, PostgreSQL, etc.)
├─ Max concurrent: Limited by Vercel tier
└─ Recommend: Database after 100 users
```

## Deployment Checklist

```
BEFORE DEPLOY TO VERCEL
├─ [ ] Create Resend account
├─ [ ] Get RESEND_API_KEY
├─ [ ] Verify domain in Resend
├─ [ ] Add all 7 environment variables
├─ [ ] Test locally (if possible)
├─ [ ] Push code to GitHub
└─ [ ] Redeploy on Vercel

AFTER DEPLOY
├─ [ ] Test registration endpoint
├─ [ ] Test approval email delivery
├─ [ ] Test approval button click
├─ [ ] Test login endpoint
├─ [ ] Test portal access
├─ [ ] Monitor Vercel logs
└─ [ ] Check Resend email logs
```

## Support & Troubleshooting

```
COMMON ERRORS
├─ "RESEND_API_KEY not set"
│  └─ Solution: Add to Vercel environment variables
│
├─ "Email could not be sent"
│  └─ Solution: Check API key, verify domain in Resend
│
├─ "Invalid credentials"
│  └─ Solution: Check HRH_ALLOWED_USERS, HRH_AUTH_PASSWORD
│
├─ "Rate limited"
│  └─ Solution: Wait 10 minutes, try again
│
└─ "CORS error"
   └─ Solution: Check HRH_ALLOWED_ORIGINS includes your domain

DEBUGGING TOOLS
├─ Vercel Dashboard: Check server logs
├─ Resend Dashboard: Check email logs
├─ Browser Console: Check API responses
└─ Network Tab: Inspect requests/responses
```
