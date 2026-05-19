/**
 * /api/auth/verify (Vercel Serverless Function)
 *
 * Verify user's email with the 6-digit code sent during registration.
 * 
 * POST request body:
 *   email - Email address
 *   code - 6-digit verification code
 *
 * Env vars:
 *   HRH_ALLOWED_ORIGINS     (optional, comma-separated)
 */

const {
  deleteVerification,
  getPersistentStoreSetupError,
  getStorageMode,
  getVerification,
  getVerifiedAccount,
  normalizeEmail,
  setVerifiedAccount
} = require("./_auth-store");

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 30;
const state = globalThis.__HRH_VERIFY_RATE_STATE__ || (globalThis.__HRH_VERIFY_RATE_STATE__ = new Map());

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
    const email = normalizeEmail(body.email);
    const code = (body.code || "").toString().trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Valid email is required." });
    }

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ ok: false, error: "Valid 6-digit code is required." });
    }
    const storageError = getPersistentStoreSetupError();
    if (process.env.VERCEL && storageError) {
      return res.status(503).json({ ok: false, error: storageError });
    }

    // Check if already verified
    const existingAccount = await getVerifiedAccount(email);
    if (existingAccount?.verified) {
      return res.status(200).json({
        ok: true,
        verified: true,
        storage: getStorageMode(),
        message: "Email already verified. You can now sign in."
      });
    }

    // Check verification code
    const verification = await getVerification(email);

    if (!verification) {
      return res.status(400).json({
        ok: false,
        error: "No verification code found. Please register first."
      });
    }

    // Check if code expired
    if (Date.now() > verification.expiresAt) {
      await deleteVerification(email);
      return res.status(400).json({
        ok: false,
        error: "Verification code expired. Please register again."
      });
    }

    // Verify code
    if (verification.code !== code) {
      return res.status(400).json({
        ok: false,
        error: "Invalid verification code. Please try again."
      });
    }

    // Code is valid - mark account as verified
    await setVerifiedAccount(email, {
      email,
      verified: true,
      verifiedAt: new Date().toISOString(),
      fullName: verification.fullName,
      password: verification.password,
      phone: verification.phone,
      authMethod: "email"
    });

    // Remove verification code
    await deleteVerification(email);

    return res.status(200).json({
      ok: true,
      verified: true,
      storage: getStorageMode(),
      message: "Email verified successfully! You can now sign in."
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
