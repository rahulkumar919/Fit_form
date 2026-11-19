/**
 * Open-redirect protection for `callbackUrl` values.
 * Accepts only same-origin paths; anything else falls back.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/", origin?: string): string {
  if (!raw) return fallback;
  let path = raw;

  // Auth.js / the proxy may hand us an absolute URL. Keep it only if same-origin.
  if (/^https?:\/\//i.test(raw)) {
    if (!origin) return fallback;
    try {
      const u = new URL(raw);
      if (u.origin !== origin) return fallback;
      path = u.pathname + u.search;
    } catch {
      return fallback;
    }
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  if (path.startsWith("/login") || path.startsWith("/admin/login") || path.startsWith("/api/auth")) return fallback;
  return path;
}
