# Harmony Resource Hub (static multi-page site)

**🚀 Quick Start:** `npm run setup` - Automated setup, configuration, and deployment!

📚 **[Complete Automation Guide](AUTOMATION_GUIDE.md)** | 🧪 **[Testing Guide](TESTING_GUIDE.md)** | 🔐 **[Real Working Auth System](REAL_WORKING_AUTH.md)** | ⚡ **[10-Min Setup](AUTH_SETUP_10MIN.md)**

> 🎯 **Want working authentication?** Read [AUTH_SETUP_10MIN.md](AUTH_SETUP_10MIN.md) - open registration with email verification!

## Pages
- index.html (Home)
- services.html (Services + pricing)
- booking.html (Appointment request)
- contact.html (Contact + map)
- signin.html (Placeholder for future client accounts)
- privacy.html (Privacy Policy — legal name used)
- terms.html (Terms of Service — legal name used, includes not-a-lawyer/not-an-immigration-consultant text)

## Contact details (single source of truth)
Edit: `config.js`

## Appointment request (backend-ready)
The booking and contact forms POST JSON to endpoints configured in `config.js`:
- `BOOKING_ENDPOINT`
- `CONTACT_ENDPOINT`

If the POST fails (or you haven't connected endpoints yet), the forms fall back to opening the user's email app with a pre-filled draft to:
`admin@harmonyresourcehub.ca`

## Vercel + Resend (email delivery)

**Automated Setup:** Run `npm run setup` for complete configuration!

Serverless functions are located at:
- `api/appointments.js`
- `api/contact.js`
- `api/auth/register.js` (account request intake)
- `api/auth/login.js` (minimal login placeholder)

Set these Environment Variables in Vercel (Project -> Settings -> Environment Variables):
- `RESEND_API_KEY` (required)
- `HRH_FROM_EMAIL` (e.g. `Harmony Resource Hub <no-reply@harmonyresourcehub.ca>`)
- `HRH_TO_EMAIL` (optional, defaults to admin@harmonyresourcehub.ca)
- `HRH_ALLOWED_ORIGINS` (optional, comma-separated origins)
- `HRH_SUBJECT_PREFIX` (optional)

Auth placeholder variables (for `api/auth/login.js`):
- `HRH_AUTH_PASSWORD` (required for login)
- `HRH_ALLOWED_USERS` (optional, comma-separated allowlist)
- `HRH_AUTH_EMAIL` (optional, single allowed email)

If the site is hosted on GitHub Pages and the API is on Vercel, set `API_BASE_URL` in `config.js` to your Vercel deployment URL (example: `https://your-project.vercel.app`).

## Available Scripts

### Quick Commands
- `npm run setup` - Complete automated setup (recommended)
- `npm run deploy` - Automated deployment with validation
- `npm test` - Run comprehensive test suite (168 tests)
- `npm run validate` - Validate configuration

### All Scripts
See [AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md) for complete documentation.

| Command | Description |
|---------|-------------|
| `npm run setup` | One-command complete setup |
| `npm run setup:env` | Configure environment variables |
| `npm run validate` | Validate configuration |
| `npm test` | Run test suite (148 tests) |
| `npm run test:integration` | Run integration tests (20 tests) |
| `npm run test:backend` | Test backend API endpoints |
| `npm run test:production` | Test production deployment |
| `npm run deploy` | Automated deployment |
| `npm run deploy:production` | Deploy to production |
| `npm run env:pull` | Download environment variables |
| `npm run logs` | View deployment logs |

## Open-source libraries (CDN)
- Tailwind CSS (UI)
- Leaflet + OpenStreetMap tiles (map)
- Flatpickr (date/time picker)

## GitHub Pages
Commit these files and enable GitHub Pages (Deploy from branch → root).
