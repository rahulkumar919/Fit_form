/**
 * GET /l/[code] — tracked short link.
 * Counts the click (humans only), stores attribution in a first-party cookie,
 * then redirects to the destination with `fflink` so the landing is credited.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { TrackedLinkModel } from "@/models/TrackedLink";
import { recordEvents, rateLimited } from "@/lib/tracking/record";
import { deviceFromUA, isBot } from "@/lib/tracking/source";
import {
  ATTR_COOKIE, ATTR_MAX_AGE, SID_COOKIE, VID_COOKIE, VID_MAX_AGE,
  cookieOpts, encodeAttr, isValidId, newId,
} from "@/lib/tracking/cookies";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();
  const home = new URL("/", req.url);

  if (!/^[a-z0-9-]{2,40}$/.test(code) || !hasDB()) return NextResponse.redirect(home, 302);

  await connectDB();
  const link = await TrackedLinkModel.findOne({ code, isActive: true }).lean();
  if (!link) return NextResponse.redirect(home, 302);

  const dest = new URL(link.destination, req.url);
  if (dest.origin !== home.origin) return NextResponse.redirect(home, 302); // destinations are always on-site
  dest.searchParams.set("fflink", code);

  const res = NextResponse.redirect(dest, 302);
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return res; // link previews from Instagram/WhatsApp must not count

  const vid = isValidId(req.cookies.get(VID_COOKIE)?.value) ? req.cookies.get(VID_COOKIE)!.value : newId();
  // The session itself starts on the first page view, so the landing is recorded as a session_start.
  const sid = isValidId(req.cookies.get(SID_COOKIE)?.value) ? req.cookies.get(SID_COOKIE)!.value : "";

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!rateLimited(`click:${ip}:${code}`, 20)) {
    await TrackedLinkModel.updateOne({ _id: link._id }, { $inc: { clicks: 1 }, $set: { lastClickAt: new Date() } });
    await recordEvents([{
      type: "link_click", vid, sid, path: dest.pathname, source: link.channel, medium: "tracked_link",
      campaign: link.campaign, linkCode: code, device: deviceFromUA(ua),
    }]);
  }

  res.cookies.set(VID_COOKIE, vid, { ...cookieOpts(req), maxAge: VID_MAX_AGE });
  res.cookies.set(ATTR_COOKIE, encodeAttr({
    source: link.channel as never, medium: "tracked_link", campaign: link.campaign, linkCode: code,
    landingPath: dest.pathname, at: Date.now(),
  }), { ...cookieOpts(req), maxAge: ATTR_MAX_AGE });
  return res;
}
