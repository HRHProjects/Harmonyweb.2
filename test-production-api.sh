#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Production APIs on harmonyweb-2.vercel.app"
echo "=========================================================="
echo ""

PASS=0
FAIL=0

test_api() {
  local name=$1
  local endpoint=$2
  
  echo "Testing $name..."
  response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    "https://harmonyweb-2.vercel.app$endpoint" \
    -H "Origin: https://www.harmonyresourcehub.ca")
  
  if [ "$response" = "204" ] || [ "$response" = "200" ]; then
    echo -e "${GREEN}✓${NC} $name: HTTP $response"
    ((PASS++))
    
    # Check CORS headers
    cors=$(curl -s -X OPTIONS "https://harmonyweb-2.vercel.app$endpoint" \
      -H "Origin: https://www.harmonyresourcehub.ca" -i 2>&1 | \
      grep -i "access-control-allow" | wc -l)
    
    if [ "$cors" -gt 0 ]; then
      echo -e "  ${GREEN}✓${NC} CORS headers present"
    fi
  else
    echo -e "${RED}✗${NC} $name: HTTP $response"
    ((FAIL++))
  fi
  echo ""
}

# Test all endpoints
test_api "Appointments API" "/api/appointments"
test_api "Contact API" "/api/contact"
test_api "Register API" "/api/auth/register"
test_api "Login API" "/api/auth/login"
test_api "Verify API" "/api/auth/verify"
test_api "Approve API" "/api/auth/approve"

echo "=========================================================="
echo -e "\n${GREEN}Passed: $PASS${NC} | ${RED}Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "\n${GREEN}✅ All backend APIs are working!${NC}\n"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed${NC}\n"
  exit 1
fi
