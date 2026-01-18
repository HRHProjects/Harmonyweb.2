/**
 * /api/services (Vercel Serverless Function)
 *
 * Returns service offerings dynamically.
 * This allows updating services without redeploying the frontend.
 */

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

function setCorsHeaders(res, origin) {
  const allowed = parseAllowedOrigins();
  if (allowed.includes(origin) || allowed.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Service catalog - can be moved to a database later
const services = {
  featured: [
    {
      id: "assessment",
      name: "Assessment",
      price: "$30 per 30 min (min)",
      description: "Clarify what you need, what documents apply, and next steps.",
      category: "consultation"
    },
    {
      id: "ei-application",
      name: "EI Application",
      price: "$50",
      description: "Help organizing information and completing required steps.",
      category: "benefits"
    },
    {
      id: "resume-development",
      name: "Resume Development",
      price: "$20–$65",
      description: "Professional resume tailored to your experience and goals.",
      category: "employment"
    },
    {
      id: "passport-renewal",
      name: "Passport Renewal Support",
      price: "$40+",
      description: "Document checklist and form completion assistance.",
      category: "travel"
    }
  ],
  categories: [
    {
      id: "employment",
      name: "Employment & Work",
      description: "Resumes, cover letters, job search support, orientation support.",
      icon: "briefcase"
    },
    {
      id: "benefits",
      name: "Alberta Supports & Benefits",
      description: "EI, Alberta Income Support, AISH, CPP/OAS, and related navigation.",
      icon: "document"
    },
    {
      id: "immigration",
      name: "Immigration & Travel (Non-rep)",
      description: "Document/form support within scope. No representation.",
      icon: "globe"
    },
    {
      id: "housing",
      name: "Housing & Tenancy",
      description: "Lease reviews, rental applications, dispute support (non-legal).",
      icon: "home"
    },
    {
      id: "commissioning",
      name: "Commissioning Services",
      description: "Oath administration and document commissioning (where permitted).",
      icon: "stamp"
    },
    {
      id: "advocacy",
      name: "System Navigation & Advocacy",
      description: "Complaint letters, appeal support, and system navigation.",
      icon: "compass"
    }
  ],
  lastUpdated: new Date().toISOString()
};

export default function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || "";

  // CORS preflight
  if (req.method === "OPTIONS") {
    setCorsHeaders(res, origin);
    return res.status(204).end();
  }

  setCorsHeaders(res, origin);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional filtering by category
  const { category } = req.query;
  
  let responseData = services;
  
  if (category) {
    const categoryServices = services.featured.filter(s => s.category === category);
    responseData = {
      ...services,
      featured: categoryServices
    };
  }

  return res.status(200).json({
    success: true,
    data: responseData,
    timestamp: new Date().toISOString()
  });
}
