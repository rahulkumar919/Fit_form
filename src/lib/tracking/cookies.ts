/**
 * First-party tracking cookies. No personal data is stored: ids are random.
 *
 *  ff_vid  — visitor id (1 year), counts unique visitors
 *  ff_sid  — session id (30 min sliding), counts sessions
 *  ff_attr — last non-direct touch (30 days), credits orders to a source/link
 */

import type { Channel, Touch } from "./source";

export const VID_COOKIE = "ff_vid";
export const SID_COOKIE = "ff_sid";
export const ATTR_COOKIE = "ff_attr";

export const VID_MAX_AGE = 60 * 60 * 24 * 365;
export const SID_MAX_AGE = 60 * 30;
export const ATTR_MAX_AGE = 60 * 60 * 24 * 30;

export interface Attribution extends Touch {
  landingPath: string;
  at: number;
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function isValidId(v: string | undefined): v is string {
  return !!v && /^[a-f0-9]{32}$/.test(v);
}

export function encodeAttr(a: Attribution): string {
  return Buffer.from(JSON.stringify(a)).toString("base64url");
}

export function decodeAttr(raw: string | undefined): Attribution | null {
  if (!raw || raw.length > 1200) return null;
  try {
    const a = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof a?.source !== "string") return null;
    return {
      source: a.source as Channel,
      medium: String(a.medium ?? "").slice(0, 80),
      campaign: String(a.campaign ?? "").slice(0, 80),
      linkCode: String(a.linkCode ?? "").slice(0, 60),
      landingPath: String(a.landingPath ?? "/").slice(0, 300),
      at: Number(a.at) || Date.now(),
    };
  } catch {
    return null;
  }
}

/** Cookie options; Secure whenever the request itself is HTTPS (behind proxies too). */
export function cookieOpts(req: { nextUrl: URL; headers: Headers }) {
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return { path: "/", sameSite: "lax" as const, httpOnly: true, secure: proto === "https" };
}
