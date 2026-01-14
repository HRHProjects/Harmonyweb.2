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
    console.error("[sendViaResend] No RESEND_API_KEY set. Get one from https://resend.com/api-keys");
    return;
  }

  const from = process.env.HRH_FROM_EMAIL || "Harmony Resource Hub <noreply@harmonyresourcehub.ca>";
  
  // Validate that FROM email domain matches expected patterns
  if (!from.includes("@")) {
    console.error("[sendViaResend] Invalid FROM email format. Should be: 'Name <email@domain.com>'");
    return;
  }

  const body = JSON.stringify({ from, to, subject, text, html, reply_to: replyTo });

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body
    });

    if (!resp.ok) {
      const msg = await resp.text();
      console.error("[sendViaResend] Email provider error:", resp.status, msg);
      console.error("[sendViaResend] Make sure:");
      console.error("  - Domain is verified in Resend: https://resend.com/domains");
      console.error("  - RESEND_API_KEY is correct");
      console.error("  - FROM email uses verified domain");
      throw new Error(`Email provider error: ${resp.status} ${msg}`);
    }
  } catch (e) {
    console.error("[sendViaResend] Error:", e.message);
    throw e;
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
      if (req.method === "GET") {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invalid approval link | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
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

    // Store approval/rejection status
    const accountKey = `${email}:${token}`;

    if (approvalAction === "approve") {
      approvedAccounts.set(email, { 
        approved: true, 
        token, 
        approvedAt: new Date().toISOString(),
        approvalToken: token
      });

      // Send approval email to user
      try {
        await sendViaResend({
          to: email,
          subject: "Your Harmony Resource Hub Account Has Been Approved!",
          text: `Your account has been approved! You can now log in at https://www.harmonyresourcehub.ca`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #334155; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f1f5f9; padding: 30px; border-radius: 0 0 12px 12px; }
                .button { display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Account Approved!</h1>
                </div>
                <div class="content">
                  <p>Hello ${escapeHtml(email)},</p>
                  <p>Great news! Your account has been approved by the Harmony Resource Hub team.</p>
                  <p>You can now log in and access all the features of your personalized dashboard.</p>
                  <a href="https://www.harmonyresourcehub.ca/signin.html" class="button">Log In Now</a>
                  <p><strong>What's next?</strong></p>
                  <ul>
                    <li>Complete your profile</li>
                    <li>Upload important documents</li>
                    <li>Schedule appointments</li>
                    <li>Send messages to our team</li>
                    <li>Track your payments</li>
                  </ul>
                </div>
                <div class="footer">
                  <p>&copy; 2024 Harmony Resource Hub. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (e) {
        console.error("[approve] Failed to send approval email:", e.message);
        // Don't fail the approval if email fails
      }

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
                <div class="inline-flex items-center justify-center rounded-full bg-green-50 w-16 h-16">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h1 class="mt-4 text-2xl font-semibold text-slate-900">Account Approved!</h1>
                <p class="mt-2 text-slate-600">Your Harmony Resource Hub account has been approved.</p>
                <p class="mt-2 text-sm text-slate-500">An approval confirmation email has been sent to ${escapeHtml(email)}</p>
                <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}/signin.html" class="mt-6 inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 w-full">
                  Log in now
                </a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({ ok: true, message: "Account approved" });
    } else {
      // Reject
      approvedAccounts.set(email, { 
        approved: false, 
        rejected: true,
        token,
        rejectedAt: new Date().toISOString()
      });

      // Send rejection email to user
      try {
        await sendViaResend({
          to: email,
          subject: "Update on Your Harmony Resource Hub Application",
          text: `Your account request could not be approved at this time. Please contact us for more information.`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #334155; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f1f5f9; padding: 30px; border-radius: 0 0 12px 12px; }
                .button { display: inline-block; background: #0f172a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Account Request Update</h1>
                </div>
                <div class="content">
                  <p>Hello ${escapeHtml(email)},</p>
                  <p>Thank you for your interest in Harmony Resource Hub. Unfortunately, your account request could not be approved at this time.</p>
                  <p>Please contact our support team for more information about your application.</p>
                  <a href="mailto:admin@harmonyresourcehub.ca" class="button">Contact Support</a>
                </div>
                <div class="footer">
                  <p>&copy; 2024 Harmony Resource Hub. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (e) {
        console.error("[approve] Failed to send rejection email:", e.message);
      }

      if (req.method === "GET") {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Application Update | Harmony Resource Hub</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-50">
            <div class="min-h-screen flex items-center justify-center px-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft max-w-md w-full">
                <div class="inline-flex items-center justify-center rounded-full bg-amber-50 w-16 h-16">
                  <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h1 class="mt-4 text-2xl font-semibold text-slate-900">Request Requires Review</h1>
                <p class="mt-2 text-slate-600">Your account request could not be approved at this time.</p>
                <p class="mt-2 text-sm text-slate-500">Please contact our support team for more information.</p>
                <a href="mailto:admin@harmonyresourcehub.ca" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 w-full">
                  Contact Support
                </a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({ ok: true, message: "Account request has been reviewed" });
    }
  } catch (err) {
    console.error("[approve]", err);
    const status = err.statusCode || 500;
    const errorMessage = err.message || "Internal server error";

    if (req.method === "GET" && status !== 429) {
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
              <div class="inline-flex items-center justify-center rounded-full bg-red-50 w-16 h-16">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2"></path>
                </svg>
              </div>
              <h1 class="mt-4 text-2xl font-semibold text-slate-900">Something went wrong</h1>
              <p class="mt-2 text-slate-600">${escapeHtml(errorMessage)}</p>
              <a href="${process.env.HRH_SITE_URL || "https://www.harmonyresourcehub.ca"}" class="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800">
                Return home
              </a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(status).json({ ok: false, error: errorMessage });
  }
};
