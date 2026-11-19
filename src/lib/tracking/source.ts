/**
 * Traffic source classification (shared by server routes).
 *
 * Priority:
 *  1. our own tracked link (`fflink` param set by /l/[code])
 *  2. utm_source / legacy `ref` param
 *  3. referrer host
 *  4. direct
 */

export const CHANNELS = {
  instagram_dm: "Instagram DM",
  instagram_reel: "Instagram Reel",
  instagram_bio: "Instagram Bio",
  instagram_story: "Instagram Story",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  seo: "Google / SEO",
  facebook: "Facebook",
  youtube: "YouTube",
  referral: "Other websites",
  other: "Other",
  direct: "Direct",
} as const;

export type Channel = keyof typeof CHANNELS;

/** Channels an admin can pick when creating a tracked link. */
export const LINK_CHANNELS: Channel[] = [
  "instagram_dm", "instagram_reel", "instagram_bio", "instagram_story", "whatsapp", "facebook", "youtube", "other",
];

export function channelLabel(c: string): string {
  return (CHANNELS as Record<string, string>)[c] ?? c;
}

export interface Touch {
  source: Channel;
  medium: string;
  campaign: string;
  linkCode: string;
}

const clean = (v: string | null | undefined, max = 80) =>
  (v ?? "").toString().trim().toLowerCase().replace(/[^a-z0-9_\-.]/g, "").slice(0, max);

function fromUtm(utm: string): Channel {
  if (/^(ig|insta|instagram)/.test(utm)) return "instagram";
  if (/^(wa|whatsapp)/.test(utm)) return "whatsapp";
  if (/^(fb|facebook|meta)/.test(utm)) return "facebook";
  if (/^(yt|youtube)/.test(utm)) return "youtube";
  if (/^(google|bing|seo)/.test(utm)) return "seo";
  return "other";
}

function fromReferrer(host: string): Channel | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (/(^|\.)instagram\.com$/.test(h) || h === "l.instagram.com") return "instagram";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return "whatsapp";
  if (/(^|\.)(facebook\.com|fb\.com|messenger\.com)$/.test(h)) return "facebook";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return "youtube";
  if (/(^|\.)google\.[a-z.]+$/.test(h) || /(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org)$/.test(h)) return "seo";
  return null;
}

/**
 * Classify one landing. Returns null when the visit is internal navigation
 * (referrer is our own site) so it does not reset the session's source.
 */
export function classifyLanding(params: URLSearchParams, referrer: string, ownHost: string): Touch | null {
  const utmSource = clean(params.get("utm_source"));
  const utmMedium = clean(params.get("utm_medium"));
  const utmCampaign = clean(params.get("utm_campaign"));
  const ref = clean(params.get("ref"));

  if (utmSource) return { source: fromUtm(utmSource), medium: utmMedium || utmSource, campaign: utmCampaign, linkCode: "" };

  if (ref) {
    const source: Channel = ref.includes("insta") || ref.startsWith("ig") ? "instagram" : ref.includes("whatsapp") || ref.startsWith("wa") ? "whatsapp" : "referral";
    return { source, medium: "ref", campaign: ref, linkCode: "" };
  }

  if (referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host === ownHost) return null;
      const ch = fromReferrer(host);
      return { source: ch ?? "referral", medium: ch === "seo" ? "organic" : "referral", campaign: "", linkCode: "" };
    } catch {
      /* malformed referrer: treat as direct */
    }
  }
  return { source: "direct", medium: "none", campaign: "", linkCode: "" };
}

export function deviceFromUA(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Link-preview fetchers and crawlers must not count as visits or clicks. */
export function isBot(ua: string): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp\/|telegrambot|twitterbot|linkedinbot|embedly|preview|headless|lighthouse|pingdom|curl\/|wget|python-requests|axios/i.test(ua);
}
