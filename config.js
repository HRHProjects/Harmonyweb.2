// config.js
// Central configuration so contact details are defined once.
// Update BOOKING_ENDPOINT when your backend endpoint is ready.

window.HRH_CONFIG = {
  brandName: "Harmony Resource Hub",
  legalName: "Harmony Resource Hub Alberta Inc.",
  phoneDisplay: "780-531-4294",
  phoneE164: "+17805314294",
  email: "admin@harmonyresourcehub.ca",
  addressLine1: "9914 Morrison St. #15",
  addressLine2: "Fort McMurray, AB T9H 4A4",
  // Coordinates used for the map (Leaflet + OpenStreetMap tiles).
  // Adjust if you want a more exact pin.
  mapLat: 56.7286626,
  mapLng: -111.3843884,

  // Backend endpoints (leave empty if the site and API are on the same domain).
  // GitHub Pages site uses Vercel for API.
  API_BASE_URL: "https://harmonyweb-2.vercel.app",
  BOOKING_ENDPOINT: "/api/appointments",      // Example: "https://api.yourdomain.ca/appointments"
  CONTACT_ENDPOINT: "/api/contact",           // Example: "https://api.yourdomain.ca/contact"

  // Auth + portal
  AUTH_LOGIN_ENDPOINT: "/api/auth/login",
  AUTH_REGISTER_ENDPOINT: "/api/auth/register",
  AUTH_VERIFY_ENDPOINT: "/api/auth/verify",
  AUTH_APPROVE_ENDPOINT: "/api/auth/approve",
  AUTH_ENDPOINT: "/api/auth/login",           // Backwards-compatible alias.
  PORTAL_URL: "portal/",                      // Client portal route.

  // Chat assistant (basic website help)
  CHATBOT_ENABLED: true,
  CHATBOT_NAME: "HRH Assistant",

  // Google OAuth Configuration
  // To enable Google Sign-In:
  // 1. Go to Google Cloud Console (console.cloud.google.com)
  // 2. Create a project or select existing one
  // 3. Enable Google+ API
  // 4. Create OAuth 2.0 Client ID (Web application)
  // 5. Add authorized JavaScript origins: https://harmonyresourcehub.ca, https://www.harmonyresourcehub.ca
  // 6. Add authorized redirect URIs: https://harmonyresourcehub.ca/signin.html, https://www.harmonyresourcehub.ca/signin.html
  // 7. Copy the Client ID below
  GOOGLE_CLIENT_ID: "",  // Add your Google OAuth Client ID here
  GOOGLE_OAUTH_ENABLED: false  // Set to true once configured
};
