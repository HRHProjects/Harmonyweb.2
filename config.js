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
  // If the site is on GitHub Pages and the API is on Vercel, set API_BASE_URL to your Vercel URL.
  API_BASE_URL: "",
  BOOKING_ENDPOINT: "/api/appointments",      // Example: "https://api.yourdomain.ca/appointments"
  CONTACT_ENDPOINT: "/api/contact"            // Example: "https://api.yourdomain.ca/contact"
};
