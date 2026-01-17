#!/bin/bash
###############################################################################
# Environment Setup Script
# Automates environment variable configuration for Vercel deployment
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
echo "║           Harmony Resource Hub - Environment Setup           ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running in CI or interactive mode
if [ -t 0 ]; then
    INTERACTIVE=true
else
    INTERACTIVE=false
fi

# Function to prompt for input with default value
prompt_with_default() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    if [ "$INTERACTIVE" = true ]; then
        read -p "$(echo -e ${YELLOW}${prompt}${NC} [${default}]: )" input
        eval "$var_name=\"${input:-$default}\""
    else
        eval "$var_name=\"$default\""
    fi
}

# Function to prompt for sensitive input
prompt_secret() {
    local prompt=$1
    local var_name=$2
    local env_var=$3
    
    # Check if already set in environment
    if [ ! -z "${!env_var}" ]; then
        eval "$var_name=\"${!env_var}\""
        echo -e "${GREEN}✓${NC} Using ${env_var} from environment"
        return
    fi
    
    if [ "$INTERACTIVE" = true ]; then
        read -sp "$(echo -e ${YELLOW}${prompt}${NC}: )" input
        echo ""
        eval "$var_name=\"$input\""
    else
        echo -e "${RED}✗${NC} ${env_var} not set in environment"
        exit 1
    fi
}

echo -e "${BLUE}Setting up environment variables...${NC}\n"

# Resend API Key (required)
echo -e "${YELLOW}1. Email Service Configuration${NC}"
echo "   Get your API key from: https://resend.com/api-keys"
prompt_secret "Enter your Resend API Key" RESEND_API_KEY "RESEND_API_KEY"

if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${RED}✗ RESEND_API_KEY is required${NC}"
    exit 1
fi

# Email addresses
echo -e "\n${YELLOW}2. Email Addresses${NC}"
prompt_with_default "Admin email (receives form submissions)" "admin@harmonyresourcehub.ca" HRH_TO_EMAIL
prompt_with_default "From email (sender address)" "Harmony Resource Hub <noreply@harmonyresourcehub.ca>" HRH_FROM_EMAIL

# Site URL
echo -e "\n${YELLOW}3. Site Configuration${NC}"
prompt_with_default "Site URL" "https://harmonyweb-2.vercel.app" HRH_SITE_URL

# CORS Origins
echo -e "\n${YELLOW}4. CORS Configuration${NC}"
prompt_with_default "Allowed origins (comma-separated)" "https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca,https://harmonyweb-2.vercel.app" HRH_ALLOWED_ORIGINS

# Authentication
echo -e "\n${YELLOW}5. Authentication Setup${NC}"
prompt_secret "Enter authentication password" HRH_AUTH_PASSWORD "HRH_AUTH_PASSWORD"

if [ -z "$HRH_AUTH_PASSWORD" ]; then
    echo -e "${YELLOW}⚠ No authentication password set - using default${NC}"
    HRH_AUTH_PASSWORD="change-this-password-in-production"
fi

prompt_with_default "Allowed users (comma-separated emails)" "" HRH_ALLOWED_USERS

# Email subject prefix
echo -e "\n${YELLOW}6. Optional Settings${NC}"
prompt_with_default "Email subject prefix" "HRH Website" HRH_SUBJECT_PREFIX

# Save to .env.local for local development
echo -e "\n${BLUE}Saving configuration...${NC}"

cat > .env.local << EOF
# Harmony Resource Hub - Environment Configuration
# Generated: $(date)

# Email Service (Resend)
RESEND_API_KEY=${RESEND_API_KEY}

# Email Addresses
HRH_TO_EMAIL=${HRH_TO_EMAIL}
HRH_FROM_EMAIL=${HRH_FROM_EMAIL}

# Site Configuration
HRH_SITE_URL=${HRH_SITE_URL}

# CORS Configuration
HRH_ALLOWED_ORIGINS=${HRH_ALLOWED_ORIGINS}

# Authentication
HRH_AUTH_PASSWORD=${HRH_AUTH_PASSWORD}
HRH_ALLOWED_USERS=${HRH_ALLOWED_USERS}

# Optional Settings
HRH_SUBJECT_PREFIX=${HRH_SUBJECT_PREFIX}
EOF

echo -e "${GREEN}✓${NC} Configuration saved to .env.local"

# Set Vercel environment variables if Vercel CLI is available
if command -v vercel &> /dev/null; then
    echo -e "\n${YELLOW}Deploy to Vercel? (y/n)${NC}"
    
    if [ "$INTERACTIVE" = true ]; then
        read -p "> " deploy
    else
        deploy="n"
    fi
    
    if [ "$deploy" = "y" ] || [ "$deploy" = "Y" ]; then
        echo -e "\n${BLUE}Setting Vercel environment variables...${NC}"
        
        # Set each environment variable for all environments
        vercel env add RESEND_API_KEY production preview development <<< "$RESEND_API_KEY" 2>/dev/null || \
        vercel env rm RESEND_API_KEY production preview development <<< "y" && \
        vercel env add RESEND_API_KEY production preview development <<< "$RESEND_API_KEY"
        
        vercel env add HRH_TO_EMAIL production preview development <<< "$HRH_TO_EMAIL" 2>/dev/null || \
        vercel env rm HRH_TO_EMAIL production preview development <<< "y" && \
        vercel env add HRH_TO_EMAIL production preview development <<< "$HRH_TO_EMAIL"
        
        vercel env add HRH_FROM_EMAIL production preview development <<< "$HRH_FROM_EMAIL" 2>/dev/null || \
        vercel env rm HRH_FROM_EMAIL production preview development <<< "y" && \
        vercel env add HRH_FROM_EMAIL production preview development <<< "$HRH_FROM_EMAIL"
        
        vercel env add HRH_SITE_URL production preview development <<< "$HRH_SITE_URL" 2>/dev/null || \
        vercel env rm HRH_SITE_URL production preview development <<< "y" && \
        vercel env add HRH_SITE_URL production preview development <<< "$HRH_SITE_URL"
        
        vercel env add HRH_ALLOWED_ORIGINS production preview development <<< "$HRH_ALLOWED_ORIGINS" 2>/dev/null || \
        vercel env rm HRH_ALLOWED_ORIGINS production preview development <<< "y" && \
        vercel env add HRH_ALLOWED_ORIGINS production preview development <<< "$HRH_ALLOWED_ORIGINS"
        
        vercel env add HRH_AUTH_PASSWORD production preview development <<< "$HRH_AUTH_PASSWORD" 2>/dev/null || \
        vercel env rm HRH_AUTH_PASSWORD production preview development <<< "y" && \
        vercel env add HRH_AUTH_PASSWORD production preview development <<< "$HRH_AUTH_PASSWORD"
        
        if [ ! -z "$HRH_ALLOWED_USERS" ]; then
            vercel env add HRH_ALLOWED_USERS production preview development <<< "$HRH_ALLOWED_USERS" 2>/dev/null || \
            vercel env rm HRH_ALLOWED_USERS production preview development <<< "y" && \
            vercel env add HRH_ALLOWED_USERS production preview development <<< "$HRH_ALLOWED_USERS"
        fi
        
        vercel env add HRH_SUBJECT_PREFIX production preview development <<< "$HRH_SUBJECT_PREFIX" 2>/dev/null || \
        vercel env rm HRH_SUBJECT_PREFIX production preview development <<< "y" && \
        vercel env add HRH_SUBJECT_PREFIX production preview development <<< "$HRH_SUBJECT_PREFIX"
        
        echo -e "${GREEN}✓${NC} Vercel environment variables configured"
    fi
fi

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║                  ✅ Setup Complete! ✅                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Configuration Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Email service configured"
echo -e "${GREEN}✓${NC} Email addresses set"
echo -e "${GREEN}✓${NC} CORS configured"
echo -e "${GREEN}✓${NC} Authentication configured"
echo -e "${GREEN}✓${NC} Local environment file created (.env.local)"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review .env.local to verify settings"
echo "2. Run: npm run deploy (or ./scripts/deploy.sh)"
echo "3. Test your deployment"
echo ""
