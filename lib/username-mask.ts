/**
 * Masks full names for display while preserving pseudonyms.
 * If username is exactly two words, returns: "<first> <secondInitial>".
 */
export function maskDisplayUsername(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) {
    return "";
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2) {
    return trimmed;
  }

  const [first, second] = parts;
  const initial = second.charAt(0);
  if (!initial) {
    return first;
  }

  return `${first} ${initial}`;
}
