# Backend Configuration Automation

This project includes automated scripts for complete backend setup, configuration, validation, and deployment.

## 🚀 Quick Start

Run the complete automated setup:

```bash
npm run setup
```

This single command will:
1. Configure environment variables
2. Validate configuration
3. Run tests
4. Deploy to Vercel

## 📝 Available Scripts

### Setup & Configuration

- **`npm run setup`** - Complete automated setup (recommended for first-time setup)
- **`npm run setup:env`** - Configure environment variables only
- **`npm run validate`** - Validate all configuration files

### Testing

- **`npm test`** - Run comprehensive test suite (148 tests)
- **`npm run test:integration`** - Run integration tests (20 tests)
- **`npm run test:backend`** - Test backend API endpoints
- **`npm run test:production`** - Test production deployment

### Deployment

- **`npm run deploy`** - Automated deployment with validation
- **`npm run deploy:production`** - Deploy directly to production
- **`npm run deploy:preview`** - Deploy to preview environment

### Environment Management

- **`npm run env:pull`** - Download environment variables from Vercel
- **`npm run env:list`** - List all environment variables
- **`npm run logs`** - View deployment logs

## 📁 Script Files

All automation scripts are located in the `scripts/` directory:

| Script | Description |
|--------|-------------|
| `quick-setup.sh` | One-command complete setup |
| `setup-env.sh` | Interactive environment configuration |
| `validate-config.sh` | Configuration validation |
| `deploy.sh` | Automated deployment with testing |
| `test-backend.sh` | Backend API testing |

## 🔧 Manual Script Execution

You can also run scripts directly:

```bash
# Setup
./scripts/quick-setup.sh

# Configure environment
./scripts/setup-env.sh

# Validate configuration
./scripts/validate-config.sh

# Deploy
./scripts/deploy.sh

# Test backend
./scripts/test-backend.sh [domain]
```

## ⚙️ Environment Variables

Required environment variables (configured automatically by setup script):

- `RESEND_API_KEY` - Email service API key
- `HRH_TO_EMAIL` - Admin email for form submissions
- `HRH_FROM_EMAIL` - Sender email address
- `HRH_AUTH_PASSWORD` - Authentication password
- `HRH_SITE_URL` - Site URL
- `HRH_ALLOWED_ORIGINS` - CORS allowed origins
- `HRH_SUBJECT_PREFIX` - Email subject prefix

Optional:
- `HRH_ALLOWED_USERS` - Comma-separated list of allowed user emails

## 🎯 Workflow Examples

### First-Time Setup

```bash
# Clone repository
git clone https://github.com/HRHProjects/Harmonyweb.2.git
cd Harmonyweb.2

# Install dependencies
npm install -g vercel

# Run complete setup
npm run setup
```

### Update Environment

```bash
# Reconfigure environment variables
npm run setup:env

# Validate changes
npm run validate

# Redeploy
npm run deploy
```

### Test Deployment

```bash
# Test all backend APIs
npm run test:backend

# Test production deployment
npm run test:production
```

### Deploy Changes

```bash
# Validate before deploy
npm run validate

# Run tests
npm test

# Deploy
npm run deploy
```

## 🔍 Configuration Validation

The validation script checks:

- ✅ Required files exist
- ✅ JavaScript syntax is valid
- ✅ JSON configuration is valid
- ✅ Environment variables are set
- ✅ Email formats are correct
- ✅ Git repository is configured

Run validation:
```bash
npm run validate
```

## 🧪 Testing

### Local Testing
```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration
```

### Backend API Testing
```bash
# Test production
npm run test:backend

# Test specific domain
./scripts/test-backend.sh your-domain.vercel.app
```

## 🚀 Deployment Process

The automated deployment script:

1. **Validates** configuration
2. **Runs** tests
3. **Commits** changes (optional)
4. **Deploys** to Vercel
5. **Tests** the deployment
6. **Reports** results

## 📊 Monitoring

View deployment logs:
```bash
npm run logs

# Or with Vercel CLI
vercel logs [deployment-url]
```

## 🔐 Security Notes

- **Never commit** `.env.local` to Git (automatically ignored)
- **Environment variables** are encrypted in Vercel
- **Secrets** are prompted securely (hidden input)
- **API keys** should be rotated regularly

## 🆘 Troubleshooting

### Environment variables not set
```bash
npm run setup:env
```

### Configuration errors
```bash
npm run validate
```

### Deployment fails
```bash
# Check logs
npm run logs

# Validate configuration
npm run validate

# Test locally
npm test
```

### Backend APIs not responding
```bash
# Test backend
npm run test:backend

# Check environment variables
npm run env:list
```

## 🔄 CI/CD Integration

For automated deployments, set environment variables in your CI/CD:

```bash
# GitHub Actions example
export RESEND_API_KEY="${{ secrets.RESEND_API_KEY }}"
export HRH_AUTH_PASSWORD="${{ secrets.HRH_AUTH_PASSWORD }}"
# ... other variables

# Run non-interactive setup
./scripts/setup-env.sh
./scripts/deploy.sh
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Testing Guide](TESTING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## ✅ Verification

After setup, verify everything works:

1. ✅ Environment configured: `npm run validate`
2. ✅ Tests passing: `npm test`
3. ✅ Backend responding: `npm run test:backend`
4. ✅ Deployment successful: Visit your Vercel URL

---

**Need Help?** Run `npm run setup` for guided setup.
