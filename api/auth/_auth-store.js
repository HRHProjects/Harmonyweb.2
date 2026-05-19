const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const memoryStore = globalThis.__HRH_AUTH_MEMORY_STORE__ || (globalThis.__HRH_AUTH_MEMORY_STORE__ = {
  verificationCodes: new Map(),
  verifiedAccounts: new Map(),
  approvedAccounts: new Map()
});

function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
}

function getStorageMode() {
  return kvUrl && kvToken ? "vercel-kv" : "memory";
}

function isPersistentStoreConfigured() {
  return getStorageMode() === "vercel-kv";
}

function getPersistentStoreSetupError() {
  if (isPersistentStoreConfigured()) return "";
  return "Authentication storage is not configured. Connect Vercel KV to this project and add KV_REST_API_URL plus KV_REST_API_TOKEN before using account creation or sign-in.";
}

async function runKvCommand(command, ...args) {
  const response = await fetch(kvUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([command, ...args])
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    const detail = payload?.error || `${response.status} ${response.statusText}`;
    throw new Error(`Vercel KV request failed: ${detail}`);
  }

  return payload?.result ?? null;
}

function namespacedKey(kind, email) {
  return `hrh:auth:${kind}:${normalizeEmail(email)}`;
}

async function getJson(kind, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  if (!isPersistentStoreConfigured()) {
    return memoryStore[kind].get(normalizedEmail) || null;
  }

  const raw = await runKvCommand("GET", namespacedKey(kind, normalizedEmail));
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return raw;
}

async function setJson(kind, email, value) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  if (!isPersistentStoreConfigured()) {
    memoryStore[kind].set(normalizedEmail, value);
    return;
  }

  await runKvCommand("SET", namespacedKey(kind, normalizedEmail), JSON.stringify(value));
}

async function deleteJson(kind, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  if (!isPersistentStoreConfigured()) {
    memoryStore[kind].delete(normalizedEmail);
    return;
  }

  await runKvCommand("DEL", namespacedKey(kind, normalizedEmail));
}

async function getVerification(email) {
  return getJson("verificationCodes", email);
}

async function setVerification(email, value) {
  return setJson("verificationCodes", email, value);
}

async function deleteVerification(email) {
  return deleteJson("verificationCodes", email);
}

async function getVerifiedAccount(email) {
  return getJson("verifiedAccounts", email);
}

async function setVerifiedAccount(email, value) {
  return setJson("verifiedAccounts", email, value);
}

async function getApprovedAccount(email) {
  return getJson("approvedAccounts", email);
}

async function setApprovedAccount(email, value) {
  return setJson("approvedAccounts", email, value);
}

function clearMemoryStoreForTests() {
  memoryStore.verificationCodes.clear();
  memoryStore.verifiedAccounts.clear();
  memoryStore.approvedAccounts.clear();
}

module.exports = {
  clearMemoryStoreForTests,
  deleteVerification,
  getApprovedAccount,
  getPersistentStoreSetupError,
  getStorageMode,
  getVerification,
  getVerifiedAccount,
  isPersistentStoreConfigured,
  normalizeEmail,
  setApprovedAccount,
  setVerification,
  setVerifiedAccount
};
