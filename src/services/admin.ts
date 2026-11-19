/**
* Admin-only reads (admin panel server components).
* Callers must already be behind the admin guard; the panel layout enforces it.
*
* Nothing here invents data: with an empty database every function returns
* empty lists / zeroes so the UI shows honest empty states.
*/

import type { Combo, Customer, KpiCard, Order, Product, SalesPoint } from "@/types";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import { SupplierProductModel } from "@/models/SupplierProduct";
import { plain, toCombo, toProduct } from "@/services/catalog";
import { toOrder } from "@/services/orders";
import { formatINR } from "@/lib/utils";
import { getConversion } from "@/services/analytics";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ───────────────────────── products / combos ───────────────────────── */

export interface AdminProductRow {
  product: Product;
  sourcePrice?: number;
  sales?: {
    total: number;
    last7: number;
    last30: number;
    totalOrders: number;
  };
}

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  if (!hasDB()) return [];
  await connectDB();

  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [docs, suppliers, salesAgg] = await Promise.all([
    ProductModel.find().sort({ createdAt: -1 }).lean(),
    SupplierProductModel.find().select("productId sourcePrice").lean(),
    // Single aggregation: unwind order items, group by product refId
    OrderModel.aggregate([
      {
        $match: {
          status: { $nin: ["cancelled", "returned"] },
          $or: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
        },
      },
      { $unwind: "$items" },
      {
        $match: { "items.kind": "product" },
      },
      {
        $group: {
          _id: "$items.refId",
          total: { $sum: "$items.quantity" },
          totalOrders: { $sum: 1 },
          last7: {
            $sum: { $cond: [{ $gte: ["$createdAt", ago7] }, "$items.quantity", 0] },
          },
          last30: {
            $sum: { $cond: [{ $gte: ["$createdAt", ago30] }, "$items.quantity", 0] },
          },
        },
      },
    ]),
  ]);

  const sourceByProduct = new Map<string, number>(
    plain<any[]>(suppliers).map((s) => [String(s.productId), s.sourcePrice]),
  );
  const salesByProduct = new Map<string, { total: number; last7: number; last30: number; totalOrders: number }>(
    salesAgg.map((s: any) => [String(s._id), { total: s.total, last7: s.last7, last30: s.last30, totalOrders: s.totalOrders }]),
  );

  return plain<any[]>(docs).map((d) => ({
    product: toProduct(d),
    sourcePrice: sourceByProduct.get(String(d._id)),
    sales: salesByProduct.get(String(d._id)),
  }));
}

export interface AdminComboRow {
  combo: Combo;
  isActive: boolean;
}

export async function getAdminCombos(): Promise<AdminComboRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await ComboModel.find().sort({ createdAt: -1 }).lean();
  return plain<any[]>(docs).map((d) => ({ combo: toCombo(d), isActive: !!d.isActive }));
}

/* ───────────────────────── orders / customers ───────────────────────── */

export async function getAdminOrders(limit = 500): Promise<Order[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  return plain<any[]>(docs).map(toOrder);
}

export async function getAdminCustomers(): Promise<Customer[]> {
  if (!hasDB()) return [];
  await connectDB();
  const [users, stats] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).limit(1000).lean(),
    OrderModel.aggregate([
      { $match: { status: { $nin: ["cancelled", "returned"] } } },
      {
        $group: {
          _id: "$customerEmail",
          orders: { $sum: 1 },
          spent: { $sum: "$total" },
          city: { $last: "$address.city" },
          phone: { $last: "$address.phone" },
        },
      },
    ]),
  ]);
  const byEmail = new Map<string, any>(stats.map((s: any) => [s._id, s]));
  return plain<any[]>(users).map((u) => {
    const s = byEmail.get(String(u.email).toLowerCase());
    return {
      id: String(u._id),
      name: u.name ?? "",
      email: u.email,
      phone: u.phone || s?.phone || "",
      orders: s?.orders ?? 0,
      spent: s?.spent ?? 0,
      joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
      avatar: u.image || undefined,
      city: s?.city ?? "",
    };
  });
}

/* ───────────────────────── dashboard ───────────────────────── */

export interface DashboardProductRow {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  units: number;
}

export interface DashboardData {
  hasOrders: boolean;
  kpis: KpiCard[];
  series: Record<"day" | "week" | "month", SalesPoint[]>;
  avgOrderValue: number;
  lastPeriodSales: number;
  lowStockCount: number;
  ordersToFulfil: number;
  paymentsToCapture: number;
  returnsToReview: number;
  products: DashboardProductRow[];
  productTotal: number;
}

const DAY = 24 * 60 * 60 * 1000;
const EXCLUDED = new Set(["cancelled", "returned"]);
// Only count revenue from orders where money was actually received.
// COD = confirmed (customer pays on delivery). Online = only when paymentStatus is "paid".
function isRevenue(o: Record<string, unknown>): boolean {
  if (EXCLUDED.has(o.status as string)) return false;
  if ((o.paymentMethod as string) === "cod") return true;
  return (o.paymentStatus as string) === "paid";
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function trend(delta: number): KpiCard["trend"] {
  return delta > 0 ? "up" : delta < 0 ? "down" : "flat";
}

function bucketize(
  orders: { t: number; total: number }[],
  buckets: { label: string; from: number; to: number }[],
): SalesPoint[] {
  return buckets.map((b) => {
    const inB = orders.filter((o) => o.t >= b.from && o.t < b.to);
    return { label: b.label, sales: inB.reduce((s, o) => s + o.total, 0), orders: inB.length };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    hasOrders: false,
    kpis: [],
    series: { day: [], week: [], month: [] },
    avgOrderValue: 0,
    lastPeriodSales: 0,
    lowStockCount: 0,
    ordersToFulfil: 0,
    paymentsToCapture: 0,
    returnsToReview: 0,
    products: [],
    productTotal: 0,
  };
  if (!hasDB()) return empty;

  await connectDB();
  const [orderDocs, productDocs, comboCount, conversion] = await Promise.all([
    OrderModel.find()
      .select("createdAt total status estimatedProfit items.refId items.quantity paymentStatus paymentMethod")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean(),
    ProductModel.find().lean(),
    ComboModel.countDocuments({ isActive: true }),
    getConversion(30),
  ]);

  const orders = plain<any[]>(orderDocs);
  const products = plain<any[]>(productDocs);
  const now = Date.now();
  // live = non-cancelled/returned orders (for counts, stock)
  const live = orders.filter((o) => !EXCLUDED.has(o.status as string));
  // paid = money actually received (COD always, online only when paymentStatus === "paid")
  const paid = orders.filter((o) => isRevenue(o as Record<string, unknown>));
  const pendingPayment = orders.filter((o) =>
    !EXCLUDED.has(o.status as string) &&
    (o.paymentMethod as string) !== "cod" &&
    (o.paymentStatus as string) !== "paid",
  );
  const paidTimed = paid.map((o) => ({ t: new Date(o.createdAt as string).getTime(), total: o.total as number }));
  const liveTimed = live.map((o) => ({ t: new Date(o.createdAt as string).getTime(), total: o.total as number }));
  const sumIn = (from: number, to: number) =>
    paidTimed.filter((o) => o.t >= from && o.t < to).reduce((s, o) => s + o.total, 0);
  const countIn = (from: number, to: number) => paidTimed.filter((o) => o.t >= from && o.t < to).length;
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const todayRevenue = sumIn(today0.getTime(), now);
  const rev30 = sumIn(now - 30 * DAY, now);
  const revPrev30 = sumIn(now - 60 * DAY, now - 30 * DAY);
  const ord30 = countIn(now - 30 * DAY, now);
  const ordPrev30 = countIn(now - 60 * DAY, now - 30 * DAY);
  const revDelta = pct(rev30, revPrev30);
  const ordDelta = pct(ord30, ordPrev30);
  const totalRevenue = paid.reduce((s, o) => s + (o.total as number), 0);
  const totalSales = paid.length;
  const estProfit = paid.reduce((s, o) => s + ((o.estimatedProfit as number) ?? 0), 0);
  const marginPct = totalRevenue > 0 && estProfit > 0 ? Math.round((estProfit / totalRevenue) * 1000) / 10 : 0;



  const pending = orders.filter((o) => o.status === "new" || o.status === "pending_sourcing").length;
  const toSource = orders.filter((o) => o.status === "pending_sourcing" || o.status === "new").length;

  const activeProducts = products.filter((p) => p.status === "active").length;

  const kpis: KpiCard[] = [
    { label: "Total Revenue", value: formatINR(totalRevenue), delta: revDelta, trend: trend(revDelta), hint: `Paid orders only · ${totalSales} orders all time` },
    { label: "Today's Sales", value: formatINR(todayRevenue), delta: 0, trend: "flat", hint: "paid orders placed today" },
    { label: "Revenue (30d)", value: formatINR(rev30), delta: revDelta, trend: trend(revDelta), hint: "vs previous 30 days" },
    { label: "Total Paid Orders", value: String(totalSales), delta: ordDelta, trend: trend(ordDelta), hint: "COD + confirmed online" },
    { label: "Pending Payment", value: String(pendingPayment.length), delta: 0, trend: pendingPayment.length > 0 ? "down" : "flat", hint: "online orders not yet paid" },
    { label: "Est. Margin", value: estProfit > 0 ? formatINR(estProfit) : "—", delta: 0, trend: estProfit > 0 ? "up" : "flat", hint: marginPct > 0 ? `${marginPct}% of revenue · add Meesho costs to update` : "Add source costs in Meesho sourcing" },
    { label: "Total Products", value: String(products.length), delta: 0, trend: "flat", hint: `${activeProducts} active` },
    { label: "Active Combos", value: String(comboCount), delta: 0, trend: "flat", hint: "published" },
    { label: "Pending Sourcing", value: String(pending), delta: 0, trend: "flat", hint: "awaiting Meesho order" },
    conversion
      ? { label: "Conversion Rate", value: `${conversion.rate}%`, delta: 0, trend: "flat", hint: `${conversion.sessions} sessions, 30d` }
      : { label: "Conversion Rate", value: "—", delta: 0, trend: "flat", hint: "no visits yet" },
  ];

  // Chart series
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const t0 = startOfToday.getTime();
  const dayBuckets = Array.from({ length: 6 }, (_, i) => ({
    label: String(i * 4).padStart(2, "0"),
    from: t0 + i * 4 * 3600_000,
    to: t0 + (i + 1) * 4 * 3600_000,
  }));
  const weekBuckets = Array.from({ length: 7 }, (_, i) => {
    const from = t0 - (6 - i) * DAY;
    return { label: new Date(from).toLocaleDateString("en-IN", { weekday: "short" }), from, to: from + DAY };
  });
  const monthBuckets = Array.from({ length: 4 }, (_, i) => {
    const from = t0 + DAY - (4 - i) * 7 * DAY;
    return { label: `W${i + 1}`, from, to: from + 7 * DAY };
  });

  // Units sold per product (all non-cancelled orders)
  const units = new Map<string, number>();
  for (const o of live) {
    for (const it of o.items ?? []) {
      units.set(String(it.refId), (units.get(String(it.refId)) ?? 0) + (it.quantity ?? 0));
    }
  }

  const stockOf = (p: any) =>
    (p.variants ?? []).flatMap((v: any) => v.sizes ?? []).reduce((s: number, z: any) => s + (z.available ?? 0), 0);
  const isLow = (p: any) =>
    (p.variants ?? []).some((v: any) => (v.sizes ?? []).some((z: any) => !z.inStock || (z.available ?? 0) < 6));

  const rows: DashboardProductRow[] = products
    .map((p) => ({
      id: String(p._id),
      name: p.name,
      image: p.images?.[0] ?? "",
      price: p.price,
      stock: stockOf(p),
      units: units.get(String(p._id)) ?? 0,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 8);

  return {
    hasOrders: orders.length > 0,
    kpis,
    series: {
      day: bucketize(paidTimed, dayBuckets),
      week: bucketize(paidTimed, weekBuckets),
      month: bucketize(paidTimed, monthBuckets),
    },
    avgOrderValue: paid.length ? Math.round(totalRevenue / paid.length) : 0,
    lastPeriodSales: sumIn(now - 14 * DAY, now - 7 * DAY),
    lowStockCount: products.filter(isLow).length,
    ordersToFulfil: toSource,
    paymentsToCapture: pendingPayment.length,
    returnsToReview: orders.filter((o) => o.status === "returned").length,
    products: rows,
    productTotal: products.length,
  };
}

/* ───────────────────────── edit-form data ───────────────────────── */

import type { ProductInput } from "@/lib/validations/product";
import type { ComboInput } from "@/lib/validations/combo";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

export interface AdminProductDetail {
  id: string;
  values: ProductInput;
  usedInCombos: { id: string; name: string; slug: string; isActive: boolean }[];
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  if (!hasDB() || !OBJECT_ID_RE.test(id)) return null;
  await connectDB();
  const doc = await ProductModel.findById(id).lean();
  if (!doc) return null;
  const [supplier, combos] = await Promise.all([
    SupplierProductModel.findOne({ productId: id }).lean(),
    ComboModel.find({ "items.productId": id }).select("name slug isActive").lean(),
  ]);
  const d = plain<any>(doc);
  const s = supplier ? plain<any>(supplier) : null;

  return {
    id,
    values: {
      name: d.name,
      slug: d.slug,
      category: d.category,
      description: d.description ?? "",
      highlights: d.highlights ?? [],
      material: d.material ?? "",
      care: d.care ?? "",
      price: d.price,
      compareAtPrice: d.compareAtPrice ?? null,
      images: d.images ?? [],
      variants: (d.variants ?? []).map((v: any) => ({
        color: v.color,
        colorHex: v.colorHex,
        images: v.images ?? [],
        sizes: (v.sizes ?? []).map((z: any) => ({ size: z.size, available: z.available ?? 0 })),
      })),
      status: d.status,
      isNewArrival: !!d.isNewArrival,
      isBestSeller: !!d.isBestSeller,
      isTrending: !!d.isTrending,
      isLimitedOffer: !!d.isLimitedOffer,
      tags: d.tags ?? [],
      seoTitle: d.seoTitle ?? "",
      seoDescription: d.seoDescription ?? "",
      source: s
        ? {
          meeshoUrl: s.meeshoUrl,
          meeshoRef: s.meeshoRef ?? "",
          supplier: s.supplier ?? "",
          sourcePrice: s.sourcePrice,
          handlingCost: s.handlingCost ?? 0,
          deliveryCost: s.deliveryCost ?? 0,
          otherCost: s.otherCost ?? 0,
          notes: s.notes ?? "",
        }
        : null,
      manualRating:      d.manualRating      ?? null,
      manualReviewCount: d.manualReviewCount  ?? null,
      manualSoldCount:   d.manualSoldCount    ?? null,
    },
    usedInCombos: plain<any[]>(combos).map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, isActive: !!c.isActive })),
  };
}

export interface AdminComboDetail {
  id: string;
  values: ComboInput;
  combinedPrice: number;
}

export async function getAdminCombo(id: string): Promise<AdminComboDetail | null> {
  if (!hasDB() || !OBJECT_ID_RE.test(id)) return null;
  await connectDB();
  const doc = await ComboModel.findById(id).lean();
  if (!doc) return null;
  const d = plain<any>(doc);
  return {
    id,
    combinedPrice: d.combinedPrice,
    values: {
      name: d.name,
      slug: d.slug,
      tagline: d.tagline ?? "",
      description: d.description ?? "",
      images: d.images ?? [],
      productIds: (d.items ?? []).map((i: any) => String(i.productId)),
      comboPrice: d.comboPrice,
      tags: d.tags ?? [],
      isTrending: !!d.isTrending,
      isBestSeller: !!d.isBestSeller,
      isActive: !!d.isActive,
      reelRef: d.reelRef ?? "",
      seoTitle: d.seoTitle ?? "",
      seoDescription: d.seoDescription ?? "",
    },
  };
}

export interface PickerProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  categoryLabel: string;
}

/** Active products a combo may contain. */
export async function getPickerProducts(): Promise<PickerProduct[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await ProductModel.find({ status: "active" }).select("name slug images price categoryLabel").sort({ name: 1 }).lean();
  return plain<any[]>(docs).map((d) => ({
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    image: d.images?.[0] ?? "",
    price: d.price,
    categoryLabel: d.categoryLabel,
  }));
}

/* ───────────────────────── reviews moderation ───────────────────────── */

import { ReviewModel } from "@/models/Review";

export interface AdminReviewRow {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productSku: string;
  author: string;
  customerImage: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  source: "customer" | "store_testimonial";
  verified: boolean;
  featured: boolean;
  images: string[];
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
}

export async function getAdminReviews(): Promise<AdminReviewRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await ReviewModel.find().sort({ status: 1, createdAt: -1 }).limit(500).lean();
  const products = await ProductModel.find({ _id: { $in: docs.map((d: any) => d.productId) } }).select("name slug images sourceRef").lean();
  const byId = new Map(plain<any[]>(products).map((p) => [String(p._id), p]));
  return plain<any[]>(docs).map((d) => ({
    id: String(d._id),
    productId: String(d.productId),
    productName: byId.get(String(d.productId))?.name ?? "Deleted product",
    productSlug: byId.get(String(d.productId))?.slug ?? "",
    productImage: byId.get(String(d.productId))?.images?.[0] ?? "",
    productSku: byId.get(String(d.productId))?.sourceRef ?? "",
    author: d.author,
    customerImage: d.customerImage ?? "",
    rating: d.rating,
    title: d.title ?? "",
    body: d.body ?? "",
    status: d.status ?? (d.isApproved ? "approved" : "pending"),
    source: d.source ?? "customer",
    verified: !!d.verified,
    featured: !!d.featured,
    images: d.images ?? [],
    isApproved: !!d.isApproved,
    helpfulCount: d.helpfulCount ?? 0,
    createdAt: new Date(d.createdAt).toISOString(),
  }));
}

/* ───────────────────────── media ───────────────────────── */

import { MediaAssetModel } from "@/models/MediaAsset";
import type { MediaRow } from "@/components/admin/media-library";

export async function getMediaAssets(): Promise<MediaRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await MediaAssetModel.find().sort({ createdAt: -1 }).limit(500).lean();
  return plain<any[]>(docs).map((d) => ({
    id: String(d._id),
    name: d.name,
    url: d.url,
    thumb: d.renditions?.find((r: any) => r.name === "thumb")?.url ?? d.url,
    provider: d.provider,
    width: d.width,
    height: d.height,
    sizeKb: d.sizeKb,
    originalSizeKb: d.originalSizeKb ?? 0,
    alt: d.alt ?? "",
    createdAt: new Date(d.createdAt).toISOString(),
  }));
}

/* ───────────────────────── Meesho sourcing ───────────────────────── */

import { SourcePriceHistoryModel } from "@/models/SourcePriceHistory";
import type { SupplierRow } from "@/components/admin/meesho-manager";

export async function getSupplierRows(): Promise<{ rows: SupplierRow[]; unlinkedCount: number }> {
  if (!hasDB()) return { rows: [], unlinkedCount: 0 };
  await connectDB();
  const [suppliers, activeIds] = await Promise.all([
    SupplierProductModel.find().sort({ status: 1, lastPriceChecked: 1 }).lean(),
    ProductModel.find({ status: "active" }).distinct("_id"),
  ]);
  const s = plain<any[]>(suppliers);
  const history = await SourcePriceHistoryModel.find({ supplierProductId: { $in: s.map((x) => x._id) } }).sort({ date: -1 }).limit(2000).lean();
  const byId = new Map<string, any[]>();
  for (const h of plain<any[]>(history)) {
    const k = String(h.supplierProductId);
    if (!byId.has(k)) byId.set(k, []);
    byId.get(k)!.push({ date: new Date(h.date).toISOString(), sourcePrice: h.sourcePrice, note: h.note ?? "" });
  }
  const linked = new Set(s.map((x) => String(x.productId)));
  return {
    rows: s.map((x) => ({
      id: String(x._id),
      productId: String(x.productId),
      productName: x.productName,
      meeshoUrl: x.meeshoUrl,
      meeshoRef: x.meeshoRef ?? "",
      supplier: x.supplier ?? "",
      sourcePrice: x.sourcePrice,
      sellingPrice: x.sellingPrice,
      totalCost: x.sourcePrice + (x.handlingCost ?? 0) + (x.deliveryCost ?? 0) + (x.otherCost ?? 0),
      estimatedProfit: x.estimatedProfit,
      available: x.available !== false,
      status: x.status,
      lastPriceChecked: new Date(x.lastPriceChecked ?? x.updatedAt).toISOString(),
      history: (byId.get(String(x._id)) ?? []).slice(0, 30),
    })),
    unlinkedCount: activeIds.filter((pid: any) => !linked.has(String(pid))).length,
  };
}

/* ───────────────────────── admin users / inventory / categories ───────────────────────── */

import { AdminUserModel } from "@/models/AdminUser";
import { CategoryModel } from "@/models/Category";
import type { AdminUserRow } from "@/components/admin/admin-users-manager";

export async function getAdminUsers(selfId: string): Promise<AdminUserRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await AdminUserModel.find().sort({ createdAt: 1 }).lean();
  return plain<any[]>(docs).map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    isActive: !!d.isActive,
    locked: !!d.lockUntil && new Date(d.lockUntil).getTime() > Date.now(),
    lastLoginAt: d.lastLoginAt ? new Date(d.lastLoginAt).toISOString() : null,
    isSelf: String(d._id) === selfId,
  }));
}

export interface InventoryRow { productId: string; product: string; slug: string; status: string; color: string; size: string; available: number }

export async function getInventory(): Promise<InventoryRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await ProductModel.find().select("name slug status variants").sort({ name: 1 }).lean();
  const rows: InventoryRow[] = [];
  for (const p of plain<any[]>(docs)) {
    for (const v of p.variants ?? []) {
      for (const z of v.sizes ?? []) {
        rows.push({ productId: String(p._id), product: p.name, slug: p.slug, status: p.status, color: v.color, size: z.size, available: z.available ?? 0 });
      }
    }
  }
  return rows.sort((a, b) => a.available - b.available);
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  showInNav: boolean;
  isSystem: boolean;
}

export async function getCategoryRows(): Promise<CategoryRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await CategoryModel.find().sort({ order: 1, createdAt: 1 }).lean();
  return plain<any[]>(docs).map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image ?? "",
    productCount: c.productCount ?? 0,
    order: c.order ?? 0,
    isActive: c.isActive !== false,
    showOnHome: c.showOnHome !== false,
    showInNav: c.showInNav !== false,
    isSystem: isSystemCategory(c.slug),
  }));
}

/* ───────────────────────── product category options ───────────────────────── */
import { getAssignableCategories } from "@/lib/catalog-sync";
import { PRODUCT_CATEGORIES, isSystemCategory } from "@/lib/catalog-constants";

export async function getProductCategoryOptions() {
  if (!hasDB()) return PRODUCT_CATEGORIES.map((c) => ({ slug: c.slug as string, label: c.label as string, isActive: true }));
  await connectDB();
  return getAssignableCategories();
}

/* ───────────────────────── newsletter ───────────────────────── */
import { SubscriberModel } from "@/models/Subscriber";

export interface SubscriberRow { email: string; source: string; status: string; createdAt: string }

export async function getSubscribers(limit = 200): Promise<{ rows: SubscriberRow[]; total: number }> {
  if (!hasDB()) return { rows: [], total: 0 };
  await connectDB();
  const [docs, total] = await Promise.all([
    SubscriberModel.find({ status: "subscribed" }).sort({ createdAt: -1 }).limit(limit).lean(),
    SubscriberModel.countDocuments({ status: "subscribed" }),
  ]);
  return {
    total,
    rows: plain<any[]>(docs).map((d) => ({
      email: d.email,
      source: d.source ?? "",
      status: d.status,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
  };
}

/* ───────────────────────── shop-link picker (Instagram posts) ───────────────────────── */
export interface ShopLinkOption { id: string; name: string; live: boolean }

export async function getShopLinkOptions(): Promise<{ combos: ShopLinkOption[]; products: ShopLinkOption[] }> {
  if (!hasDB()) return { combos: [], products: [] };
  await connectDB();
  const [combos, products] = await Promise.all([
    ComboModel.find().select("name isActive").sort({ name: 1 }).lean(),
    ProductModel.find().select("name status").sort({ name: 1 }).lean(),
  ]);
  return {
    combos: plain<any[]>(combos).map((c) => ({ id: String(c._id), name: c.name, live: !!c.isActive })),
    products: plain<any[]>(products).map((p) => ({ id: String(p._id), name: p.name, live: p.status === "active" })),
  };
}

/* ───────────────────────── SEO dashboard ───────────────────────── */

export interface SeoProductIssue {
  id: string;
  name: string;
  slug: string;
  issue: string;
}

export interface SeoStats {
  totalActive: number;
  missingSeotitle: number;
  missingSeoDescription: number;
  missingImages: number;
  missingDescription: number;
  duplicateSeoTitles: number;
  duplicateSeoDescriptions: number;
  completePct: number;
  issues: SeoProductIssue[];
  sitemapUrl: string;
  robotsUrl: string;
}

export async function getSeoStats(): Promise<SeoStats> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!hasDB()) {
    return {
      totalActive: 0, missingSeotitle: 0, missingSeoDescription: 0,
      missingImages: 0, missingDescription: 0, duplicateSeoTitles: 0,
      duplicateSeoDescriptions: 0, completePct: 0, issues: [],
      sitemapUrl: `${base}/sitemap.xml`, robotsUrl: `${base}/robots.txt`,
    };
  }

  await connectDB();
  const docs = await ProductModel.find({ status: "active" })
    .select("name slug images description seoTitle seoDescription")
    .lean();

  const issues: SeoProductIssue[] = [];
  let complete = 0;

  for (const p of docs as any[]) {
    const pid = String(p._id);
    const productIssues: string[] = [];
    if (!p.images?.length) productIssues.push("No images");
    if (!p.description?.trim()) productIssues.push("No description");
    if (!p.seoTitle?.trim()) productIssues.push("No SEO title");
    if (!p.seoDescription?.trim()) productIssues.push("No meta description");
    if (productIssues.length === 0) complete++;
    else issues.push({ id: pid, name: p.name, slug: p.slug, issue: productIssues.join(" · ") });
  }

  // Detect duplicate seoTitle values (non-empty)
  const titleCounts = new Map<string, number>();
  for (const p of docs as any[]) {
    const t = p.seoTitle?.trim();
    if (t) titleCounts.set(t, (titleCounts.get(t) ?? 0) + 1);
  }
  const duplicateTitles = [...titleCounts.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0);

  const descCounts = new Map<string, number>();
  for (const p of docs as any[]) {
    const d = p.seoDescription?.trim();
    if (d) descCounts.set(d, (descCounts.get(d) ?? 0) + 1);
  }
  const duplicateDescs = [...descCounts.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0);

  const total = docs.length;
  const missingSeotitle = (docs as any[]).filter((p) => !p.seoTitle?.trim()).length;
  const missingSeoDescription = (docs as any[]).filter((p) => !p.seoDescription?.trim()).length;
  const missingImages = (docs as any[]).filter((p) => !p.images?.length).length;
  const missingDescription = (docs as any[]).filter((p) => !p.description?.trim()).length;

  return {
    totalActive: total,
    missingSeotitle,
    missingSeoDescription,
    missingImages,
    missingDescription,
    duplicateSeoTitles: duplicateTitles,
    duplicateSeoDescriptions: duplicateDescs,
    completePct: total > 0 ? Math.round((complete / total) * 100) : 100,
    issues: issues.slice(0, 50),
    sitemapUrl: `${base}/sitemap.xml`,
    robotsUrl: `${base}/robots.txt`,
  };
}
