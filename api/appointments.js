/**
 * /api/appointments (Vercel Serverless Function)
 *
 * Sends appointment requests to HRH via Resend.
 *
 * Env vars (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY          (required)
 *   HRH_TO_EMAIL            (default: admin@harmonyresourcehub.ca)
 *   HRH_FROM_EMAIL          (default: "Harmony Resource Hub <onboarding@resend.dev>" for testing)
 *   HRH_ALLOWED_ORIGINS     (comma-separated) e.g. "https://www.harmonyresourcehub.ca,https://harmonyresourcehub.ca"
 *   HRH_SUBJECT_PREFIX      (optional) e.g. "HRH Website"
 *
 * Payload compatibility:
 * Accepts either:
 *   fullName / email / phone
 * or legacy front-end keys:
 *   clientName / clientEmail / clientPhone
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 6; // per IP per window
const state = globalThis.__HRH_RATE_STATE__ || (globalThis.__HRH_RATE_STATE__ = new Map());

function now() { return Date.now(); }

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function parseAllowedOrigins() {
  const envList = (process.env.HRH_ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  if (envList.length) return envList;

  const defaults = [
    "https://www.harmonyresourcehub.ca",
    "https://harmonyresourcehub.ca"
  ];

  if (process.env.VERCEL_URL) {
    defaults.unshift(`https://${process.env.VERCEL_URL}`);
  }

  return defaults;
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowed = parseAllowedOrigins();

  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    // Unknown origin: do not mirror it.
    res.setHeader("Access-Control-Allow-Origin", allowed[0] || "https://www.harmonyresourcehub.ca");
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function rateLimitOrThrow(req) {
  const ip = getClientIp(req);
  const key = `appointments:${ip}`;
  const t = now();

  const arr = state.get(key) || [];
  const fresh = arr.filter(ts => (t - ts) < RATE_WINDOW_MS);
  fresh.push(t);
  state.set(key, fresh);

  if (fresh.length > RATE_MAX) {
    const err = new Error("Too many requests. Please wait and try again.");
    err.statusCode = 429;
    throw err;
  }
}

function clampStr(v, max) {
  return (v ?? "").toString().trim().slice(0, max);
}

function isValidEmail(email) {
  const e = (email || "").toString().trim();
  if (e.length < 6 || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getJsonBody(req) {
  // Vercel often pre-parses JSON for serverless, but support raw streams too.
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }

  const chunks = [];
  for await (const c of req) chunks.push(Buffer.from(c));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function spamCheck(payload) {
  // Honeypot fields (should be empty)
  const hp = clampStr(payload.hp || payload.website || payload.company || payload.address2, 200);
  if (hp) return { ok: false, reason: "Spam detected." };

  // Time-to-submit heuristic (optional)
  const startedAt = Number(payload.startedAt || payload.formStartedAt || payload._startedAt);
  if (Number.isFinite(startedAt)) {
    const elapsed = now() - startedAt;
    if (elapsed < 1800) return { ok: false, reason: "Submission too fast." }; // < 1.8s
    if (elapsed > 24 * 60 * 60 * 1000) return { ok: false, reason: "Stale form." };
  }

  // Links not allowed in booking notes
  const msg = (payload.message || payload.serviceMessage || payload.notes || "").toString();
  const lower = msg.toLowerCase();
  const linkHits = (lower.match(/https?:\/\/|www\./g) || []).length;
  if (linkHits >= 1) return { ok: false, reason: "Links are not allowed in this form." };

  return { ok: true };
}

async function sendViaResend({ subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Server not configured: missing RESEND_API_KEY");
    err.statusCode = 500;
    throw err;
  }

  const to = process.env.HRH_TO_EMAIL || "admin@harmonyresourcehub.ca";
  const from = process.env.HRH_FROM_EMAIL || "Harmony Resource Hub <onboarding@resend.dev>";
  const prefix = process.env.HRH_SUBJECT_PREFIX ? `${process.env.HRH_SUBJECT_PREFIX} - ` : "";

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: `${prefix}${subject}`,
      text,
      html,
      reply_to: replyTo || undefined
    })
  });

  if (!resp.ok) {
    const msg = await resp.text();
    const err = new Error(`Email provider error: ${resp.status} ${msg}`);
    err.statusCode = 502;
    throw err;
  }
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    rateLimitOrThrow(req);

    const body = await getJsonBody(req);

    // Accept both new and legacy keys
    const fullName = clampStr(body.fullName || body.clientName || body.name, 120);
    const email = clampStr(body.email || body.clientEmail, 254);
    const phone = clampStr(body.phone || body.clientPhone, 40);

    const service = clampStr(body.service || body.serviceSelected || "", 180);
    const otherService = clampStr(body.otherService || body.otherServiceText || "", 180);
    const appointmentType = clampStr(body.appointmentType || body.appointment_mode || "", 80);
    const preferredDateTime = clampStr(body.preferredDateTime || body.preferred || body.dateTime || "", 80);

    const message = clampStr(
      body.message || body.serviceMessage || body.notes || "",
      4000
    );

    if (!fullName) return res.status(400).json({ ok: false, error: "Full name is required." });
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Valid email is required." });

    // If "Other" service is selected, require a description
    const effectiveService = (service.toLowerCase() === "other" || service === "Other") && otherService
      ? `Other - ${otherService}`
      : service;

    if (!effectiveService) return res.status(400).json({ ok: false, error: "Service is required." });
    if ((service.toLowerCase() === "other" || service === "Other") && !otherService) {
      return res.status(400).json({ ok: false, error: "Please describe the service under 'Other'." });
    }
    if (!appointmentType) return res.status(400).json({ ok: false, error: "Appointment type is required." });

    const spam = spamCheck(body);
    if (!spam.ok) return res.status(400).json({ ok: false, error: spam.reason });

    const subject = `Appointment request: ${effectiveService}`;

    const text =
`New appointment request (Harmony Resource Hub)

Name: ${fullName}
Email: ${email}
Phone: ${phone || "(not provided)"}

Service: ${effectiveService}
Appointment type: ${appointmentType}
Preferred date/time: ${preferredDateTime || "(not provided)"}

Client message:
${message || "(none)"}

Client was instructed not to submit sensitive details (SIN, passport numbers, banking info).`;

    const html =
`<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
  <h2 style="margin:0 0 10px">New appointment request</h2>
  <table style="border-collapse:collapse">
    <tr><td style="padding:4px 10px 4px 0"><b>Name</b></td><td style="padding:4px 0">${escapeHtml(fullName)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Email</b></td><td style="padding:4px 0">${escapeHtml(email)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Phone</b></td><td style="padding:4px 0">${escapeHtml(phone || "(not provided)")}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Service</b></td><td style="padding:4px 0">${escapeHtml(effectiveService)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Appointment type</b></td><td style="padding:4px 0">${escapeHtml(appointmentType)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Preferred date/time</b></td><td style="padding:4px 0">${escapeHtml(preferredDateTime || "(not provided)")}</td></tr>
  </table>
  <h3 style="margin:14px 0 6px">Client message</h3>
  <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fafafa">${escapeHtml(message || "(none)")}</div>
  <p style="color:#6b7280;margin-top:12px;font-size:12px">
    Client was instructed not to submit sensitive details (SIN, passport numbers, banking info).
  </p>
</div>`;

    await sendViaResend({ subject, text, html, replyTo: email });

    return res.status(200).json({ ok: true });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
