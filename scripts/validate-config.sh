#!/bin/bash
###############################################################################
# Configuration Validation Script
# Validates all configuration files and environment variables
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔍 Validating Configuration${NC}"
echo "=========================================================="
echo ""

ERRORS=0
WARNINGS=0

# Check required files
echo -e "${BLUE}Checking required files...${NC}"
REQUIRED_FILES=(
    "config.js"
    "vercel.json"
    "index.html"
    "booking.html"
    "contact.html"
    "signin.html"
    "api/appointments.js"
    "api/contact.js"
    "api/auth/register.js"
    "api/auth/login.js"
    "api/auth/verify.js"
    "api/auth/approve.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file - MISSING"
        ((ERRORS++))
    fi
done

# Check JavaScript syntax
echo -e "\n${BLUE}Checking JavaScript syntax...${NC}"
JS_FILES=("config.js" "app.js" "api/appointments.js" "api/contact.js" 
          "api/auth/register.js" "api/auth/login.js" "api/auth/verify.js" "api/auth/approve.js")

for file in "${JS_FILES[@]}"; do
    if [ -f "$file" ]; then
        if node --check "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $file"
        else
            echo -e "${RED}✗${NC} $file - SYNTAX ERROR"
            ((ERRORS++))
        fi
    fi
done

# Check vercel.json
echo -e "\n${BLUE}Checking vercel.json...${NC}"
if [ -f "vercel.json" ]; then
    if python3 -m json.tool vercel.json > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Valid JSON"
    else
        echo -e "${RED}✗${NC} Invalid JSON"
        ((ERRORS++))
    fi
    
    # Check for required fields
    if grep -q '"version"' vercel.json; then
        echo -e "${GREEN}✓${NC} Version field present"
    else
        echo -e "${YELLOW}⚠${NC} Version field missing"
        ((WARNINGS++))
    fi
    
    if grep -q '"rewrites"' vercel.json; then
        echo -e "${GREEN}✓${NC} Rewrites configured"
    else
        echo -e "${YELLOW}⚠${NC} No rewrites configured"
        ((WARNINGS++))
    fi
fi

# Check environment variables
echo -e "\n${BLUE}Checking environment variables...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    source .env.local
    
    REQUIRED_VARS=("RESEND_API_KEY" "HRH_TO_EMAIL" "HRH_FROM_EMAIL" "HRH_AUTH_PASSWORD")
    for var in "${REQUIRED_VARS[@]}"; do
        if [ ! -z "${!var}" ]; then
            echo -e "${GREEN}✓${NC} $var is set"
        else
            echo -e "${RED}✗${NC} $var is NOT set"
            ((ERRORS++))
        fi
    done
    
    # Check email formats
    if [[ "$HRH_TO_EMAIL" =~ @.*\. ]]; then
        echo -e "${GREEN}✓${NC} HRH_TO_EMAIL format valid"
    else
        echo -e "${RED}✗${NC} HRH_TO_EMAIL format invalid"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.local not found"
    echo "   Run: ./scripts/setup-env.sh"
    ((WARNINGS++))
fi

# Check config.js
echo -e "\n${BLUE}Checking config.js...${NC}"
if [ -f "config.js" ]; then
    if grep -q "API_BASE_URL" config.js; then
        echo -e "${GREEN}✓${NC} API_BASE_URL configured"
        
        # Extract and validate URL
        URL=$(grep "API_BASE_URL" config.js | grep -o 'https://[^"]*')
        if [ ! -z "$URL" ]; then
            echo -e "${GREEN}✓${NC} URL: $URL"
        fi
    else
        echo -e "${RED}✗${NC} API_BASE_URL not found"
        ((ERRORS++))
    fi
    
    if grep -q "BOOKING_ENDPOINT" config.js; then
        echo -e "${GREEN}✓${NC} BOOKING_ENDPOINT configured"
    else
        echo -e "${RED}✗${NC} BOOKING_ENDPOINT not found"
        ((ERRORS++))
    fi
fi

# Check Git status
echo -e "\n${BLUE}Checking Git status...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠${NC} Uncommitted changes present"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓${NC} No uncommitted changes"
    fi
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✓${NC} Git remote configured"
    else
        echo -e "${YELLOW}⚠${NC} No Git remote configured"
        ((WARNINGS++))
    fi
fi

# Summary
echo -e "\n=========================================================="
echo -e "${BLUE}Validation Summary${NC}"
echo "=========================================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your configuration is ready for deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
    echo ""
    echo "Configuration is mostly correct but has some warnings."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Fix the errors before deploying."
    exit 1
fi
