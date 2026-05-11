(function () {
  const cfg = window.HRH_CONFIG || {};
  if (!cfg.AUTH_LOGIN_ENDPOINT) console.warn("⚠️ AUTH_LOGIN_ENDPOINT not found!");
  if (!cfg.AUTH_REGISTER_ENDPOINT) console.warn("⚠️ AUTH_REGISTER_ENDPOINT not found!");

  function qs(sel, root=document) { return root.querySelector(sel); }
  function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/\s+/g, " ").trim(); }

  function setText(sel, value) {
    qsa(sel).forEach(el => { el.textContent = value; });
  }
  function setHref(sel, value) {
    qsa(sel).forEach(el => { el.setAttribute("href", value); });
  }

  function getApiUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const base = cfg.API_BASE_URL ? cfg.API_BASE_URL.replace(/\/$/, "") : "";
    return base + path;
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
    { category: "Commissioner for Oaths (Alberta)", service: "May special: 1-page document + 1 exhibit", price: "$20 (May only)", description: "Administer an oath, affirmation, affidavit, or statutory declaration where permitted in Alberta.", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80" },
    { category: "Commissioner for Oaths (Alberta)", service: "Affidavits and solemn/statutory declarations", price: "$25+", description: "Take and receive affidavits, affirmations, declarations, and attest the commissioned document.", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80" },
    { category: "Commissioner for Oaths (Alberta)", service: "Exhibits attached to commissioned documents", price: "$10+ per additional exhibit", description: "Mark and attach exhibits connected to an affidavit or declaration where appropriate.", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80" },
    { category: "Commissioner for Oaths (Alberta)", service: "Government, benefit, insurance, school or housing declarations", price: "$25+", description: "Commission eligible Alberta-use declarations and sworn statements after identity review.", image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80" },

    { category: "Immigration Admin Support (Non-advisory)", service: "IRCC secure account setup and document upload support", price: "$40+", description: "Administrative and technical support only; no program selection, strategy, representation, or legal advice.", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "IRCC webform support", price: "$20", description: "Help formatting and submitting client-provided updates or documents through the webform.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "PR card renewal admin package", price: "$65", description: "Checklist, form-entry support from client-provided information, scan review, and upload organization.", image: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Lost/stolen PR card replacement admin package", price: "$65", description: "Administrative assistance organizing the replacement package using client-provided details.", image: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Citizenship application admin support", price: "$150", description: "Document checklist, portal navigation, form-entry support, and package organization.", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Citizenship tracker and status check support", price: "$15", description: "Technical assistance accessing client accounts and reading status screens with the client.", image: "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Citizenship test technical support", price: "$200", description: "Technology readiness, account access, and non-substantive test-day setup support.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Application withdrawal request admin support", price: "$30", description: "Help preparing a client-directed withdrawal request for submission.", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "IQAS/WES credential assessment admin support", price: "$150", description: "Account setup, document checklist, upload organization, and courier/admin coordination.", image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Visa application admin support", price: "$400+", description: "Client-directed form-entry and document organization only; no eligibility advice or representation.", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80" },
    { category: "Immigration Admin Support (Non-advisory)", service: "Sponsorship package admin support", price: "$600+", description: "Administrative checklist and package assembly from client-provided information; non-representative support only.", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80" },

    { category: "Benefits & Community Supports", service: "Wood Buffalo Lift application", price: "$25+", description: "Form and document organization support for local transportation assistance.", image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "Wood Buffalo Housing application", price: "$100", description: "Application package support, document checklist, and follow-up organization.", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "EI application admin support", price: "$50", description: "Help organizing information and completing client-directed application steps.", image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "Alberta Income Support admin support", price: "$30 per visit / $50 package", description: "Application navigation and document organization support.", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "AISH application admin support", price: "$65 package / $30 support", description: "Checklist, form support, and package organization for client-provided information.", image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "Canada Dental Care Plan application", price: "$20", description: "Account and form support for eligible clients.", image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "CPP/OAS application admin support", price: "$100", description: "Document checklist and application navigation support.", image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80" },
    { category: "Benefits & Community Supports", service: "Community connections and system navigation", price: "$30+", description: "Help identifying offices, forms, contact paths, and next-step checklists.", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80" },

    { category: "Travel & Identity Documents", service: "Passport application or renewal admin support", price: "$65 application / $40+ renewal", description: "Checklist, form completion support, photo and guarantor requirement review.", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "Travel Document application", price: "$65 or $95 with PPTC 326", description: "Administrative support preparing travel document materials.", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "Child travel document application", price: "$50", description: "Parent/guardian document checklist and package support.", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "Consent letter for children travelling abroad", price: "$50", description: "Template support and commissioning coordination where appropriate.", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "Kenyan ETA admin support", price: "$40", description: "Administrative and technical assistance for client-directed ETA submission.", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "US visa application admin support", price: "$75", description: "Client-directed form-entry and appointment navigation support only.", image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80" },
    { category: "Travel & Identity Documents", service: "Flight booking assistance", price: "$50+", description: "Administrative booking support based on client-selected itinerary preferences.", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80" },

    { category: "Housing, Family & Civil Admin", service: "Housing forms and rental application package", price: "$50+", description: "Document organization, form-entry support, and checklist preparation.", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80" },
    { category: "Housing, Family & Civil Admin", service: "Family/civil form administrative support", price: "$100+", description: "Administrative form support only; no legal advice, legal drafting, or representation.", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80" },
    { category: "Housing, Family & Civil Admin", service: "Divorce application administrative package", price: "$900+", description: "Client-directed document organization and form-entry support only; independent legal advice is recommended.", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80" },
    { category: "Housing, Family & Civil Admin", service: "Letters, calls, email and account setup", price: "$10–$40+", description: "Administrative support for accounts, basic correspondence, printing, and follow-up tracking.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" }
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
            ${x.description ? `<div class="mt-1 text-xs leading-5 text-slate-500">${escapeHtml(x.description)}</div>` : ""}
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
          credentials: "omit",
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
          credentials: "omit",
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

  function highlightActiveNav() {
    const links = qsa("header nav a, #mobileNav a");
    if (!links.length) return;

    const path = window.location.pathname;
    links.forEach(link => {
      const href = link.getAttribute("href") || "";
      const file = href.split("/").pop();
      const isActive =
        path.endsWith(href) ||
        path.endsWith(file) ||
        (file === "index.html" && (path === "/" || path.endsWith("/")));

      if (isActive) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    });
  }

  function setupRotatingText() {
    const elements = qsa("[data-rotate-text]");
    if (!elements.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    elements.forEach(el => {
      const raw = el.getAttribute("data-rotate-items") || "";
      const items = raw.split("|").map(s => s.trim()).filter(Boolean);
      if (items.length < 2) return;

      const valueEl = el.querySelector("[data-rotate-value]") || el;
      let idx = 0;

      setInterval(() => {
        idx = (idx + 1) % items.length;
        valueEl.classList.add("is-fading");
        setTimeout(() => {
          valueEl.textContent = items[idx];
          valueEl.classList.remove("is-fading");
        }, 300);
      }, 3800);
    });
  }

  function setupAuthTabs() {
    const tabs = qsa("[data-auth-tab]");
    const panels = qsa("[data-auth-panel]");
    if (!tabs.length || !panels.length) return;

    function activate(name) {
      tabs.forEach(btn => {
        const active = btn.getAttribute("data-auth-tab") === name;
        btn.classList.toggle("is-active", active);
      });
      panels.forEach(panel => {
        const active = panel.getAttribute("data-auth-panel") === name;
        panel.classList.toggle("hidden", !active);
      });
    }

    tabs.forEach(btn => {
      btn.addEventListener("click", () => activate(btn.getAttribute("data-auth-tab")));
    });

    const initial = window.location.hash === "#register" ? "register" : "login";
    activate(initial);
  }

  function setupSignInForm() {
    const form = qs("#signinForm");
    if (!form) {
      console.warn("⚠️ Sign-in form #signinForm not found in DOM!");
      return;
    }

    const status = qs("#signinStatus");
    const submitBtn = qs("button[type='submit']", form);

    function setStatus(msg, kind="info") {
      if (!status) return;
      status.textContent = msg;
      status.className = "mt-3 text-sm " + (kind === "ok" ? "text-emerald-700" :
        kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (qs("#sEmail")?.value || "").trim();
      const password = (qs("#sPassword")?.value || "").trim();

      if (!email || !password) {
        console.warn("⚠️ Missing email or password");
        setStatus("Please enter your email and password.", "error");
        return;
      }

      const loginEndpoint = cfg.AUTH_LOGIN_ENDPOINT || cfg.AUTH_ENDPOINT || "";
      if (!loginEndpoint) {
        console.error("❌ No login endpoint configured!");
        setStatus("Sign-in is not available yet. Please contact us for help.", "error");
        return;
      }

      const postUrl = getApiUrl(loginEndpoint);
      if (!postUrl) {
        console.error("❌ Could not resolve API URL!");
        setStatus("Sign-in is not available yet. Please contact us for help.", "error");
        return;
      }

      setStatus("Signing in...");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({ error: "Invalid response from server" }));
      
      if (!res.ok) {
        const errorMsg = data.error || data.message || `Sign-in failed (${res.status})`;
        throw new Error(errorMsg);
      }

      const token = data.token || data.session || data.jwt || "";
      if (token) localStorage.setItem("hrh_auth_token", token);
      localStorage.setItem("hrh_auth_session", "true");
      localStorage.setItem("hrh_auth_email", email);

      setStatus("Sign-in successful! Redirecting to portal...", "ok");
      
      // Redirect to portal
      setTimeout(() => {
        const target = cfg.PORTAL_URL || "portal/";
        window.location.href = target;
      }, 500);
    } catch (err) {
      console.error("❌ Login error:", err);
      setStatus(err.message || "Sign-in failed.", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
    });
  }

  function setupRegisterForm() {
    const form = qs("#registerForm");
    if (!form) {
      console.warn("⚠️ Register form #registerForm not found in DOM!");
      return;
    }

    const status = qs("#registerStatus");
    const verifyStatus = qs("#verifyStatus");
    const submitBtn = qs("button[type='submit']", form);
    const step1 = qs("#registerStep1");
    const step2 = qs("#registerStep2");
    const verifyCodeBtn = qs("#verifyCodeBtn");
    const resendCodeBtn = qs("#resendCodeBtn");
    
    let registeredEmail = "";

    function setStatus(msg, kind="info") {
      if (!status) return;
        status.textContent = msg;
      status.className = "mt-3 text-sm " + (kind === "ok" ? "text-emerald-700" :
        kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    function setVerifyStatus(msg, kind="info") {
      if (!verifyStatus) return;
      verifyStatus.textContent = msg;
      verifyStatus.className = "mt-3 text-sm " + (kind === "ok" ? "text-emerald-700" :
        kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = (qs("#rName")?.value || "").trim();
      const email = (qs("#rEmail")?.value || "").trim();
      const phone = (qs("#rPhone")?.value || "").trim();
      const password = (qs("#rPassword")?.value || "").trim();
      const confirm = (qs("#rPasswordConfirm")?.value || "").trim();
      const agree = qs("#rAgree")?.checked || false;

      if (!fullName || !email || !password || !confirm) {
        setStatus("Please complete all required fields.", "error");
        return;
      }
      if (!agree) {
        setStatus("You must agree to the Terms of Service and Privacy Policy.", "error");
        return;
      }
      if (password.length < 8) {
        setStatus("Password must be at least 8 characters.", "error");
        return;
      }
      if (password !== confirm) {
        setStatus("Passwords do not match.", "error");
        return;
      }

      const registerEndpoint = cfg.AUTH_REGISTER_ENDPOINT || "";
      if (!registerEndpoint) {
        setStatus("Account requests are not available yet. Please contact us.", "error");
        return;
      }

      const postUrl = getApiUrl(registerEndpoint);
      if (!postUrl) {
        setStatus("Account requests are not available yet. Please contact us.", "error");
        return;
      }

      setStatus("Creating account...");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          body: JSON.stringify({ fullName, email, phone, password })
        });

        const data = await res.json().catch(() => ({ error: "Invalid response from server" }));
        
        if (!res.ok) {
          const errorMsg = data.error || data.message || `Request failed (${res.status})`;
          throw new Error(errorMsg);
        }

        // Show verification step
        registeredEmail = email;
        setStatus(data.message || "✓ Verification code sent to your email!", "ok");
        
        // Switch to step 2
        if (step1) step1.classList.add("hidden");
        if (step2) step2.classList.remove("hidden");
        
      } catch (err) {
        console.error("❌ Registration error:", err);
        setStatus(err.message || "Request failed.", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // Verify code button
    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener("click", async () => {
        const code = (qs("#rVerifyCode")?.value || "").trim();
        
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
          setVerifyStatus("Please enter a valid 6-digit code.", "error");
          return;
        }

        const verifyEndpoint = cfg.AUTH_VERIFY_ENDPOINT || "";
        if (!verifyEndpoint) {
          setVerifyStatus("Verification is not available. Please contact us.", "error");
          return;
        }

        const postUrl = getApiUrl(verifyEndpoint);
        setVerifyStatus("Verifying...");
        verifyCodeBtn.disabled = true;

        try {
          const res = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",
            body: JSON.stringify({ email: registeredEmail, code })
          });

          const data = await res.json().catch(() => ({ error: "Invalid response" }));
          
          if (!res.ok) {
            throw new Error(data.error || `Verification failed (${res.status})`);
          }

          setVerifyStatus("✓ Email verified! Redirecting to sign in...", "ok");
          
          // Reset form and switch back to login
          setTimeout(() => {
            form.reset();
            if (step2) step2.classList.add("hidden");
            if (step1) step1.classList.remove("hidden");
            
            // Switch to login tab
            const loginTab = qs('[data-auth-tab="login"]');
            const registerTab = qs('[data-auth-tab="register"]');
            const loginPanel = qs('[data-auth-panel="login"]');
            const registerPanel = qs('[data-auth-panel="register"]');
            
            if (loginTab) loginTab.classList.add("is-active");
            if (registerTab) registerTab.classList.remove("is-active");
            if (loginPanel) loginPanel.classList.remove("hidden");
            if (registerPanel) registerPanel.classList.add("hidden");
            
            // Pre-fill email
            const emailInput = qs("#sEmail");
            if (emailInput) emailInput.value = registeredEmail;
            
            // Show success message
            const signinStatus = qs("#signinStatus");
            if (signinStatus) {
              signinStatus.textContent = "✓ Account verified! Please sign in with your password.";
              signinStatus.className = "text-sm text-emerald-700";
            }
          }, 1500);
          
        } catch (err) {
          console.error("❌ Verification error:", err);
          setVerifyStatus(err.message || "Verification failed.", "error");
        } finally {
          verifyCodeBtn.disabled = false;
        }
      });
    }

    // Resend code button
    if (resendCodeBtn) {
      resendCodeBtn.addEventListener("click", async () => {
        if (!registeredEmail) return;
        
        setVerifyStatus("Resending code...");
        resendCodeBtn.disabled = true;

        // Just re-register with the same email (will generate new code)
        const registerEndpoint = cfg.AUTH_REGISTER_ENDPOINT || "";
        const postUrl = getApiUrl(registerEndpoint);
        
        try {
          const res = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",
            body: JSON.stringify({
              fullName: qs("#rName")?.value || "",
              email: registeredEmail,
              phone: qs("#rPhone")?.value || "",
              password: qs("#rPassword")?.value || ""
            })
          });

          const data = await res.json().catch(() => ({}));
          
          if (res.ok) {
            setVerifyStatus("✓ New code sent to your email!", "ok");
          } else {
            throw new Error(data.error || "Failed to resend code");
          }
        } catch (err) {
          console.error("❌ Resend error:", err);
          setVerifyStatus(err.message || "Failed to resend code.", "error");
        } finally {
          resendCodeBtn.disabled = false;
        }
      });
    }
  }

  function setupPortalApp() {
    const root = qs("[data-portal]");
    if (!root) return;

    const signinUrl = cfg.PORTAL_SIGNIN_URL || "../signin.html";
    const gate = qs("#portalAuthGate");
    const main = qs("#portalMain");
    const email = localStorage.getItem("hrh_auth_email") || "";
    const hasSession = Boolean(localStorage.getItem("hrh_auth_session") || localStorage.getItem("hrh_auth_token"));
    
    // Demo mode: Allow preview via ?demo=1 query param (for development/testing)
    const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "1";

    if (hasSession || isDemoMode) {
      gate?.classList.add("hidden");
      main?.classList.remove("hidden");
      const emailEl = qs("[data-portal-email]");
      if (emailEl) {
        if (isDemoMode) {
          emailEl.textContent = "Demo User (Preview Mode)";
        } else if (email) {
          emailEl.textContent = email;
        }
      }
    } else {
      gate?.classList.remove("hidden");
      main?.classList.add("hidden");
    }

    qs("[data-portal-logout]")?.addEventListener("click", () => {
      localStorage.removeItem("hrh_auth_token");
      localStorage.removeItem("hrh_auth_session");
      localStorage.removeItem("hrh_auth_email");
      window.location.href = signinUrl;
    });

    const fileInput = qs("#portalFileInput");
    const fileList = qs("#portalFileList");
    const dropZone = qs("#portalDropZone");
    const fileBtn = qs("[data-portal-file-button]");

    function renderFiles(files) {
      if (!fileList) return;
      if (!files || !files.length) {
        fileList.innerHTML = "<li>No files selected yet.</li>";
        return;
      }
      fileList.innerHTML = files.map(f => (
        `<li class=\"flex items-center justify-between border-b border-slate-200/60 py-2\">
          <span>${escapeHtml(f.name)}</span>
          <span class=\"text-xs text-slate-500\">${Math.ceil(f.size / 1024)} KB</span>
        </li>`
      )).join("");
    }

    if (fileInput) {
      renderFiles([]);
      fileInput.addEventListener("change", () => renderFiles(Array.from(fileInput.files || [])));
    }

    if (fileBtn && fileInput) {
      fileBtn.addEventListener("click", () => fileInput.click());
    }

    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("is-dragging");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("is-dragging");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("is-dragging");
        const files = Array.from(e.dataTransfer?.files || []);
        renderFiles(files);
      });
    }
  }

  function setupChatWidget() {
    if (cfg.CHATBOT_ENABLED === false) return;
    if (qs("#chatWidget")) return;

    const root = document.createElement("div");
    root.id = "chatWidget";
    root.innerHTML = `
      <button class="chat-launcher" type="button" data-chat-toggle aria-expanded="false">
        <span class="sr-only">Open help</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5">
          <path fill="currentColor" d="M12 2a9 9 0 0 0-9 9c0 2.7 1.2 5.2 3.2 6.9L6 22l4.1-1.5c.6.1 1.2.2 1.9.2a9 9 0 0 0 0-18Zm0 4.8a1 1 0 0 1 1 1v.2c0 .6-.3 1-.8 1.4-.7.5-1.2 1-1.2 2v.4h-1.5v-.5c0-1.3.7-2.1 1.4-2.6.4-.3.6-.5.6-.8 0-.4-.3-.7-.7-.7-.5 0-.9.4-1 .9l-1.5-.3c.2-1.2 1.2-2 2.7-2Zm-.2 8.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>
        </svg>
      </button>
      <div class="chat-panel hidden" data-chat-panel>
        <div class="chat-header">
          <div>
            <div class="text-sm font-semibold">${escapeHtml(cfg.CHATBOT_NAME || "HRH Assistant")}</div>
            <div class="text-xs text-slate-500">AI Assistant • Always ready to help</div>
          </div>
          <button type="button" class="text-slate-500 hover:text-slate-700" data-chat-close aria-label="Close chat">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4">
              <path fill="currentColor" d="M6.4 5l12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z"/>
            </svg>
          </button>
        </div>
        <div class="chat-body" data-chat-body></div>
        <div class="chat-suggestions" data-chat-suggestions></div>
        <div class="chat-typing hidden" data-chat-typing>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        <form class="chat-form" data-chat-form>
          <input class="chat-input" type="text" placeholder="Ask about services, hours, booking..." aria-label="Chat message" />
          <button class="chat-send" type="submit" aria-label="Send message">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);

    const toggleBtn = qs("[data-chat-toggle]", root);
    const panel = qs("[data-chat-panel]", root);
    const closeBtn = qs("[data-chat-close]", root);
    const form = qs("[data-chat-form]", root);
    const input = qs(".chat-input", root);
    const body = qs("[data-chat-body]", root);
    const suggestions = qs("[data-chat-suggestions]", root);
    const typing = qs("[data-chat-typing]", root);

    // Session state
    let chatStarted = false;
    let messageCount = 0;

    function addMsg(text, role="bot", showSuggestions=false) {
      if (!body) return;
      const div = document.createElement("div");
      div.className = role === "user" ? "chat-msg chat-user" : "chat-msg chat-bot";
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function showTyping() {
      typing?.classList.remove("hidden");
      body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
      typing?.classList.add("hidden");
    }

    function showSuggestions(suggestionTexts) {
      if (!suggestions) return;
      suggestions.innerHTML = "";
      suggestionTexts.forEach(text => {
        const btn = document.createElement("button");
        btn.className = "chat-suggestion-btn";
        btn.textContent = text;
        btn.type = "button";
        btn.addEventListener("click", () => {
          input.value = text;
          form.dispatchEvent(new Event("submit"));
        });
        suggestions.appendChild(btn);
      });
    }

    function clearSuggestions() {
      if (suggestions) suggestions.innerHTML = "";
    }

    // Enhanced knowledge base with patterns
    const kb = [
      {
        patterns: ["hour", "open", "close", "time", "when", "available", "operating"],
        answer: "Our hours are:\n• Mon-Fri: 9:30 AM-7:00 PM (closed 12:00-1:00)\n• Sat: 10:00 AM-4:00 PM (closed 12:00-1:00)\n• Sun: Closed",
        suggestions: ["Booking info", "Services", "Contact us"]
      },
      {
        patterns: ["book", "appointment", "schedule", "request", "meeting"],
        answer: "To book an appointment:\n1. Visit the Booking page\n2. Select your service and preferred time\n3. We'll confirm availability and follow up by email or phone",
        suggestions: ["What services?", "Your hours?", "Contact info"]
      },
      {
        patterns: ["contact", "phone", "email", "address", "reach", "call"],
        answer: "Contact us at:\n📞 " + (cfg.phoneDisplay || "our phone") + "\n📧 " + (cfg.email || "our email") + "\n📍 " + (cfg.addressLine1 || "our location"),
        suggestions: ["Book appointment", "What services?", "Our hours?"]
      },
      {
        patterns: ["service", "support", "help", "offer", "provide", "what", "do you"],
        answer: "We offer:\n✓ Commissioner for Oaths services in Alberta\n✓ Immigration administrative support only (no consultation, advice, or representation)\n✓ Benefits and community support applications\n✓ Passport, travel and identity document admin support\n✓ Housing, family/civil form admin and system navigation\n\nVisit Services page for details.",
        suggestions: ["Book now", "Contact us", "Our hours?"]
      },
      {
        patterns: ["portal", "upload", "document", "file", "client", "account"],
        answer: "The client portal is ready for:\n✓ Document uploads (coming soon)\n✓ Access to your records\n✓ Service history\n\nSign in or contact us for access.",
        suggestions: ["How to sign in?", "Other services", "Contact"]
      },
      {
        patterns: ["cost", "price", "fee", "how much", "charge", "expensive"],
        answer: "Pricing varies by service. Contact us for a scope review and we'll provide a detailed quote before work begins.",
        suggestions: ["Services", "Contact", "Book appointment"]
      },
      {
        patterns: ["employment", "job", "work", "career", "position"],
        answer: "Employment-related services are not currently offered. We can still help with benefits, commissioning, immigration administrative support, travel documents, housing forms, and system navigation.",
        suggestions: ["Services", "Book now", "Contact us"]
      },
      {
        patterns: ["immigration", "visa", "permit", "refugee", "sponsorship"],
        answer: "We provide immigration administrative support only, such as account setup, form-entry support from client-provided information, uploads, tracker access, webforms, PR card renewal/replacement admin support, citizenship admin support, IQAS/WES, and package organization. We do not provide immigration consultation, legal advice, eligibility advice, program selection, strategy, or representation.",
        suggestions: ["Contact", "Appointment", "Services"]
      },
      {
        patterns: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"],
        answer: "Hello! Welcome to Harmony Resource Hub. How can I assist you today?",
        suggestions: ["Services", "Book appointment", "Contact us"]
      },
      {
        patterns: ["thank", "thanks", "appreciate", "grateful"],
        answer: "You're welcome! Is there anything else I can help you with?",
        suggestions: ["Services", "Book", "Hours"]
      }
    ];

    function getReply(msg) {
      const text = msg.toLowerCase().trim();
      
      // Exact matches first
      for (const item of kb) {
        if (item.patterns.some(p => text.includes(p))) {
          return { answer: item.answer, suggestions: item.suggestions };
        }
      }

      // Fallback response
      return {
        answer: "I'm here to help! I can answer questions about:\n• Hours & availability\n• Booking appointments\n• Our services\n• Contact information\n\nWhat would you like to know?",
        suggestions: ["Hours", "Services", "Contact us", "Book now"]
      };
    }

    function openChat() {
      panel?.classList.remove("hidden");
      toggleBtn?.setAttribute("aria-expanded", "true");
      
      if (body && body.childElementCount === 0 && !chatStarted) {
        chatStarted = true;
        
        // Privacy warning on first open
        const privacyMsg = "⚠️ Privacy Notice: Please do NOT share personal information (SIN, passwords, credit cards, health info) in this chat. This is a public chat session. For sensitive matters, please contact us directly.";
        addMsg(privacyMsg, "bot");
        
        setTimeout(() => {
          addMsg("Hi! I'm your HRH Assistant. How can I help you today?", "bot");
          showSuggestions(["View hours", "Book appointment", "Learn about services", "Contact info"]);
        }, 600);
      }
      
      input?.focus();
    }

    function closeChat() {
      panel?.classList.add("hidden");
      toggleBtn?.setAttribute("aria-expanded", "false");
    }

    toggleBtn?.addEventListener("click", () => {
      if (panel?.classList.contains("hidden")) openChat();
      else closeChat();
    });
    closeBtn?.addEventListener("click", closeChat);

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = (input?.value || "").trim();
      if (!msg) return;
      
      addMsg(msg, "user");
      clearSuggestions();
      input.value = "";
      messageCount++;
      
      // Show typing indicator
      showTyping();
      
      setTimeout(() => {
        hideTyping();
        const reply = getReply(msg);
        addMsg(reply.answer, "bot");
        
        // Show suggestions for next question
        setTimeout(() => {
          showSuggestions(reply.suggestions);
        }, 300);
      }, 600 + Math.random() * 400);
    });
  }

  function setupGoogleSignIn() {
    const googleBtn = qs("#googleSignInBtn");
    if (!googleBtn) return;

    const status = qs("#signinStatus");
    
    function setStatus(msg, kind="info") {
      if (!status) return;
      status.textContent = msg;
      status.className = "text-sm " + (kind === "ok" ? "text-emerald-700" :
        kind === "error" ? "text-rose-700" : "text-slate-600");
    }

    // Check if Google OAuth is enabled and configured
    const googleClientId = cfg.GOOGLE_CLIENT_ID || "";
    const googleEnabled = cfg.GOOGLE_OAUTH_ENABLED === true;

    if (!googleEnabled || !googleClientId) {
      googleBtn.addEventListener("click", () => {
        setStatus("Google Sign-In is not yet configured. Please use email sign-in or contact admin.", "info");
      });
      return;
    }

    // Initialize Google Sign-In
    googleBtn.addEventListener("click", async () => {
      try {
        // Check if Google Identity Services is loaded
        if (typeof google === 'undefined' || !google.accounts) {
          setStatus("Google Sign-In library not loaded. Please refresh and try again.", "error");
          return;
        }

        setStatus("Initializing Google Sign-In...");

        // Initialize the Google OAuth client
        const client = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (response) => {
            if (response.error) {
              setStatus("Google Sign-In failed: " + response.error, "error");
              return;
            }

            try {
              // Get user info from Google
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  'Authorization': `Bearer ${response.access_token}`
                }
              });

              if (!userInfoResponse.ok) {
                throw new Error("Failed to get user information from Google");
              }

              const userInfo = await userInfoResponse.json();
              const email = userInfo.email;
              const name = userInfo.name || "";

              // Send to backend for verification and session creation
              const loginEndpoint = cfg.AUTH_LOGIN_ENDPOINT || cfg.AUTH_ENDPOINT || "";
              const postUrl = getApiUrl(loginEndpoint);

              const res = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "omit",
                body: JSON.stringify({ 
                  email, 
                  googleToken: response.access_token,
                  googleId: userInfo.sub,
                  name,
                  authMethod: "google"
                })
              });

              const data = await res.json().catch(() => ({ error: "Invalid response from server" }));
              
              if (!res.ok) {
                const errorMsg = data.error || data.message || `Google Sign-In failed (${res.status})`;
                throw new Error(errorMsg);
              }

              // Store session data
              const token = data.token || data.session || data.jwt || "";
              if (token) localStorage.setItem("hrh_auth_token", token);
              localStorage.setItem("hrh_auth_session", "true");
              localStorage.setItem("hrh_auth_email", email);

              setStatus("Google sign-in successful! Redirecting to portal...", "ok");
              
              // Redirect to portal
              setTimeout(() => {
                const target = cfg.PORTAL_URL || "portal/";
                window.location.href = target;
              }, 500);
              
            } catch (err) {
              setStatus(err.message || "Google Sign-In failed.", "error");
            }
          },
        });

        // Request the access token
        client.requestAccessToken();

      } catch (err) {
        setStatus("Google Sign-In failed. Please try email sign-in.", "error");
        console.error("Google Sign-In error:", err);
      }
    });
  }

  async function loadDynamicServices() {
    const container = qs("#dynamicServices");
    if (!container) return;

    try {
      const endpoint = getApiUrl("/api/services");
      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "omit"
      });

      if (!res.ok) throw new Error("Failed to load services");

      const result = await res.json();
      const services = result.data?.featured || [];

      if (services.length === 0) {
        container.innerHTML = '<p class="text-slate-600 text-sm">No services available at this time.</p>';
        return;
      }

      container.innerHTML = services.map(service => `
        <article class="dynamic-service-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <img src="${escapeAttr(service.image || "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80")}" alt="${escapeAttr(service.alt || service.name)}" class="h-44 w-full object-cover">
          <div class="p-5">
            <div class="text-sm font-semibold">${escapeHtml(service.name)}</div>
            <div class="mt-1 text-sm font-bold text-brand-700">${escapeHtml(service.price)}</div>
            <div class="mt-2 text-xs leading-5 text-slate-600">${escapeHtml(service.description)}</div>
          </div>
        </article>
      `).join("");

    } catch (err) {
      console.error("Failed to load services:", err);
      container.innerHTML = '<p class="text-slate-600 text-sm">Unable to load services. Please try again later.</p>';
    }
  }

  async function loadServiceCategories() {
    const container = qs("#serviceCategories");
    if (!container) return;

    try {
      const endpoint = getApiUrl("/api/services");
      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "omit"
      });

      if (!res.ok) throw new Error("Failed to load service categories");

      const result = await res.json();
      const categories = result.data?.categories || [];

      if (categories.length === 0) return;

      container.innerHTML = categories.map(cat => `
        <article class="dynamic-service-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <img src="${escapeAttr(cat.image || "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80")}" alt="${escapeAttr(cat.alt || cat.name)}" class="h-44 w-full object-cover">
          <div class="p-6">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">${escapeHtml(cat.name)}</div>
              ${cat.badge ? `<span class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">${escapeHtml(cat.badge)}</span>` : ""}
            </div>
            <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(cat.description)}</p>
            ${cat.note ? `<p class="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">${escapeHtml(cat.note)}</p>` : ""}
            <a class="mt-4 inline-flex items-center text-sm font-medium text-slate-900 hover:underline" href="/booking" target="_blank" rel="noopener noreferrer">Book →</a>
          </div>
        </article>
      `).join("");

    } catch (err) {
      console.error("Failed to load service categories:", err);
    }
  }

  window.HRH_APP = { PRICING };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      injectCommon();
      setupMobileMenu();
      highlightActiveNav();
      renderPricingTable();
      renderBookingServiceOptions();
      setupBookingForm();
      setupContactForm();
      setupRotatingText();
      loadDynamicServices();
      loadServiceCategories();
      setupAuthTabs();
      setupSignInForm();
      setupRegisterForm();
      setupGoogleSignIn();
      setupPortalApp();
      setupChatWidget();
      initMapIfPresent();
      initFlatpickrIfPresent();
    } catch (err) {
      console.error("❌ Initialization error:", err);
      console.error(err.stack);
    }
  });
})();
