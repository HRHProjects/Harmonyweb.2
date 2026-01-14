/**
 * /api/auth/approve (Vercel Serverless Function)
 *
 * Admin approval endpoint for account requests.
 * Sent in emails to admin@harmonyresourcehub.ca
 * 
 * Query params:
 *   token  - Approval token generated during registration
 *   email  - Email of the account to approve
 *   action - 'approve' or 'reject' (default: approve)
 *
 * Env vars:
 *   RESEND_API_KEY          (required for sending emails)
 *   HRH_FROM_EMAIL          (default: "Harmony Resource Hub <onboarding@resend.dev>")
 *   HRH_ALLOWED_ORIGINS     (optional, comma-separated)
 *   HRH_SITE_URL            (default: https://www.harmonyresourcehub.ca)
 *   HRH_ADMIN_EMAIL         (optional, email to confirm approval to)
 */

const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX = 20;
const state = globalThis.__HRH_APPROVE_RATE_STATE__ || (globalThis.__HRH_APPROVE_RATE_STATE__ = new Map());

// In-memory approval storage (for demo - replace with database in production)
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

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function rateLimitOrThrow(req) {
  const ip = getClientIp(req);
  const key = `auth-approve:${ip}`;
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

function escapeHtml(str) {
  return (str ?? "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendViaResend({ subject, text, html, replyTo, to }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error("Server not configured: missing RESEND_API_KEY");
    err.statusCode = 500;
    throw err;
  }

  const toEmail = to || process.env.HRH_ADMIN_EMAIL || "admin@harmonyresourcehub.ca";
  const from = process.env.HRH_FROM_EMAIL || "Harmony Resource Hub <onboarding@resend.dev>";

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: toEmail,
      subject,
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
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    rateLimitOrThrow(req);

    const { token, email, action } = req.method === "GET" ? req.query : await (async () => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      return body;
    })();

    if (!token || !email) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing token or email parameter" 
      });
    }

    const approvalAction = (action || "approve").toLowerCase();
    if (!["approve", "reject"].includes(approvalAction)) {
      return res.status(400).json({ 
        ok: false, 
        error: "Action must be 'approve' or 'reject'" 
      });
    }

    // In a production system, validate the token against a database
    // For now, we'll store approved accounts in memory
    const accountKey = `${email}:${token}`;

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    rateLimitOrThrow(req);

    const { token, email, action } = req.method === "GET" ? req.query : await (async () => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      return body;
    })();

    if (!token || !email) {
      // Browser request - render error page
      if (req.method === "GET") {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Approval Error | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center rounded-full bg-red-50 w-16 h-16">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h1 class="mt-4 text-2xl font-semibold text-slate-900">Invalid approval link</h1>
                  <p class="mt-2 text-slate-600">The approval link is missing required information.</p>
                  <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800">
                    Return home
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(400).json({ 
        ok: false, 
        error: "Missing token or email parameter" 
      });
    }

    const approvalAction = (action || "approve").toLowerCase();
    if (!["approve", "reject"].includes(approvalAction)) {
      if (req.method === "GET") {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invalid Action | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
                <h1 class="text-2xl font-semibold text-slate-900">Invalid action</h1>
                <p class="mt-2 text-slate-600">The approval action is not valid.</p>
              </div>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(400).json({ 
        ok: false, 
        error: "Action must be 'approve' or 'reject'" 
      });
    }

    // In a production system, validate the token against a database
    // For now, we'll store approved accounts in memory
    const accountKey = `${email}:${token}`;

    if (approvalAction === "approve") {
      // Mark account as approved
      approvedAccounts.set(email, {
        approved: true,
        approvedAt: new Date().toISOString(),
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      // Send confirmation email to user
      const userSubject = "Your Harmony Resource Hub Account Has Been Approved";
      const userHtml = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
  <h2 style="margin:0 0 16px;color:#1f2937">Account Approved!</h2>
  <p style="margin:0 0 12px;color:#374151">
    Hi there,
  </p>
  <p style="margin:0 0 20px;color:#374151">
    Great news! Your account request for <b>${escapeHtml(email)}</b> has been approved. 
    You can now sign in to the client portal.
  </p>
  <div style="margin:24px 0;padding:16px;background:#f0fdf4;border-radius:12px;border-left:4px solid #10b981">
    <p style="margin:0;color:#047857">
      <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}/signin.html" 
         style="color:#0f766e;font-weight:600;text-decoration:none">
        Sign in to your account
      </a>
    </p>
  </div>
  <p style="margin:12px 0;color:#6b7280;font-size:13px">
    If you have any questions, please contact us at admin@harmonyresourcehub.ca
  </p>
</div>`;

      const userText = `Account Approved!

Hi there,

Great news! Your account request for ${email} has been approved. 
You can now sign in to the client portal at ${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}/signin.html

If you have any questions, please contact us at admin@harmonyresourcehub.ca`;

      try {
        await sendViaResend({
          subject: userSubject,
          text: userText,
          html: userHtml,
          to: email
        });
      } catch (e) {
        console.error("Failed to send approval email to user:", e.message);
        // Don't fail the approval if email sending fails
      }

      // For browser requests, show success page
      if (req.method === "GET") {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Account Approved | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center rounded-full bg-emerald-50 w-16 h-16">
                    <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h1 class="mt-4 text-2xl font-semibold text-slate-900">Account Approved!</h1>
                  <p class="mt-2 text-slate-600">Your account for <strong>${escapeHtml(email)}</strong> has been approved.</p>
                  <p class="mt-2 text-sm text-slate-500">A confirmation email has been sent to you.</p>
                  <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}/signin.html" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800">
                    Sign in to your account
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({
        ok: true,
        message: `Account ${email} has been approved. User notified via email.`,
        approved: true
      });
    } else {
      // Reject account
      approvedAccounts.set(email, {
        approved: false,
        rejectedAt: new Date().toISOString(),
        reason: "Rejected by admin"
      });

      // Send rejection email to user
      const userSubject = "Account Request Status - Harmony Resource Hub";
      const userHtml = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
  <h2 style="margin:0 0 16px;color:#1f2937">Account Request Update</h2>
  <p style="margin:0 0 12px;color:#374151">
    Hi there,
  </p>
  <p style="margin:0 0 20px;color:#374151">
    Thank you for your interest in Harmony Resource Hub. 
    Unfortunately, your account request could not be approved at this time.
  </p>
  <p style="margin:0 0 20px;color:#374151">
    If you have any questions or would like to reapply, please contact us at admin@harmonyresourcehub.ca
  </p>
</div>`;

      const userText = `Account Request Update

Hi there,

Thank you for your interest in Harmony Resource Hub. 
Unfortunately, your account request could not be approved at this time.

If you have any questions or would like to reapply, please contact us at admin@harmonyresourcehub.ca`;

      try {
        await sendViaResend({
          subject: userSubject,
          text: userText,
          html: userHtml,
          to: email
        });
      } catch (e) {
        console.error("Failed to send rejection email to user:", e.message);
      }

      // For browser requests, show rejection page
      if (req.method === "GET") {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Account Request Update | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center rounded-full bg-amber-50 w-16 h-16">
                    <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h1 class="mt-4 text-2xl font-semibold text-slate-900">Request Status Update</h1>
                  <p class="mt-2 text-slate-600">Your account request could not be approved at this time.</p>
                  <p class="mt-2 text-sm text-slate-500">A confirmation email has been sent to you.</p>
                  <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800">
                    Return home
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({
        ok: true,
        message: `Account ${email} has been rejected. User notified via email.`,
        approved: false
      });
    }
  } catch (e) {
    const status = e.statusCode || 500;
    const errorMessage = e.message || "Server error";
    
    // For browser requests, show error page
    if (req.method === "GET") {
      return res.status(status).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Error | Harmony Resource Hub</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50">
          <div class="min-h-screen flex items-center justify-center px-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
              <div class="text-center">
                <div class="inline-flex items-center justify-center rounded-full bg-red-50 w-16 h-16">
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0-6h.01"></path>
                  </svg>
                </div>
                <h1 class="mt-4 text-2xl font-semibold text-slate-900">Error Processing Request</h1>
                <p class="mt-2 text-slate-600">${escapeHtml(errorMessage)}</p>
                <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800">
                  Return home
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }
    
    return res.status(status).json({ ok: false, error: errorMessage });
  }
};
