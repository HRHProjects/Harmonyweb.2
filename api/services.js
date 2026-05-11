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

const freeImage = {
  commissioning: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
  immigration: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
  benefits: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=900&q=80",
  travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80",
  housing: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
  navigation: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"
};

// Service catalog - can be moved to a database later.
const services = {
  featured: [
    {
      id: "may-commissioning-special",
      name: "May commissioning special",
      price: "$20",
      description: "One-page Commissioner for Oaths service with one exhibit for the month of May.",
      category: "commissioning",
      image: freeImage.commissioning,
      alt: "Documents ready for Commissioner for Oaths service"
    },
    {
      id: "immigration-admin-support",
      name: "Immigration admin support",
      price: "$15–$600+",
      description: "Client-directed IRCC account, form-entry, upload, tracker, PR renewal, citizenship, webform and package organization support only—not consultation or legal advice.",
      category: "immigration",
      image: freeImage.immigration,
      alt: "Administrative support meeting with documents"
    },
    {
      id: "benefits-applications",
      name: "Benefits application support",
      price: "$20–$100+",
      description: "EI, Alberta Income Support, AISH, CPP/OAS, dental plan, housing and local support application navigation.",
      category: "benefits",
      image: freeImage.benefits,
      alt: "Community support and benefits paperwork"
    },
    {
      id: "passport-travel-documents",
      name: "Passport & travel document support",
      price: "$40–$95+",
      description: "Checklist and administrative support for passports, travel documents, consent letters, ETA and visa form-entry tasks.",
      category: "travel",
      image: freeImage.travel,
      alt: "Passport and travel documents"
    }
  ],
  categories: [
    {
      id: "commissioning",
      name: "Commissioner for Oaths (Alberta)",
      description: "Administer oaths and take, receive, and attest affidavits, affirmations, statutory declarations, sworn statements and related exhibits where permitted in Alberta.",
      note: "A Commissioner for Oaths is not a Notary Public and cannot provide legal advice or verify the truth of a document.",
      icon: "stamp",
      badge: "May $20 promo",
      image: freeImage.commissioning,
      alt: "Commissioning documents with signature pen"
    },
    {
      id: "immigration",
      name: "Immigration Admin Support (Non-advisory)",
      description: "IRCC account setup, webforms, PR renewal/replacement, citizenship admin, tracker access, document upload organization, IQAS/WES, visa and sponsorship package admin support.",
      note: "Administrative support only. No immigration consultation, representation, program advice, eligibility advice, or legal advice.",
      icon: "globe",
      badge: "Admin only",
      image: freeImage.immigration,
      alt: "Administrative paperwork support conversation"
    },
    {
      id: "benefits",
      name: "Benefits & Community Supports",
      description: "EI, Alberta Income Support, AISH, Canada Dental Care Plan, CPP/OAS, Wood Buffalo Lift, Wood Buffalo Housing and community connection support.",
      icon: "document",
      image: freeImage.benefits,
      alt: "Benefits and community support paperwork"
    },
    {
      id: "travel",
      name: "Travel & Identity Documents",
      description: "Passport applications and renewals, travel documents, child travel documents, child travel consent letters, Kenyan ETA, US visa admin support and flight booking assistance.",
      icon: "plane",
      image: freeImage.travel,
      alt: "Passport and travel planning"
    },
    {
      id: "housing-family-civil",
      name: "Housing, Family & Civil Admin",
      description: "Housing forms, rental applications, family/civil form administrative support, divorce application admin packages, account setup, letters, calls and email assistance.",
      note: "Administrative support only. Legal advice, legal drafting and representation are outside scope.",
      icon: "home",
      image: freeImage.housing,
      alt: "Housing documents and home keys"
    },
    {
      id: "navigation",
      name: "System Navigation & Advocacy Admin",
      description: "Plain-language next-step planning, document checklists, office contact paths, complaint package organization and follow-up tracking.",
      icon: "compass",
      image: freeImage.navigation,
      alt: "Community navigation support"
    }
  ],
  lastUpdated: new Date().toISOString()
};

export default function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || "";

  if (req.method === "OPTIONS") {
    setCorsHeaders(res, origin);
    return res.status(204).end();
  }

  setCorsHeaders(res, origin);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
