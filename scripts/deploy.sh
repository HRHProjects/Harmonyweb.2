#!/bin/bash
###############################################################################
# Automated Deployment Script
# Handles the complete deployment process to Vercel
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          Harmony Resource Hub - Automated Deployment         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Vercel${NC}"
    echo "Please log in:"
    vercel login
fi

# Validate configuration
echo -e "${BLUE}Step 1: Validating Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local found"
    source .env.local
else
    echo -e "${YELLOW}⚠${NC} .env.local not found"
    echo "Run: ./scripts/setup-env.sh to configure environment"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=("RESEND_API_KEY" "HRH_TO_EMAIL" "HRH_FROM_EMAIL" "HRH_AUTH_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing required variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Run: ./scripts/setup-env.sh to configure environment"
    exit 1
fi

echo -e "${GREEN}✓${NC} All required variables configured"

# Run tests
echo -e "\n${BLUE}Step 2: Running Tests${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "test-suite.js" ]; then
    echo "Running test suite..."
    if node test-suite.js; then
        echo -e "${GREEN}✓${NC} All tests passed"
    else
        echo -e "${RED}✗ Tests failed${NC}"
        echo "Fix the issues before deploying"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC} No test suite found, skipping tests"
fi

# Commit changes
echo -e "\n${BLUE}Step 3: Committing Changes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$(git status --porcelain)" ]; then
    echo "Uncommitted changes found"
    git status --short
    
    read -p "$(echo -e ${YELLOW}Commit changes before deploying? (y/n):${NC} )" commit
    if [ "$commit" = "y" ] || [ "$commit" = "Y" ]; then
        read -p "Commit message: " message
        git add .
        git commit -m "$message"
        git push origin main
        echo -e "${GREEN}✓${NC} Changes committed and pushed"
    fi
else
    echo -e "${GREEN}✓${NC} No uncommitted changes"
fi

# Deploy to Vercel
echo -e "\n${BLUE}Step 4: Deploying to Vercel${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "$(echo -e ${YELLOW}Deploy to production? (y/n):${NC} )" deploy

if [ "$deploy" != "y" ] && [ "$deploy" != "Y" ]; then
    echo "Deploying to preview instead..."
    DEPLOYMENT_URL=$(vercel --yes)
else
    echo "Deploying to production..."
    DEPLOYMENT_URL=$(vercel --prod --yes)
fi

echo -e "${GREEN}✓${NC} Deployment complete"

# Test the deployment
echo -e "\n${BLUE}Step 5: Testing Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract domain from deployment URL
DOMAIN=$(echo $DEPLOYMENT_URL | sed 's|https://||')

# Wait a few seconds for deployment to be ready
echo "Waiting for deployment to be ready..."
sleep 5

# Test APIs
if [ -f "scripts/test-backend.sh" ]; then
    echo "Running backend tests..."
    bash scripts/test-backend.sh "$DOMAIN"
else
    echo "Testing API endpoints manually..."
    
    # Test one endpoint
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
        "https://${DOMAIN}/api/appointments" \
        -H "Origin: https://www.harmonyresourcehub.ca")
    
    if [ "$STATUS" = "204" ] || [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓${NC} API endpoint responding correctly"
    else
        echo -e "${RED}✗${NC} API endpoint returned status: $STATUS"
    fi
fi

# Summary
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║              ✅ Deployment Successful! ✅                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Deployment URL:${NC}"
echo "$DEPLOYMENT_URL"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Visit: $DEPLOYMENT_URL"
echo "2. Test the booking form"
echo "3. Test the contact form"
echo "4. Monitor logs: vercel logs"
echo ""
