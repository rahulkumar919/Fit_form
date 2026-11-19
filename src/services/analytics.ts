/**
 * Admin analytics built from first-party events + orders.
 * Sessions/visitors/funnel come from TrafficEvent; revenue comes from real orders.
 */

import { connectDB, hasDB } from "@/lib/db/mongoose";
import { TrafficEventModel } from "@/models/TrafficEvent";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { TrackedLinkModel } from "@/models/TrackedLink";
import { channelLabel } from "@/lib/tracking/source";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DAY = 86_400_000;
const LIVE_ORDER = { status: { $nin: ["cancelled", "returned"] as ("cancelled" | "returned")[] } };

export interface SourceRow {
  source: string;
  label: string;
  sessions: number;
  visitors: number;
  addToCart: number;
  orders: number;
  revenue: number;
  conversion: number;
}

export interface AnalyticsData {
  days: number;
  totals: { sessions: number; visitors: number; clicks: number; orders: number; revenue: number; conversion: number; aov: number };
  bySource: SourceRow[];
  funnel: { step: string; sessions: number }[];
  daily: { label: string; sessions: number; orders: number; revenue: number }[];
  landing: { path: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
  topViewed: { name: string; kind: "product" | "combo"; views: number }[];
  campaigns: { campaign: string; sessions: number; orders: number; revenue: number }[];
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

async function distinctSessions(match: Record<string, unknown>, groupBy: string) {
  const rows = await TrafficEventModel.aggregate([
    { $match: match },
    { $group: { _id: { k: `$${groupBy}`, sid: "$sid" } } },
    { $group: { _id: "$_id.k", n: { $sum: 1 } } },
  ]);
  return new Map<string, number>(rows.map((r: any) => [r._id ?? "", r.n]));
}

export async function getAnalytics(days = 30): Promise<AnalyticsData> {
  const empty: AnalyticsData = {
    days,
    totals: { sessions: 0, visitors: 0, clicks: 0, orders: 0, revenue: 0, conversion: 0, aov: 0 },
    bySource: [], funnel: [], daily: [], landing: [], devices: [], topViewed: [], campaigns: [],
  };
  if (!hasDB()) return empty;
  await connectDB();

  const since = new Date(Date.now() - days * DAY);
  const inRange = { createdAt: { $gte: since } };

  const [sessAgg, visitorsAgg, clicks, cartBySource, orderAgg, funnelAgg, dailySess, dailyOrders, landingAgg, deviceAgg, viewedAgg, campSess, campOrders] =
    await Promise.all([
      TrafficEventModel.aggregate([{ $match: { ...inRange, type: "session_start" } }, { $group: { _id: "$source", n: { $sum: 1 }, v: { $addToSet: "$vid" } } }]),
      TrafficEventModel.aggregate([{ $match: { ...inRange, type: "session_start" } }, { $group: { _id: "$vid" } }, { $count: "n" }]),
      TrafficEventModel.countDocuments({ ...inRange, type: "link_click" }),
      distinctSessions({ ...inRange, type: "add_to_cart" }, "source"),
      OrderModel.aggregate([{ $match: { ...inRange, ...LIVE_ORDER } }, { $group: { _id: { $ifNull: ["$attribution.source", "direct"] }, n: { $sum: 1 }, rev: { $sum: "$total" } } }]),
      TrafficEventModel.aggregate([
        { $match: { ...inRange, type: { $in: ["session_start", "product_view", "combo_view", "add_to_cart", "begin_checkout", "purchase"] } } },
        { $project: { sid: 1, step: { $cond: [{ $in: ["$type", ["product_view", "combo_view"]] }, "view", "$type"] } } },
        { $group: { _id: { step: "$step", sid: "$sid" } } },
        { $group: { _id: "$_id.step", n: { $sum: 1 } } },
      ]),
      TrafficEventModel.aggregate([
        { $match: { ...inRange, type: "session_start" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, n: { $sum: 1 } } },
      ]),
      OrderModel.aggregate([
        { $match: { ...inRange, ...LIVE_ORDER } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, n: { $sum: 1 }, rev: { $sum: "$total" } } },
      ]),
      TrafficEventModel.aggregate([{ $match: { ...inRange, type: "session_start" } }, { $group: { _id: "$path", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
      TrafficEventModel.aggregate([{ $match: { ...inRange, type: "session_start" } }, { $group: { _id: "$device", n: { $sum: 1 } } }]),
      TrafficEventModel.aggregate([
        { $match: { ...inRange, type: { $in: ["product_view", "combo_view"] }, refId: { $ne: "" } } },
        { $group: { _id: { refId: "$refId", type: "$type" }, n: { $sum: 1 } } },
        { $sort: { n: -1 } }, { $limit: 8 },
      ]),
      TrafficEventModel.aggregate([{ $match: { ...inRange, type: "session_start", campaign: { $ne: "" } } }, { $group: { _id: "$campaign", n: { $sum: 1 } } }]),
      OrderModel.aggregate([{ $match: { ...inRange, ...LIVE_ORDER, "attribution.campaign": { $nin: ["", null] } } }, { $group: { _id: "$attribution.campaign", n: { $sum: 1 }, rev: { $sum: "$total" } } }]),
    ]);

  /* by source */
  const orders = new Map<string, { n: number; rev: number }>(orderAgg.map((o: any) => [o._id, { n: o.n, rev: o.rev }]));
  const sources = new Set<string>([...sessAgg.map((s: any) => s._id), ...orders.keys()]);
  const bySource: SourceRow[] = [...sources].map((source) => {
    const s: any = sessAgg.find((x: any) => x._id === source);
    const o = orders.get(source) ?? { n: 0, rev: 0 };
    const sessions = s?.n ?? 0;
    return {
      source, label: channelLabel(source), sessions, visitors: s?.v?.length ?? 0,
      addToCart: cartBySource.get(source) ?? 0, orders: o.n, revenue: o.rev, conversion: pct(o.n, sessions),
    };
  }).sort((a, b) => b.sessions - a.sessions || b.revenue - a.revenue);

  const totSessions = bySource.reduce((a, r) => a + r.sessions, 0);
  const totOrders = bySource.reduce((a, r) => a + r.orders, 0);
  const totRevenue = bySource.reduce((a, r) => a + r.revenue, 0);

  /* funnel */
  const f = new Map<string, number>(funnelAgg.map((r: any) => [r._id, r.n]));
  const funnel = [
    { step: "Visited", sessions: f.get("session_start") ?? 0 },
    { step: "Viewed a product", sessions: f.get("view") ?? 0 },
    { step: "Added to bag", sessions: f.get("add_to_cart") ?? 0 },
    { step: "Started checkout", sessions: f.get("begin_checkout") ?? 0 },
    { step: "Ordered", sessions: f.get("purchase") ?? 0 },
  ];

  /* daily */
  const ds = new Map<string, number>(dailySess.map((r: any) => [r._id, r.n]));
  const dO = new Map<string, any>(dailyOrders.map((r: any) => [r._id, r]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * DAY);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      sessions: ds.get(key) ?? 0,
      orders: dO.get(key)?.n ?? 0,
      revenue: dO.get(key)?.rev ?? 0,
    };
  });

  /* top viewed names */
  const pIds = viewedAgg.filter((v: any) => v._id.type === "product_view").map((v: any) => v._id.refId).filter((x: string) => /^[a-f0-9]{24}$/.test(x));
  const cIds = viewedAgg.filter((v: any) => v._id.type === "combo_view").map((v: any) => v._id.refId).filter((x: string) => /^[a-f0-9]{24}$/.test(x));
  const [pDocs, cDocs] = await Promise.all([
    ProductModel.find({ _id: { $in: pIds } }).select("name").lean(),
    ComboModel.find({ _id: { $in: cIds } }).select("name").lean(),
  ]);
  const names = new Map<string, string>([...pDocs, ...cDocs].map((d: any) => [String(d._id), d.name]));
  const topViewed = viewedAgg
    .filter((v: any) => names.has(v._id.refId))
    .map((v: any) => ({ name: names.get(v._id.refId)!, kind: v._id.type === "combo_view" ? ("combo" as const) : ("product" as const), views: v.n }));

  /* campaigns */
  const co = new Map<string, any>(campOrders.map((r: any) => [r._id, r]));
  const campNames = new Set<string>([...campSess.map((r: any) => r._id), ...co.keys()]);
  const campaigns = [...campNames].map((c) => ({
    campaign: c,
    sessions: campSess.find((r: any) => r._id === c)?.n ?? 0,
    orders: co.get(c)?.n ?? 0,
    revenue: co.get(c)?.rev ?? 0,
  })).sort((a, b) => b.revenue - a.revenue || b.sessions - a.sessions);

  return {
    days,
    totals: {
      sessions: totSessions,
      visitors: visitorsAgg[0]?.n ?? 0,
      clicks,
      orders: totOrders,
      revenue: totRevenue,
      conversion: pct(totOrders, totSessions),
      aov: totOrders ? Math.round(totRevenue / totOrders) : 0,
    },
    bySource,
    funnel,
    daily,
    landing: landingAgg.map((r: any) => ({ path: r._id || "/", sessions: r.n })),
    devices: deviceAgg.map((r: any) => ({ device: r._id || "unknown", sessions: r.n })).sort((a: any, b: any) => b.sessions - a.sessions),
    topViewed,
    campaigns,
  };
}

/* ───────────────────────── tracked links ───────────────────────── */

export interface LinkRow {
  id: string;
  code: string;
  name: string;
  channel: string;
  channelLabel: string;
  campaign: string;
  destination: string;
  isActive: boolean;
  clicks: number;
  sessions: number;
  addToCart: number;
  orders: number;
  revenue: number;
  conversion: number;
  lastClickAt: string | null;
  createdAt: string;
}

/** Lifetime performance of every tracked link. */
export async function getLinkStats(): Promise<LinkRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const [links, sess, carts, orders] = await Promise.all([
    TrackedLinkModel.find().sort({ createdAt: -1 }).lean(),
    distinctSessions({ type: "session_start", linkCode: { $ne: "" } }, "linkCode"),
    distinctSessions({ type: "add_to_cart", linkCode: { $ne: "" } }, "linkCode"),
    OrderModel.aggregate([{ $match: { ...LIVE_ORDER, "attribution.linkCode": { $nin: ["", null] } } }, { $group: { _id: "$attribution.linkCode", n: { $sum: 1 }, rev: { $sum: "$total" } } }]),
  ]);
  const o = new Map<string, any>(orders.map((r: any) => [r._id, r]));
  return links.map((l: any) => {
    const ord = o.get(l.code);
    const clicks = l.clicks ?? 0;
    return {
      id: String(l._id), code: l.code, name: l.name, channel: l.channel, channelLabel: channelLabel(l.channel),
      campaign: l.campaign ?? "", destination: l.destination, isActive: !!l.isActive,
      clicks, sessions: sess.get(l.code) ?? 0, addToCart: carts.get(l.code) ?? 0,
      orders: ord?.n ?? 0, revenue: ord?.rev ?? 0, conversion: pct(ord?.n ?? 0, clicks),
      lastClickAt: l.lastClickAt ? new Date(l.lastClickAt).toISOString() : null,
      createdAt: new Date(l.createdAt).toISOString(),
    };
  });
}

/** Conversion rate (orders / sessions) over the last N days, for the dashboard. */
export async function getConversion(days = 30): Promise<{ rate: number; sessions: number } | null> {
  if (!hasDB()) return null;
  await connectDB();
  const since = new Date(Date.now() - days * DAY);
  const [sessions, orders] = await Promise.all([
    TrafficEventModel.countDocuments({ type: "session_start", createdAt: { $gte: since } }),
    OrderModel.countDocuments({ ...LIVE_ORDER, createdAt: { $gte: since } }),
  ]);
  if (sessions === 0) return null;
  return { rate: pct(orders, sessions), sessions };
}
