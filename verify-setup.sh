#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Harmony Resource Hub - Environment & Setup Verification"
echo "=========================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "   Create it by copying .env.local.example:"
    echo "   cp .env.local.example .env.local"
    echo ""
fi

# Check required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}✗ $1 - NOT SET${NC}"
        return 1
    else
        # Show first 10 chars + ...
        value="${!1}"
        if [ ${#value} -gt 20 ]; then
            value="${value:0:20}..."
        fi
        echo -e "${GREEN}✓ $1 = ${value}${NC}"
        return 0
    fi
}

echo "Checking environment variables:"
echo ""

failed=0

check_env_var "RESEND_API_KEY" || failed=1
check_env_var "HRH_AUTH_PASSWORD" || failed=1
check_env_var "HRH_ALLOWED_USERS" || failed=1
check_env_var "HRH_TO_EMAIL" || failed=1
check_env_var "HRH_FROM_EMAIL" || failed=1
check_env_var "HRH_SITE_URL" || failed=1

echo ""
echo "Checking API endpoints:"
echo ""

# Check if API files exist and are valid
check_js_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}✗ $1 - FILE NOT FOUND${NC}"
        return 1
    elif node -c "$1" 2>/dev/null; then
        echo -e "${GREEN}✓ $1 - Syntax OK${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 - SYNTAX ERROR${NC}"
        return 1
    fi
}

check_js_file "api/auth/register.js" || failed=1
check_js_file "api/auth/login.js" || failed=1
check_js_file "api/auth/approve.js" || failed=1
check_js_file "api/auth/verify.js" || failed=1

echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Vercel with environment variables"
    echo "2. Verify your domain in Resend (https://resend.com)"
    echo "3. Test registration → approval → login flow"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. See above for details.${NC}"
    echo ""
    echo "Fix the issues and try again, or run:"
    echo "  npm run setup-check    # Run this script again"
    exit 1
fi
