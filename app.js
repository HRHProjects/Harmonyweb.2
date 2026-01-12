// app.js
(function () {
  const cfg = window.HRH_CONFIG || {};

  function qs(sel, root=document) { return root.querySelector(sel); }
  function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  function setText(sel, value) {
    qsa(sel).forEach(el => { el.textContent = value; });
  }
  function setHref(sel, value) {
    qsa(sel).forEach(el => { el.setAttribute("href", value); });
  }

  function injectCommon() {
    // Brand/Legal names
    setText("[data-brand-name]", cfg.brandName || "");
    setText("[data-legal-name]", cfg.legalName || cfg.brandName || "");

    // Phone/email/address
    setText("[data-phone-display]", cfg.phoneDisplay || "");
    setHref("[data-phone-tel]", cfg.phoneE164 ? `tel:${cfg.phoneE164}` : (cfg.phoneDisplay ? `tel:${cfg.phoneDisplay}` : "#"));

    setText("[data-email]", cfg.email || "");
    setHref("[data-email-mailto]", cfg.email ? `mailto:${cfg.email}` : "#");

    setText("[data-address-line1]", cfg.addressLine1 || "");
    setText("[data-address-line2]", cfg.addressLine2 || "");

    // Year
    setText("[data-year]", String(new Date().getFullYear()));
  }

  // Service + pricing data (from your pricing list image)
  const PRICING = [
    { category: "Employment & Work", service: "Weekly Newsletter (Job posts)", price: "N/A" },
    { category: "Employment & Work", service: "Assessment", price: "$30 per 30 min (min)" },
    { category: "Employment & Work", service: "Resume update", price: "$10+" },
    { category: "Employment & Work", service: "Resume Development", price: "$20–$65" },
    { category: "Employment & Work", service: "Job search support", price: "$20 per 30 min (min)" },
    { category: "Employment & Work", service: "Cover letter", price: "$10" },
    { category: "Employment & Work", service: "Orientation Support", price: "$50+" },

    { category: "Alberta Supports & Benefits", service: "Wood Buffalo Lift Application", price: "$25+" },
    { category: "Alberta Supports & Benefits", service: "Wood Buffalo Housing Application", price: "$100" },
    { category: "Alberta Supports & Benefits", service: "EI Application", price: "$50" },
    { category: "Alberta Supports & Benefits", service: "EI Application support", price: "$50" },
    { category: "Alberta Supports & Benefits", service: "Alberta IS Application Support", price: "$30 (per visit)" },
    { category: "Alberta Supports & Benefits", service: "Alberta IS", price: "$50" },
    { category: "Alberta Supports & Benefits", service: "AISH Application", price: "$65" },
    { category: "Alberta Supports & Benefits", service: "AISH Application Support", price: "$30" },
    { category: "Alberta Supports & Benefits", service: "Canada Dental Care Application", price: "$20" },
    { category: "Alberta Supports & Benefits", service: "CPP", price: "$100" },
    { category: "Alberta Supports & Benefits", service: "OAS", price: "$100" },
    { category: "Alberta Supports & Benefits", service: "Safety Ticket support", price: "$50+" },
    { category: "Alberta Supports & Benefits", service: "Community Connections", price: "$30+" },

    { category: "Immigration & Travel (Non-rep)", service: "IQAS/WES", price: "$150" },
    { category: "Immigration & Travel (Non-rep)", service: "IRCC Webform", price: "$20" },
    { category: "Immigration & Travel (Non-rep)", service: "PR Renewal application", price: "$65" },
    { category: "Immigration & Travel (Non-rep)", service: "Lost PR Application", price: "$65" },
    { category: "Immigration & Travel (Non-rep)", service: "Sponsorship supports non-rep (Various)", price: "$600+" },
    { category: "Immigration & Travel (Non-rep)", service: "Visa application", price: "$400+" },
    { category: "Immigration & Travel (Non-rep)", service: "Travel Document Application", price: "$65 or $95 with PPTC 326" },
    { category: "Immigration & Travel (Non-rep)", service: "Child Travel Document Application", price: "$50" },
    { category: "Immigration & Travel (Non-rep)", service: "Consent letter for children traveling abroad", price: "$50" },
    { category: "Immigration & Travel (Non-rep)", service: "IRCC Application Withdrawal Request", price: "$30" },
    { category: "Immigration & Travel (Non-rep)", service: "Citizenship application", price: "$150" },
    { category: "Immigration & Travel (Non-rep)", service: "Citizenship tracking", price: "$15" },
    { category: "Immigration & Travel (Non-rep)", service: "Citizenship Test Support (Tech)", price: "$200" },

    { category: "Travel & Other", service: "Kenyan ETA", price: "$40" },
    { category: "Travel & Other", service: "US Visa Application", price: "$75" },
    { category: "Travel & Other", service: "Passport Application", price: "$65" },
    { category: "Travel & Other", service: "Flight Booking Assistance", price: "$50+" },
    { category: "Travel & Other", service: "VOS Application", price: "$50" },
    { category: "Travel & Other", service: "Account Creation/setup/Registration", price: "$10 per account" },
    { category: "Travel & Other", service: "Call/email assistance", price: "$40+" },
    { category: "Travel & Other", service: "RSW Letter", price: "$20+" },
    { category: "Travel & Other", service: "Print Copy of documents", price: "$1 per 2 pages" },

    { category: "Commissioning", service: "Commissioning service", price: "$65–$150+" },

    { category: "Family & Civil", service: "Divorce Application", price: "$900+" }
  ];

  function groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }

  function renderPricingTable() {
    const root = qs("[data-pricing-table]");
    if (!root) return;

    const grouped = groupBy(PRICING, x => x.category);
    const cats = Object.keys(grouped);

    root.innerHTML = cats.map(cat => {
      const rows = grouped[cat].map(x => `
        <tr class="border-b border-slate-200/70 last:border-b-0">
          <td class="py-3 pr-3 align-top">
            <div class="font-medium text-slate-900">${escapeHtml(x.service)}</div>
          </td>
          <td class="py-3 align-top text-right">
            <div class="font-semibold text-slate-900">${escapeHtml(x.price)}</div>
          </td>
        </tr>
      `).join("");

      return `
        <details class="group rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md">
          <summary class="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
            <div class="font-semibold text-slate-900">${escapeHtml(cat)}</div>
            <div class="text-slate-500 group-open:rotate-180 transition-transform" aria-hidden="true">▾</div>
          </summary>
          <div class="px-5 pb-4">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-xs text-slate-500">
                  <tr>
                    <th class="pb-2">Service</th>
                    <th class="pb-2 text-right">Non-member price</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </details>
      `;
    }).join("");
  }

  function renderBookingServiceOptions() {
    const sel = qs("#serviceSelect");
    if (!sel) return;

    const grouped = groupBy(PRICING, x => x.category);
    const cats = Object.keys(grouped);

    const optgroups = cats.map(cat => {
      const opts = grouped[cat]
        .map(x => `<option value="${escapeAttr(x.service)}">${escapeHtml(x.service)} — ${escapeHtml(x.price)}</option>`)
        .join("");
      return `<optgroup label="${escapeAttr(cat)}">${opts}</optgroup>`;
    }).join("");

    sel.innerHTML = `
      <option value="" selected disabled>Select a service</option>
      ${optgroups}
      <option value="Other">Other (describe below)</option>
    `;
  }

  function setupBookingForm() {
    const form = qs("#bookingForm");
    if (!form) return;

    const otherWrap = qs("#otherServiceWrap");
    const otherInput = qs("#otherService");
    const serviceSelect = qs("#serviceSelect");
    const status = qs("#bookingStatus");

    function setStatus(msg, kind="info") {
      if (!status) return;
      status.textContent = msg;
      status.className = "mt-3 text-sm " + (kind === "ok" ? "text-emerald-700" : kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    serviceSelect?.addEventListener("change", () => {
      const v = serviceSelect.value;
      if (v === "Other") {
        otherWrap?.classList.remove("hidden");
        otherInput?.setAttribute("required", "required");
      } else {
        otherWrap?.classList.add("hidden");
        otherInput?.removeAttribute("required");
        if (otherInput) otherInput.value = "";
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");

      const payload = {
        service: serviceSelect?.value || "",
        otherService: otherInput?.value?.trim() || "",
        appointmentType: qs("input[name='appointmentType']:checked")?.value || "",
        preferredDateTime: (qs("#preferredDateTime")?.value || "").trim(),
        clientName: (qs("#clientName")?.value || "").trim(),
        clientEmail: (qs("#clientEmail")?.value || "").trim(),
        clientPhone: (qs("#clientPhone")?.value || "").trim(),
        preferredContact: (qs("#preferredContact")?.value || "").trim(),
        message: (qs("#serviceMessage")?.value || "").trim(),
        source: "website"
      };

      // Basic validation (browser already does required checks)
      if (payload.service === "Other" && !payload.otherService) {
        setStatus("Please describe the service under “Other”.", "error");
        return;
      }

      // Try backend first, if configured. Otherwise fallback to mailto.
      const endpoint = (cfg.API_BASE_URL ? cfg.API_BASE_URL.replace(/\/$/, "") : "") + (cfg.BOOKING_ENDPOINT || "");
      const canPost = Boolean(cfg.BOOKING_ENDPOINT) && !cfg.BOOKING_ENDPOINT.startsWith("/") ? true : Boolean(cfg.API_BASE_URL);

      // If you are using a relative endpoint on the same domain, it can still work:
      // we attempt the POST regardless, and fallback if it fails.
      const postUrl = cfg.API_BASE_URL ? endpoint : (cfg.BOOKING_ENDPOINT || "");

      setStatus("Submitting appointment request…");

      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Request failed");

        setStatus("Request sent. We will respond using your preferred contact method.", "ok");
        form.reset();
        otherWrap?.classList.add("hidden");
      } catch (err) {
        // Mailto fallback
        const subject = encodeURIComponent("Appointment Request — Harmony Resource Hub");
        const lines = [
          `Service: ${payload.service}${payload.service === "Other" ? " — " + payload.otherService : ""}`,
          `Appointment type: ${payload.appointmentType}`,
          `Preferred date/time: ${payload.preferredDateTime}`,
          `Name: ${payload.clientName}`,
          `Email: ${payload.clientEmail}`,
          `Phone: ${payload.clientPhone}`,
          `Preferred contact: ${payload.preferredContact}`,
          "",
          "Message:",
          payload.message || "(none)"
        ];
        const body = encodeURIComponent(lines.join("\n"));
        window.location.href = `mailto:${cfg.email || ""}?subject=${subject}&body=${body}`;
        setStatus("Opening your email app to send the request…", "ok");
      }
    });
  }

  function setupContactForm() {
    const form = qs("#contactForm");
    if (!form) return;

    const status = qs("#contactStatus");

    function setStatus(msg, kind="info") {
      if (!status) return;
      status.textContent = msg;
      status.className = "mt-3 text-sm " + (kind === "ok" ? "text-emerald-700" : kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");

      const payload = {
        name: (qs("#cName")?.value || "").trim(),
        email: (qs("#cEmail")?.value || "").trim(),
        phone: (qs("#cPhone")?.value || "").trim(),
        message: (qs("#cMessage")?.value || "").trim(),
        source: "website"
      };

      const endpoint = (cfg.API_BASE_URL ? cfg.API_BASE_URL.replace(/\/$/, "") : "") + (cfg.CONTACT_ENDPOINT || "");
      const postUrl = cfg.API_BASE_URL ? endpoint : (cfg.CONTACT_ENDPOINT || "");

      setStatus("Sending…");
      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Request failed");

        setStatus("Message sent. We will respond as soon as possible.", "ok");
        form.reset();
      } catch (err) {
        const subject = encodeURIComponent("Website message — Harmony Resource Hub");
        const body = encodeURIComponent(
          `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\n\n${payload.message}`
        );
        window.location.href = `mailto:${cfg.email || ""}?subject=${subject}&body=${body}`;
        setStatus("Opening your email app…", "ok");
      }
    });
  }

  function initMapIfPresent() {
    const el = qs("#map");
    if (!el || !window.L) return;

    const lat = Number(cfg.mapLat);
    const lng = Number(cfg.mapLng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const map = L.map("map", { scrollWheelZoom: false });
    map.setView(hasCoords ? [lat, lng] : [0, 0], hasCoords ? 16 : 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    if (hasCoords) {
      const popupHtml =
        `<b>${escapeHtml(cfg.brandName || "Harmony Resource Hub")}</b><br>` +
        `${escapeHtml(cfg.addressLine1 || "")}<br>` +
        `${escapeHtml(cfg.addressLine2 || "")}`;
      L.marker([lat, lng]).addTo(map).bindPopup(popupHtml);
    }
  }

  function initFlatpickrIfPresent() {
    const input = qs("#preferredDateTime");
    if (!input || !window.flatpickr) return;

    // Hours of operation (configured as requested)
    // Mon–Fri: 9:30 AM – 7:00 PM, closed 12:00–1:00
    // Sat: 10:00 AM – 4:00 PM, closed 12:00–1:00
    // Sun: closed
    function isWithinHours(date) {
      const day = date.getDay(); // 0 Sun .. 6 Sat
      const h = date.getHours();
      const m = date.getMinutes();
      const minutes = h * 60 + m;

      const inLunch = (minutes >= 12*60 && minutes < 13*60);

      if (day === 0) return false;
      if (day >= 1 && day <= 5) {
        const open = 9*60 + 30;
        const close = 19*60; // 7:00 PM
        return minutes >= open && minutes < close && !inLunch;
      }
      if (day === 6) {
        const open = 10*60;
        const close = 16*60;
        return minutes >= open && minutes < close && !inLunch;
      }
      return false;
    }

    flatpickr(input, {
      enableTime: true,
      time_24hr: false,
      minuteIncrement: 30,
      minDate: "today",
      dateFormat: "Y-m-d h:i K",
      disable: [
        function(date) {
          // Disable Sundays entirely
          return date.getDay() === 0;
        }
      ],
      onChange: function(selectedDates, dateStr, instance) {
        if (!selectedDates.length) return;
        const d = selectedDates[0];
        if (!isWithinHours(d)) {
          instance.clear();
          alert("Please choose a time within hours of operation (lunch closure applies).");
        }
      }
    });
  }

  function setupMobileMenu() {
    const btn = qs("[data-mobile-menu-button]");
    const panel = qs("[data-mobile-menu-panel]");
    if (!btn || !panel) return;

    btn.addEventListener("click", () => {
      const open = panel.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/\s+/g, " ").trim(); }

  window.HRH_APP = { PRICING };

  document.addEventListener("DOMContentLoaded", () => {
    injectCommon();
    setupMobileMenu();
    renderPricingTable();
    renderBookingServiceOptions();
    setupBookingForm();
    setupContactForm();
    initMapIfPresent();
    initFlatpickrIfPresent();
  });
})();
