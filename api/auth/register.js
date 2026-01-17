/**
 * /api/auth/register (Vercel Serverless Function)
 *
 * User registration with email verification code.
 * Sends 6-digit verification code to user's email.
 *
 * Env vars:
 *   RESEND_API_KEY          (required)
 *   HRH_FROM_EMAIL          (default: "Harmony Resource Hub <noreply@harmonyresourcehub.ca>")
 *   HRH_ALLOWED_ORIGINS     (optional, comma-separated)
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 6;
const state = globalThis.__HRH_RATE_STATE__ || (globalThis.__HRH_RATE_STATE__ = new Map());

// Store verification codes (email -> {code, expiresAt, password, fullName})
const verificationCodes = globalThis.__HRH_VERIFICATION_CODES__ || (globalThis.__HRH_VERIFICATION_CODES__ = new Map());

// Store verified accounts (email -> {verified, verifiedAt, fullName, password})
const verifiedAccounts = globalThis.__HRH_VERIFIED_ACCOUNTS__ || (globalThis.__HRH_VERIFIED_ACCOUNTS__ = new Map());

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
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
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

function generateVerificationCode() {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt or similar
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
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

async function sendViaResend({ subject, text, html, replyTo, to }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Server not configured: missing RESEND_API_KEY. Set it in your environment variables (https://resend.com/api-keys)");
    err.statusCode = 500;
    throw err;
  }

  const toEmail = to || process.env.HRH_TO_EMAIL || "admin@harmonyresourcehub.ca";
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
      to: toEmail,
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

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
    const passwordHash = hashPassword(password);

    // Store verification code
    verificationCodes.set(email.toLowerCase(), {
      code: verificationCode,
      expiresAt,
      password: passwordHash,
      fullName,
      phone
    });

    const subject = `Verify your email - ${fullName}`;

    const text =
`Welcome to Harmony Resource Hub!

Your verification code is: ${verificationCode}

This code will expire in 15 minutes.

If you didn't request this, please ignore this email.`;

    const html =
`<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45;max-width:600px;margin:0 auto">
  <h2 style="margin:0 0 20px;color:#1f2937">Welcome to Harmony Resource Hub!</h2>
  <p style="color:#374151;margin-bottom:24px">Hi ${escapeHtml(fullName)},</p>
  <p style="color:#374151;margin-bottom:24px">Thank you for creating an account. Please verify your email address by entering this code:</p>
  <div style="text-align:center;margin:32px 0;padding:24px;background:#f3f4f6;border-radius:12px">
    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0f766e">${verificationCode}</div>
  </div>
  <p style="color:#6b7280;font-size:14px;margin-top:24px">This code will expire in 15 minutes.</p>
  <p style="color:#6b7280;font-size:14px;margin-top:16px">If you didn't request this, please ignore this email.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
  <p style="color:#9ca3af;font-size:12px">Harmony Resource Hub<br/>Fort McMurray, AB</p>
</div>`;

    await sendViaResend({ subject, text, html, replyTo: undefined, to: email });

    return res.status(200).json({ 
      ok: true,
      requiresVerification: true,
      message: "Verification code sent to your email. Please check your inbox and enter the code to complete registration."
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
