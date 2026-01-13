/**
 * /api/contact (Vercel Serverless Function)
 *
 * Sends contact form messages to HRH via Resend.
 *
 * Env vars: same as /api/appointments
 *
 * Payload compatibility:
 * Accepts either:
 *   fullName / email / phone / topic / message
 * or legacy keys:
 *   name / clientName, clientEmail, clientPhone, subject
 */

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 10; // per IP per window
const state = globalThis.__HRH_RATE_STATE__ || (globalThis.__HRH_RATE_STATE__ = new Map());

function now() { return Date.now(); }

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function parseAllowedOrigins() {
  return (process.env.HRH_ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
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
  const key = `contact:${ip}`;
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
    if (elapsed < 1500) return { ok: false, reason: "Submission too fast." };
    if (elapsed > 24 * 60 * 60 * 1000) return { ok: false, reason: "Stale form." };
  }

  // Content heuristics (mild, to reduce false positives)
  const msg = (payload.message || "").toString();
  const lower = msg.toLowerCase();

  let score = 0;
  const linkHits = (lower.match(/https?:\/\/|www\./g) || []).length;
  if (linkHits >= 2) score += 4;
  if (linkHits === 1) score += 1;

  const bad = [
    "viagra", "casino", "porn", "escort", "forex", "crypto investment",
    "telegram me", "whatsapp me", "guaranteed profit", "loan offer", "click here"
  ];
  for (const w of bad) {
    if (lower.includes(w)) score += 3;
  }

  if (msg.trim().length > 0 && msg.trim().length < 8) score += 1;
  if (score >= 5) return { ok: false, reason: "Message blocked as spam." };

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

    const fullName = clampStr(body.fullName || body.clientName || body.name, 120);
    const email = clampStr(body.email || body.clientEmail, 254);
    const phone = clampStr(body.phone || body.clientPhone, 40);
    const topic = clampStr(body.topic || body.subject || "", 120);
    const message = clampStr(body.message || "", 4000);

    if (!fullName) return res.status(400).json({ ok: false, error: "Full name is required." });
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Valid email is required." });
    if (!message) return res.status(400).json({ ok: false, error: "Message is required." });

    const spam = spamCheck(body);
    if (!spam.ok) return res.status(400).json({ ok: false, error: spam.reason });

    const subject = `Website contact: ${topic || "General inquiry"}`;

    const text =
`New contact message (Harmony Resource Hub)

Name: ${fullName}
Email: ${email}
Phone: ${phone || "(not provided)"}
Topic: ${topic || "(not provided)"}

Message:
${message}`;

    const html =
`<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
  <h2 style="margin:0 0 10px">New contact message</h2>
  <table style="border-collapse:collapse">
    <tr><td style="padding:4px 10px 4px 0"><b>Name</b></td><td style="padding:4px 0">${escapeHtml(fullName)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Email</b></td><td style="padding:4px 0">${escapeHtml(email)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Phone</b></td><td style="padding:4px 0">${escapeHtml(phone || "(not provided)")}</td></tr>
    <tr><td style="padding:4px 10px 4px 0"><b>Topic</b></td><td style="padding:4px 0">${escapeHtml(topic || "(not provided)")}</td></tr>
  </table>
  <h3 style="margin:14px 0 6px">Message</h3>
  <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fafafa">${escapeHtml(message)}</div>
</div>`;

    await sendViaResend({ subject, text, html, replyTo: email });

    return res.status(200).json({ ok: true });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ ok: false, error: e.message || "Server error" });
  }
};
