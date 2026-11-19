import type {
  Order,
  Customer,
  SupplierProduct,
  SourcePriceHistory,
  ReelCampaign,
  MediaAsset,
  KpiCard,
  SalesPoint,
  Address,
  Product,
} from "@/types";
import { PRODUCTS, COMBOS } from "./store";
import { portrait, PHOTO } from "./images";

/* ============================== Customers ============================== */

export const CUSTOMERS: Customer[] = [
  { id: "u1", name: "Aarav Sharma", email: "aarav@example.com", phone: "+91 98765 43210", orders: 6, spent: 18450, joinedAt: "2026-08-02", city: "Mumbai" },
  { id: "u2", name: "Dev Patel", email: "dev@example.com", phone: "+91 99887 76655", orders: 3, spent: 9120, joinedAt: "2026-08-14", city: "Delhi" },
  { id: "u3", name: "Karan Mehta", email: "karan@example.com", phone: "+91 90011 22334", orders: 4, spent: 12780, joinedAt: "2026-09-01", city: "Pune" },
  { id: "u4", name: "Ishaan Gupta", email: "ishaan@example.com", phone: "+91 91234 56789", orders: 2, spent: 4998, joinedAt: "2026-09-18", city: "Jaipur" },
  { id: "u5", name: "Neel Raghav", email: "neel@example.com", phone: "+91 90123 45678", orders: 7, spent: 22340, joinedAt: "2026-08-22", city: "Bengaluru" },
  { id: "u6", name: "Rohit Kapoor", email: "rohit@example.com", phone: "+91 93456 78901", orders: 1, spent: 1499, joinedAt: "2026-10-10", city: "Chandigarh" },
  { id: "u7", name: "Yash Tiwari", email: "yash@example.com", phone: "+91 94567 89012", orders: 5, spent: 15670, joinedAt: "2026-09-25", city: "Hyderabad" },
  { id: "u8", name: "Vivaan Rao", email: "vivaan@example.com", phone: "+91 95678 90123", orders: 3, spent: 8760, joinedAt: "2026-10-04", city: "Chennai" },
];

/* ============================== Addresses for orders ============================== */

const addr = (n: number): Address => ({
  id: `oa${n}`,
  label: "Home",
  fullName: "Customer",
  phone: "+91 98765 43210",
  line1: `${n * 4}, Residency Road`,
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  isDefault: true,
});

/* ============================== Orders ============================== */

function lineImg(i: number) {
  return portrait([PHOTO.denim1, PHOTO.man4, PHOTO.shoes2, PHOTO.man3, PHOTO.redShoe, PHOTO.man12][i % 6]);
}

export const ORDERS: Order[] = [
  {
    id: "o1", orderNumber: "FF-10241", customerName: "Aarav Sharma", customerEmail: "aarav@example.com",
    date: "2026-10-30", status: "new", paymentMethod: "cod", paymentStatus: "pending",
    items: [
      { name: "Streetwear Daily Combo", image: lineImg(0), size: "M / 32 / 9", color: "Black", quantity: 1, price: 3699, kind: "combo" },
    ],
    subtotal: 3699, discount: 0, shipping: 0, total: 3699, address: addr(1),
    fulfillments: [], estimatedProfit: 980,
  },
  {
    id: "o2", orderNumber: "FF-10240", customerName: "Dev Patel", customerEmail: "dev@example.com",
    date: "2026-10-30", status: "pending_sourcing", paymentMethod: "razorpay", paymentStatus: "paid",
    items: [
      { name: "Slim Fit Stretch Denim", image: lineImg(0), size: "32", color: "Indigo", quantity: 1, price: 1499, kind: "product" },
      { name: "Heavyweight Crew Tee", image: lineImg(1), size: "L", color: "White", quantity: 2, price: 799, kind: "product" },
    ],
    subtotal: 3097, discount: 300, shipping: 0, total: 2797, address: addr(2),
    fulfillments: [], estimatedProfit: 740,
  },
  {
    id: "o3", orderNumber: "FF-10239", customerName: "Karan Mehta", customerEmail: "karan@example.com",
    date: "2026-10-29", status: "meesho_ordered", paymentMethod: "cod", paymentStatus: "pending",
    items: [
      { name: "Night Out Combo", image: lineImg(5), size: "L / 32 / 9", color: "Black", quantity: 1, price: 4499, kind: "combo" },
    ],
    subtotal: 4499, discount: 0, shipping: 0, total: 4499, address: addr(3),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Urban Threads", meeshoOrderId: "M-9912331", status: "ordered", sourceCost: 2890, placedAt: "2026-10-29" }],
    estimatedProfit: 1100,
  },
  {
    id: "o4", orderNumber: "FF-10238", customerName: "Ishaan Gupta", customerEmail: "ishaan@example.com",
    date: "2026-10-29", status: "processing", paymentMethod: "razorpay", paymentStatus: "paid",
    items: [
      { name: "Minimalist White Sneakers", image: lineImg(2), size: "9", color: "White", quantity: 1, price: 2299, kind: "product" },
    ],
    subtotal: 2299, discount: 0, shipping: 0, total: 2299, address: addr(4),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — StepUp", meeshoOrderId: "M-9912400", status: "ordered", sourceCost: 1499, placedAt: "2026-10-29" }],
    estimatedProfit: 620,
  },
  {
    id: "o5", orderNumber: "FF-10237", customerName: "Neel Raghav", customerEmail: "neel@example.com",
    date: "2026-10-28", status: "shipped", paymentMethod: "razorpay", paymentStatus: "paid",
    items: [
      { name: "Smart Casual Combo", image: lineImg(3), size: "L / 32 / 9", color: "Navy", quantity: 1, price: 4299, kind: "combo" },
      { name: "Reversible Leather Belt", image: lineImg(5), size: "One Size", color: "Black/Brown", quantity: 1, price: 899, kind: "product" },
    ],
    subtotal: 5198, discount: 519, shipping: 0, total: 4679, address: addr(5),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Urban Threads", meeshoOrderId: "M-9912210", status: "shipped", trackingId: "SR7788210IN", carrier: "Shiprocket", sourceCost: 3010, placedAt: "2026-10-28" }],
    estimatedProfit: 1180,
  },
  {
    id: "o6", orderNumber: "FF-10236", customerName: "Rohit Kapoor", customerEmail: "rohit@example.com",
    date: "2026-10-27", status: "delivered", paymentMethod: "cod", paymentStatus: "paid",
    items: [
      { name: "Oxford Cotton Shirt", image: lineImg(3), size: "L", color: "White", quantity: 1, price: 1299, kind: "product" },
    ],
    subtotal: 1299, discount: 0, shipping: 49, total: 1348, address: addr(6),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Cotton Co.", meeshoOrderId: "M-9912005", status: "delivered", trackingId: "SR7788005IN", carrier: "Shiprocket", sourceCost: 740, placedAt: "2026-10-27" }],
    estimatedProfit: 320,
  },
  {
    id: "o7", orderNumber: "FF-10235", customerName: "Yash Tiwari", customerEmail: "yash@example.com",
    date: "2026-10-26", status: "delivered", paymentMethod: "razorpay", paymentStatus: "paid",
    items: [
      { name: "Weekend Ease Combo", image: lineImg(1), size: "XL / 34 / 10", color: "Sand", quantity: 1, price: 4099, kind: "combo" },
    ],
    subtotal: 4099, discount: 410, shipping: 0, total: 3689, address: addr(7),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Urban Threads", meeshoOrderId: "M-9911980", status: "delivered", trackingId: "SR7787980IN", carrier: "Shiprocket", sourceCost: 2660, placedAt: "2026-10-26" }],
    estimatedProfit: 1020,
  },
  {
    id: "o8", orderNumber: "FF-10234", customerName: "Vivaan Rao", customerEmail: "vivaan@example.com",
    date: "2026-10-25", status: "cancelled", paymentMethod: "cod", paymentStatus: "failed",
    items: [
      { name: "Distressed Skinny Jeans", image: lineImg(0), size: "32", color: "Dark Wash", quantity: 1, price: 1799, kind: "product" },
    ],
    subtotal: 1799, discount: 0, shipping: 0, total: 1799, address: addr(8),
    fulfillments: [], estimatedProfit: 0,
  },
  {
    id: "o9", orderNumber: "FF-10233", customerName: "Aarav Sharma", customerEmail: "aarav@example.com",
    date: "2026-10-24", status: "returned", paymentMethod: "razorpay", paymentStatus: "refunded",
    items: [
      { name: "Graphic Print Tee", image: lineImg(1), size: "L", color: "Black Print", quantity: 1, price: 699, kind: "product" },
    ],
    subtotal: 699, discount: 0, shipping: 0, total: 699, address: addr(9),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Cotton Co.", meeshoOrderId: "M-9911900", status: "delivered", sourceCost: 380, placedAt: "2026-10-24" }],
    estimatedProfit: -120,
  },
  {
    id: "o10", orderNumber: "FF-10232", customerName: "Neel Raghav", customerEmail: "neel@example.com",
    date: "2026-10-23", status: "delivered", paymentMethod: "razorpay", paymentStatus: "paid",
    items: [
      { name: "Office Sharp Combo", image: lineImg(2), size: "L / 32 / 9", color: "White", quantity: 1, price: 4799, kind: "combo" },
    ],
    subtotal: 4799, discount: 480, shipping: 0, total: 4319, address: addr(10),
    fulfillments: [{ id: "f1", sourceSupplier: "Meesho — Urban Threads", meeshoOrderId: "M-9911850", status: "delivered", trackingId: "SR7787850IN", carrier: "Shiprocket", sourceCost: 3010, placedAt: "2026-10-23" }],
    estimatedProfit: 1190,
  },
];

/* ============================== Supplier (Meesho) products ============================== */

function supplier(p: Product, sourcePrice: number, status: SupplierProduct["status"] = "linked"): SupplierProduct {
  const handling = 40, delivery = 60, other = 20;
  return {
    id: `s_${p.id}`, productId: p.id, productName: p.name,
    meeshoUrl: `https://www.meesho.com/p/${p.sourceRef}`,
    meeshoRef: p.sourceRef ?? "", supplier: ["Urban Threads", "Cotton Co.", "StepUp", "Premium Basics"][Math.floor(Math.random() * 4)],
    sourcePrice, sellingPrice: p.price, handlingCost: handling, deliveryCost: delivery, otherCost: other,
    estimatedProfit: p.price - sourcePrice - handling - delivery - other,
    lastPriceChecked: "2026-10-30", lastAvailabilityChecked: "2026-10-30",
    available: status !== "out_of_stock", notes: "Verified reseller workflow. Manual ordering.", status,
  };
}

export const SUPPLIER_PRODUCTS: SupplierProduct[] = PRODUCTS.slice(0, 14).map((p, i) =>
  supplier(p, Math.round(p.price * (0.55 + (i % 3) * 0.04)), (["linked", "linked", "price_changed", "out_of_stock"] as const)[i % 4]),
);

export const SOURCE_PRICE_HISTORY: SourcePriceHistory[] = [
  { id: "h1", supplierProductId: "s_p1", date: "2026-10-20", sourcePrice: 820, note: "Price increased" },
  { id: "h2", supplierProductId: "s_p1", date: "2026-10-10", sourcePrice: 790, note: "Stable" },
  { id: "h3", supplierProductId: "s_p1", date: "2026-09-30", sourcePrice: 760, note: "First check" },
  { id: "h4", supplierProductId: "s_p5", date: "2026-10-22", sourcePrice: 710, note: "Decreased" },
  { id: "h5", supplierProductId: "s_p5", date: "2026-10-01", sourcePrice: 760, note: "Stable" },
];

/* ============================== Reel campaigns ============================== */

export const REEL_CAMPAIGNS: ReelCampaign[] = [
  { id: "rc1", name: "Streetwear Combo Reel", reelUrl: "https://instagram.com/reel/abc1", shareLink: "/combo/streetwear-daily-combo?ref=instagram_reel_01", linkedType: "combo", linkedRef: "co1", clicks: 8420, orders: 142, revenue: 525258, conversionRate: 1.69, status: "active", createdAt: "2026-10-12" },
  { id: "rc2", name: "Night Out Drop", reelUrl: "https://instagram.com/reel/abc2", shareLink: "/combo/night-out-combo?ref=instagram_reel_03", linkedType: "combo", linkedRef: "co3", clicks: 6210, orders: 96, revenue: 431904, conversionRate: 1.55, status: "active", createdAt: "2026-10-15" },
  { id: "rc3", name: "White Sneakers Hype", reelUrl: "https://instagram.com/reel/abc3", shareLink: "/product/minimalist-white-sneakers?ref=instagram_reel_05", linkedType: "product", linkedRef: "p16", clicks: 5300, orders: 71, revenue: 163229, conversionRate: 1.34, status: "active", createdAt: "2026-10-18" },
  { id: "rc4", name: "Summer Linen Edit", reelUrl: "https://instagram.com/reel/abc4", shareLink: "/combo/summer-linen-combo?ref=instagram_reel_04", linkedType: "combo", linkedRef: "co6", clicks: 3100, orders: 34, revenue: 118966, conversionRate: 1.10, status: "paused", createdAt: "2026-10-22" },
];

/* ============================== Media assets ============================== */

export const MEDIA_ASSETS: MediaAsset[] = [
  { id: "m1", name: "denim-front.webp", url: portrait(PHOTO.denim1), provider: "cloudinary", width: 700, height: 930, sizeKb: 38, mime: "image/webp", uploadedAt: "2026-10-20", alt: "Slim fit denim front" },
  { id: "m2", name: "tee-white.webp", url: portrait(PHOTO.man4), provider: "cloudinary", width: 700, height: 930, sizeKb: 42, mime: "image/webp", uploadedAt: "2026-10-20", alt: "Heavyweight crew tee" },
  { id: "m3", name: "sneakers-white.webp", url: portrait(PHOTO.shoes2), provider: "server", width: 700, height: 930, sizeKb: 36, mime: "image/webp", uploadedAt: "2026-10-19", alt: "White sneakers" },
  { id: "m4", name: "combo-streetwear.webp", url: portrait(PHOTO.man20), provider: "cloudinary", width: 700, height: 930, sizeKb: 44, mime: "image/webp", uploadedAt: "2026-10-18", alt: "Streetwear combo" },
  { id: "m5", name: "oxford-shirt.webp", url: portrait(PHOTO.man3), provider: "server", width: 700, height: 930, sizeKb: 35, mime: "image/webp", uploadedAt: "2026-10-17", alt: "Oxford shirt" },
  { id: "m6", name: "loafers-brown.webp", url: portrait(PHOTO.shoes3), provider: "cloudinary", width: 700, height: 930, sizeKb: 39, mime: "image/webp", uploadedAt: "2026-10-16", alt: "Suede loafers" },
  { id: "m7", name: "aviator-shades.webp", url: portrait(PHOTO.man13), provider: "server", width: 700, height: 930, sizeKb: 31, mime: "image/webp", uploadedAt: "2026-10-15", alt: "Aviator sunglasses" },
  { id: "m8", name: "watch-tan.webp", url: portrait(PHOTO.man12), provider: "cloudinary", width: 700, height: 930, sizeKb: 33, mime: "image/webp", uploadedAt: "2026-10-14", alt: "Minimalist watch" },
];

/* ============================== Dashboard KPIs + charts ============================== */

export const DASHBOARD_KPIS: KpiCard[] = [
  { label: "Total Revenue", value: "₹3,84,250", delta: 12.4, trend: "up", hint: "vs last 30 days" },
  { label: "Total Orders", value: "1,284", delta: 8.1, trend: "up", hint: "vs last 30 days" },
  { label: "Total Products", value: "22", delta: 0, trend: "flat", hint: "12 active combos" },
  { label: "Active Combos", value: "6", delta: 2, trend: "up", hint: "2 new this week" },
  { label: "Estimated Profit", value: "₹96,540", delta: 9.6, trend: "up", hint: "before returns" },
  { label: "Pending Orders", value: "18", delta: -3, trend: "down", hint: "awaiting sourcing" },
  { label: "Orders to Source", value: "7", delta: 1, trend: "up", hint: "manual Meesho order" },
  { label: "Conversion Rate", value: "1.62%", delta: 0.14, trend: "up", hint: "reel attributed" },
];

export const SALES_DATA: Record<"day" | "week" | "month", SalesPoint[]> = {
  day: [
    { label: "00", sales: 4200, orders: 4 }, { label: "04", sales: 6100, orders: 6 },
    { label: "08", sales: 9800, orders: 9 }, { label: "12", sales: 14200, orders: 13 },
    { label: "16", sales: 18900, orders: 17 }, { label: "20", sales: 22400, orders: 21 },
  ],
  week: [
    { label: "Mon", sales: 28400, orders: 26 }, { label: "Tue", sales: 31200, orders: 29 },
    { label: "Wed", sales: 26800, orders: 24 }, { label: "Thu", sales: 34500, orders: 31 },
    { label: "Fri", sales: 41200, orders: 38 }, { label: "Sat", sales: 52800, orders: 49 },
    { label: "Sun", sales: 47800, orders: 44 },
  ],
  month: [
    { label: "W1", sales: 142000, orders: 132 }, { label: "W2", sales: 168000, orders: 154 },
    { label: "W3", sales: 194000, orders: 178 }, { label: "W4", sales: 226000, orders: 208 },
  ],
};

export const ORDERS_TREND: SalesPoint[] = SALES_DATA.week;

export const BEST_SELLING_PRODUCTS = [
  { name: "Minimalist White Sneakers", units: 176, revenue: 404624 },
  { name: "Heavyweight Crew Tee", units: 210, revenue: 167790 },
  { name: "Oxford Cotton Shirt", units: 142, revenue: 184458 },
  { name: "Slim Fit Stretch Denim", units: 128, revenue: 191872 },
  { name: "Leather Derby Shoes", units: 88, revenue: 263912 },
];

export const BEST_SELLING_COMBOS = [
  { name: "Streetwear Daily Combo", units: 64, revenue: 236736 },
  { name: "Weekend Ease Combo", units: 52, revenue: 213148 },
  { name: "Night Out Combo", units: 33, revenue: 148467 },
  { name: "Smart Casual Combo", units: 41, revenue: 176259 },
];

export const INSTAGRAM_TRAFFIC = [
  { label: "Reel clicks", value: 23030 },
  { label: "Store visits", value: 18420 },
  { label: "Conversions", value: 343 },
];

export const RECENT_ORDERS = ORDERS.slice(0, 6);

export const LOW_AVAILABILITY_PRODUCTS = PRODUCTS.filter((p) =>
  p.variants.some((v) => v.sizes.some((s) => !s.inStock || s.available < 6)),
).slice(0, 6).map((p) => ({
  id: p.id, name: p.name, image: p.images[0],
  available: p.variants.flatMap((v) => v.sizes).reduce((a, s) => a + s.available, 0),
  status: p.variants.flatMap((v) => v.sizes).some((s) => !s.inStock) ? "Low" : "OK",
}));

export const PENDING_SOURCING_TASKS = ORDERS.filter((o) =>
  ["new", "pending_sourcing"].includes(o.status),
).map((o) => ({ id: o.id, orderNumber: o.orderNumber, customer: o.customerName, items: o.items.length, date: o.date }));

/* ============================== Selectors ============================== */

export function getOrdersByStatus(status: Order["status"] | "all"): Order[] {
  if (status === "all") return ORDERS;
  return ORDERS.filter((o) => o.status === status);
}

export function getCustomerById(id: string): Customer | undefined {
  return CUSTOMERS.find((c) => c.id === id);
}

export function getSupplierByProductId(productId: string): SupplierProduct | undefined {
  return SUPPLIER_PRODUCTS.find((s) => s.productId === productId);
}

export const COMBO_REF = COMBOS;
