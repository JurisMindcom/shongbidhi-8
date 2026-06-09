// Returns a safe http(s) URL string, or null if the value is not a valid
// http/https URL. Used to prevent javascript: / data: URI XSS in user-set
// fields like facebook_link.
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}