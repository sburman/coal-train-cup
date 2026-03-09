/**
 * Returns a short team label by taking the last word.
 * Example: "Cronulla-Sutherland Sharks" -> "Sharks"
 */
export function getTeamMascotName(teamName: string): string {
  const trimmed = teamName.trim();
  if (!trimmed) {
    return "";
  }
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? trimmed;
}
