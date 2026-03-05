/**
 * Admin access: allowed list of emails (e.g. from env ADMIN_ALLOWED_EMAIL).
 * Loose barrier only; not for sensitive apps.
 */
const ALLOWED_EMAILS_KEY = "ADMIN_ALLOWED_EMAIL";

function getAllowedEmails(): string[] {
  const raw =
    typeof process !== "undefined"
      ? process.env[ALLOWED_EMAILS_KEY]
      : undefined;
  if (!raw?.trim()) {
    return ["steven.burman@gmail.com"];
  }
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const allowed = getAllowedEmails();
  return allowed.includes(email.trim().toLowerCase());
}
