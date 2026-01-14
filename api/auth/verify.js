/**
 * /api/auth/verify (Vercel Serverless Function)
 *
 * Check if an account has been approved by admin.
 * Called by the frontend after registration to poll for approval status.
 * 
 * POST request body:
 *   email - Email address to check
 *
 * Env vars:
 *   HRH_ALLOWED_ORIGINS     (optional, comma-separated)
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 30; // Allow frequent polling
const state = globalThis.__HRH_VERIFY_RATE_STATE__ || (globalThis.__HRH_VERIFY_RATE_STATE__ = new Map());

// Shared approval storage (same as approve.js)
const approvedAccounts = globalThis.__HRH_APPROVED_ACCOUNTS__ || (globalThis.__HRH_APPROVED_ACCOUNTS__ = new Map());

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
  const key = `auth-verify:${ip}`;
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

function isValidEmail(email) {
  const e = (email || "").toString().trim();
  if (e.length < 6 || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
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

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    rateLimitOrThrow(req);

    const body = await getJsonBody(req);
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Valid email is required." });
    }

    const accountStatus = approvedAccounts.get(email);

    if (!accountStatus) {
      // Account not yet processed
      return res.status(200).json({
        ok: true,
        approved: false,
        pending: true,
        message: "Your account request is pending review."
      });
    }

    if (accountStatus.approved) {
      return res.status(200).json({
        ok: true,
        approved: true,
        pending: false,
        message: "Your account has been approved! Check your email for sign-in instructions.",
        approvedAt: accountStatus.approvedAt
      });
    }

    // Account was rejected
    return res.status(200).json({
      ok: true,
      approved: false,
      rejected: true,
      pending: false,
      message: "Your account request was not approved. Please contact us for more information."
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
