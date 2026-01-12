# Harmony Resource Hub (static multi-page site)

Pages:
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

## Open-source libraries (CDN)
- Tailwind CSS (UI)
- Leaflet + OpenStreetMap tiles (map)
- Flatpickr (date/time picker)

## GitHub Pages
Commit these files and enable GitHub Pages (Deploy from branch → root).
