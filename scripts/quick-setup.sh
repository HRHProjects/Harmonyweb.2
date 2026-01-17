#!/bin/bash
###############################################################################
# Quick Setup Script
# One-command setup for the entire backend
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       🚀 Harmony Resource Hub - Quick Setup 🚀                ║
║                                                               ║
║   This script will guide you through the complete setup:     ║
║   1. Environment configuration                                ║
║   2. Configuration validation                                 ║
║   3. Testing                                                  ║
║   4. Deployment to Vercel                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

# Step 1: Environment setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Environment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}.env.local already exists${NC}"
    read -p "Reconfigure environment? (y/n): " reconfig
    if [ "$reconfig" = "y" ] || [ "$reconfig" = "Y" ]; then
        ./scripts/setup-env.sh
    fi
else
    ./scripts/setup-env.sh
fi

# Step 2: Validation
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Configuration Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if ! ./scripts/validate-config.sh; then
    echo -e "\n${RED}Configuration validation failed${NC}"
    echo "Please fix the errors and run this script again"
    exit 1
fi

# Step 3: Testing
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Running Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "test-suite.js" ]; then
    if node test-suite.js | tail -5; then
        echo -e "${GREEN}✓ Tests passed${NC}"
    else
        echo -e "${RED}✗ Tests failed${NC}"
        read -p "Continue anyway? (y/n): " continue
        if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
            exit 1
        fi
    fi
fi

# Step 4: Deployment
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "Deploy to Vercel now? (y/n): " deploy

if [ "$deploy" = "y" ] || [ "$deploy" = "Y" ]; then
    ./scripts/deploy.sh
else
    echo -e "\n${YELLOW}Skipping deployment${NC}"
    echo "Run: ./scripts/deploy.sh when ready"
fi

# Final summary
echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                ✅ Setup Complete! ✅                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Available Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ./scripts/setup-env.sh      - Configure environment"
echo "  ./scripts/validate-config.sh - Validate configuration"
echo "  ./scripts/deploy.sh          - Deploy to Vercel"
echo "  ./scripts/test-backend.sh    - Test API endpoints"
echo "  npm run test                 - Run test suite"
echo "  npm run deploy               - Deploy to production"
echo ""
