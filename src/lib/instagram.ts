/** Client + server safe Instagram URL helpers. Only public instagram.com URLs; nothing is scraped. */

export interface ParsedInstagram { kind: "reel" | "post"; code: string; url: string }

/** Parse a reel/post URL and return its canonical form, or null. */
export function parseInstagramUrl(raw: string): ParsedInstagram | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !/^(www\.)?instagram\.com$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})\/?$/);
  if (!m) return null;
  const kind = m[1] === "p" ? "post" : "reel";
  const seg = kind === "post" ? "p" : "reel";
  return { kind, code: m[2], url: `https://www.instagram.com/${seg}/${m[2]}/` };
}

/** Official embed URL (instagram.com/<type>/<code>/embed/) for posts without an uploaded video. */
export function instagramEmbedUrl(url: string): string | null {
  const p = parseInstagramUrl(url);
  if (!p) return null;
  return `https://www.instagram.com/${p.kind === "post" ? "p" : "reel"}/${p.code}/embed/`;
}

/** Normalise "@fit.and.form" / profile URL → "fit.and.form" (Instagram username rules). */
export function normaliseHandle(raw: string): string {
  const v = raw.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : "";
}
