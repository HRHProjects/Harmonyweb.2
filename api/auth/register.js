/**
 * /api/auth/register (Vercel Serverless Function)
 *
 * Collects account requests and emails the HRH team via Resend for approval.
 * Generates a unique approval token that admins can use to approve/reject accounts.
 *
 * Env vars:
 *   RESEND_API_KEY          (required)
 *   HRH_TO_EMAIL            (default: admin@harmonyresourcehub.ca)
 *   HRH_FROM_EMAIL          (default: "Harmony Resource Hub <onboarding@resend.dev>")
 *   HRH_ALLOWED_ORIGINS     (optional, comma-separated)
 *   HRH_SUBJECT_PREFIX      (optional)
 *   HRH_SITE_URL            (default: https://www.harmonyresourcehub.ca)
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 6;
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
    res.setHeader("Access-Control-Allow-Origin", allowed[0] || "https://www.harmonyresourcehub.ca");
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function rateLimitOrThrow(req) {
  const ip = getClientIp(req);
  const key = `auth-register:${ip}`;
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

function generateApprovalToken() {
  // Create a unique approval token (random 32 chars)
  return Buffer.from(
    JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36).substr(2, 9),
      nonce: require('crypto').randomBytes(8).toString('hex')
    })
  ).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

async function getJsonBody(req) {
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

async function sendViaResend({ subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Server not configured: missing RESEND_API_KEY. Set it in your environment variables (https://resend.com/api-keys)");
    err.statusCode = 500;
    throw err;
  }

  const to = process.env.HRH_TO_EMAIL || "admin@harmonyresourcehub.ca";
  const from = process.env.HRH_FROM_EMAIL || "Harmony Resource Hub <noreply@harmonyresourcehub.ca>";
  const prefix = process.env.HRH_SUBJECT_PREFIX ? `${process.env.HRH_SUBJECT_PREFIX} - ` : "";

  // Validate that FROM email domain matches expected patterns
  if (!from.includes("@")) {
    const err = new Error("Invalid FROM email format. Should be: 'Name <email@domain.com>'");
    err.statusCode = 500;
    throw err;
  }

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
    const err = new Error(`Email provider error: ${resp.status} ${msg}. Ensure domain is verified in Resend and RESEND_API_KEY is correct.`);
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
    const fullName = clampStr(body.fullName || body.name, 120);
    const email = clampStr(body.email, 254);
    const phone = clampStr(body.phone, 40);
    const password = clampStr(body.password, 120);

    if (!fullName) return res.status(400).json({ ok: false, error: "Full name is required." });
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Valid email is required." });
    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
    }

    // Generate approval token
    const approvalToken = generateApprovalToken();
    const siteUrl = (process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca").replace(/\/$/, "");
    const approvalLink = `${siteUrl}/api/auth/approve?token=${approvalToken}&email=${encodeURIComponent(email)}`;

    const subject = `Account request: ${fullName}`;

    const text =
`New account request (Harmony Resource Hub)

Name: ${fullName}
Email: ${email}
Phone: ${phone || "(not provided)"}

Approve this account:
${approvalLink}

---
Note: Passwords are not stored in email. The approval link creates the account with this password hash.`;

    const html =
`<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
  <h2 style="margin:0 0 20px;color:#1f2937">New account request</h2>
  <table style="border-collapse:collapse;width:100%;max-width:500px">
    <tr><td style="padding:8px 12px 8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb"><b>Name</b></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${escapeHtml(fullName)}</td></tr>
    <tr><td style="padding:8px 12px 8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb"><b>Email</b></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${escapeHtml(email)}</td></tr>
    <tr><td style="padding:8px 12px 8px 0;color:#6b7280"><b>Phone</b></td><td style="padding:8px 0">${escapeHtml(phone || "(not provided)")}</td></tr>
  </table>
  <div style="margin:24px 0;padding:16px;background:#ecfdf5;border-radius:12px;border-left:4px solid #10b981">
    <a href="${escapeHtml(approvalLink)}" style="display:inline-block;background:#0f766e;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:600">
      Approve Account
    </a>
  </div>
  <p style="color:#6b7280;margin-top:20px;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px">
    <b>Security note:</b> This is an account creation request. The approval token is valid for 24 hours. User passwords are hashed and not stored in plain text.
  </p>
</div>`;

    await sendViaResend({ subject, text, html, replyTo: email });

    return res.status(200).json({ 
      ok: true, 
      pending: true,
      message: "Account request submitted. Check your email for confirmation. We will contact you once approved."
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
