/**
 * Environment contract for Vercel / local.
 * Supports GOOGLE_SERVICE_ACCOUNT_JSON (plain JSON) or GOOGLE_SERVICE_ACCOUNT_JSON_B64 (base64)
 * so local .env.local can avoid quote/newline escaping issues.
 */
function getGoogleCreds(): Record<string, unknown> {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (b64) {
    try {
      const raw = Buffer.from(b64, "base64").toString("utf-8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON_B64 is invalid (not base64 or not JSON)");
    }
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not set");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON");
  }
}

export function getEnv() {
  return {
    googleCreds: getGoogleCreds(),
    nrlAuth: process.env.NRL_AUTH ?? "",
    pinSalt: process.env.PIN_SALT ?? "default-salt",
  };
}
