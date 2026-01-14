/**
 * /api/auth/login (Vercel Serverless Function)
 *
 * Minimal login for the client portal.
 * Checks both hardcoded ALLOWED_USERS and dynamically approved accounts.
 *
 * Env vars:
 *   HRH_AUTH_PASSWORD      (required)
 *   HRH_ALLOWED_USERS      (optional, comma-separated list of emails)
 *   HRH_AUTH_EMAIL         (optional, single allowed email)
 *   HRH_ALLOWED_ORIGINS    (optional, comma-separated list of origins)
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 10;
const state = globalThis.__HRH_RATE_STATE__ || (globalThis.__HRH_RATE_STATE__ = new Map());

// Shared approval storage (synced with approve.js)
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
  const key = `auth-login:${ip}`;
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

function getAllowedEmails() {
  const list = (process.env.HRH_ALLOWED_USERS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (list.length) return list;

  const single = (process.env.HRH_AUTH_EMAIL || "").trim().toLowerCase();
  return single ? [single] : [];
}

function base64Url(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    rateLimitOrThrow(req);

    const body = await getJsonBody(req);
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Valid email is required." });
    }

    const allowed = getAllowedEmails();
    const authPassword = process.env.HRH_AUTH_PASSWORD || "";

    // Check if user is approved via the approval system
    const isApproved = approvedAccounts.has(email) && approvedAccounts.get(email).approved === true;
    const isConfigured = authPassword && (allowed.length > 0 || isApproved);

    if (!authPassword || !isConfigured) {
      return res.status(503).json({
        ok: false,
        error: "Authentication is not configured yet. Please contact us for access."
      });
    }

    // Check if user is in allowed list OR has been approved
    const isAllowed = allowed.includes(email) || isApproved;

    if (!isAllowed || password !== authPassword) {
      return res.status(401).json({ ok: false, error: "Invalid credentials." });
    }

    const token = base64Url(`${email}:${Date.now()}:${Math.random()}`);
    return res.status(200).json({ ok: true, token, email, expiresIn: 8 * 60 * 60 });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
