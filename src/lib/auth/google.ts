/** True only when real Google OAuth credentials are configured (not the .env placeholders). */
export function isGoogleConfigured(): boolean {
  const id = process.env.AUTH_GOOGLE_ID ?? "";
  const secret = process.env.AUTH_GOOGLE_SECRET ?? "";
  if (!id || !secret) return false;
  if (id.startsWith("your-") || secret.startsWith("your-")) return false;
  return id.endsWith(".apps.googleusercontent.com");
}
