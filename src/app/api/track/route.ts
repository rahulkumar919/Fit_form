/**
 * POST /api/track — first-party analytics beacon from the storefront.
 * Starts sessions, classifies the traffic source, keeps last-non-direct
 * attribution in a cookie and stores anonymous events.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordEvents, rateLimited, type EventInput } from "@/lib/tracking/record";
import { classifyLanding, deviceFromUA, isBot } from "@/lib/tracking/source";
import {
  ATTR_COOKIE, ATTR_MAX_AGE, SID_COOKIE, SID_MAX_AGE, VID_COOKIE, VID_MAX_AGE,
  cookieOpts, decodeAttr, encodeAttr, isValidId, newId, type Attribution,
} from "@/lib/tracking/cookies";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { TrackedLinkModel } from "@/models/TrackedLink";

const bodySchema = z.object({
  type: z.enum(["page_view", "product_view", "combo_view", "add_to_cart", "begin_checkout"]),
  path: z.string().max(300),
  search: z.string().max(600).default(""),
  referrer: z.string().max(600).default(""),
  refId: z.string().max(64).regex(/^[A-Za-z0-9_-]*$/).default(""),
  value: z.number().min(0).max(10_000_000).default(0),
});

export async function POST(req: NextRequest) {
  const noop = new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return noop;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const body = parsed.data;
  if (!body.path.startsWith("/") || body.path.startsWith("/admin") || body.path.startsWith("/api")) return noop;

  const oldVid = req.cookies.get(VID_COOKIE)?.value;
  const oldSid = req.cookies.get(SID_COOKIE)?.value;
  const vid = isValidId(oldVid) ? oldVid : newId();
  const isNewSession = !isValidId(oldSid);
  const sid = isNewSession ? newId() : oldSid!;

  if (rateLimited(`track:${vid}`)) return noop;

  let attr: Attribution | null = decodeAttr(req.cookies.get(ATTR_COOKIE)?.value);
  const params = new URLSearchParams(body.search);
  const ownHost = req.nextUrl.hostname;

  // 1) our own tracked link wins
  const fflink = (params.get("fflink") ?? "").toLowerCase();
  let landing = null as Attribution | null;
  if (/^[a-z0-9-]{2,40}$/.test(fflink) && hasDB()) {
    await connectDB();
    const link = await TrackedLinkModel.findOne({ code: fflink }).select("channel campaign").lean();
    if (link) {
      landing = { source: link.channel as never, medium: "tracked_link", campaign: link.campaign, linkCode: fflink, landingPath: body.path, at: Date.now() };
    }
  }
  // 2) otherwise classify this landing (only on a session's first hit, or when campaign params are present)
  if (!landing && (isNewSession || params.has("utm_source") || params.has("ref"))) {
    const t = classifyLanding(params, body.referrer, ownHost);
    if (t) landing = { ...t, landingPath: body.path, at: Date.now() };
  }
  // last non-direct touch: direct visits never overwrite an existing campaign
  if (landing && (landing.source !== "direct" || !attr)) attr = landing;
  if (!attr) attr = { source: "direct", medium: "none", campaign: "", linkCode: "", landingPath: body.path, at: Date.now() };

  const device = deviceFromUA(ua);
  const base = { vid, sid, source: attr.source, medium: attr.medium, campaign: attr.campaign, linkCode: attr.linkCode, device };
  const events: EventInput[] = [];
  if (isNewSession) events.push({ ...base, type: "session_start", path: body.path });
  events.push({ ...base, type: body.type, path: body.path, refId: body.refId, value: body.value });
  await recordEvents(events);

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(VID_COOKIE, vid, { ...cookieOpts(req), maxAge: VID_MAX_AGE });
  res.cookies.set(SID_COOKIE, sid, { ...cookieOpts(req), maxAge: SID_MAX_AGE });
  res.cookies.set(ATTR_COOKIE, encodeAttr(attr), { ...cookieOpts(req), maxAge: ATTR_MAX_AGE });
  return res;
}
