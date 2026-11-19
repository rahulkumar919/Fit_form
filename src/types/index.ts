/**
 * Domain types for MelaMart — Men's Fashion E-commerce (Phase 1 mock layer).
 * These mirror the planned MongoDB collections so the UI can later swap
 * mock data for real database documents without type churn.
 */

export type ID = string;

export type ProductCategorySlug =
  | "all-products"
  | "jeans"
  | "shirts"
  | "t-shirts"
  | "shoes"
  | "sneakers"
  | "casual-wear"
  | "party-wear"
  | "accessories"
  | "combos"
  // admin-created categories (kept open so known slugs still autocomplete)
  | (string & {});

export interface Category {
  id: ID;
  name: string;
  slug: ProductCategorySlug;
  description: string;
  image: string;
  productCount: number;
  /** Display order (lower first) for the nav and homepage. */
  order?: number;
  /** Shown in the homepage "Shop by category" section. Defaults to true. */
  showOnHome?: boolean;
  /** Shown in the header navigation. Defaults to true. */
  showInNav?: boolean;
}

export type ProductStatus = "active" | "draft" | "archived";

export interface ProductVariant {
  id: ID;
  /** e.g. "Black" */
  color: string;
  /** hex used for swatches */
  colorHex: string;
  images: string[];
  /** available sizes for this color */
  sizes: SizeStock[];
}

export interface SizeStock {
  size: string;
  inStock: boolean;
  /** mock units available from supplier */
  available: number;
}

export interface Review {
  id: ID;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: ID;
  name: string;
  slug: string;
  category: ProductCategorySlug;
  categoryLabel: string;
  description: string;
  highlights: string[];
  material: string;
  care: string;
  price: number;
  compareAtPrice?: number;
  currency: "INR";
  images: string[];
  variants: ProductVariant[];
  /** flat list of all sizes offered across variants */
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  /** Admin-set social proof overrides — displayed when real data is 0 */
  manualRating?: number;
  manualReviewCount?: number;
  manualSoldCount?: number;
  status: ProductStatus;
  isNew: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedOffer: boolean;
  sourceRef?: string;
  createdAt: string;
  tags: string[];
  /** Admin-entered SEO overrides — optional, fall back to auto-generated if blank */
  seoTitle?: string;
  seoDescription?: string;
}

export interface ComboItemProduct {
  productId: ID;
  name: string;
  slug: string;
  image: string;
  price: number;
  category: ProductCategorySlug;
  categoryLabel: string;
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
}

export interface Combo {
  id: ID;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  /** curated outfit images */
  images: string[];
  video?: string;
  items: ComboItemProduct[];
  /** sum of individual prices */
  combinedPrice: number;
  /** discounted combo price */
  comboPrice: number;
  availableSizes: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  isTrending: boolean;
  isBestSeller: boolean;
  reelRef?: string;
}

/* ----------------------------- Cart ----------------------------- */

export interface CartComboSelection {
  productId: ID;
  size: string;
  color: string;
}

export interface CartItem {
  id: ID;
  kind: "product" | "combo";
  /** product id (for single) or combo id (for combo) */
  refId: ID;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  quantity: number;
  /** selected size + color for a single product */
  size?: string;
  color?: string;
  /** selections for each product inside a combo */
  selections?: CartComboSelection[];
  /** for combos: the included line label */
  comboItems?: { name: string; size: string; color: string }[];
}

export interface Coupon {
  code: string;
  description: string;
  type: "percentage" | "flat";
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
}

/* ----------------------------- Orders ----------------------------- */

export type OrderStatus =
  | "new"
  | "pending_sourcing"
  | "meesho_ordered"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod = "cod" | "razorpay" | "cashfree" | "partial_cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_paid";

export interface OrderItemSnapshot {
  refId?: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  kind: "product" | "combo";
  selections?: CartComboSelection[];
}

export interface FulfillmentRecord {
  id: ID;
  sourceSupplier: string;
  meeshoOrderId: string;
  status: "pending" | "ordered" | "shipped" | "delivered";
  trackingId?: string;
  carrier?: string;
  sourceCost: number;
  placedAt: string;
}

export interface Order {
  id: ID;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Partial COD only: advance charged online */
  advanceAmount?: number;
  /** Partial COD only: amount owed at delivery */
  remainingAmount?: number;
  codCollectedAt?: string | null;
  codCollectedBy?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: Address;
  fulfillments: FulfillmentRecord[];
  estimatedProfit: number;
  attribution?: { source: string; medium: string; campaign: string; linkCode: string; landingPath: string };
}

export interface Address {
  id: ID;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

/* ----------------------------- Meesho ----------------------------- */

export interface SupplierProduct {
  id: ID;
  productId: ID;
  productName: string;
  meeshoUrl: string;
  meeshoRef: string;
  supplier: string;
  sourcePrice: number;
  sellingPrice: number;
  handlingCost: number;
  deliveryCost: number;
  otherCost: number;
  estimatedProfit: number;
  lastPriceChecked: string;
  lastAvailabilityChecked: string;
  available: boolean;
  notes: string;
  status: "linked" | "unlinked" | "price_changed" | "out_of_stock";
}

export interface SourcePriceHistory {
  id: ID;
  supplierProductId: ID;
  date: string;
  sourcePrice: number;
  note: string;
}

/* ----------------------------- Admin ----------------------------- */

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  joinedAt: string;
  avatar?: string;
  city: string;
}

export interface ReelCampaign {
  id: ID;
  name: string;
  reelUrl: string;
  shareLink: string;
  linkedType: "product" | "combo";
  linkedRef: string;
  clicks: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  status: "active" | "paused" | "ended";
  createdAt: string;
}

export interface MediaAsset {
  id: ID;
  name: string;
  url: string;
  provider: "server" | "cloudinary";
  width: number;
  height: number;
  sizeKb: number;
  mime: string;
  uploadedAt: string;
  alt: string;
}

export interface KpiCard {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  hint: string;
}

export interface SalesPoint {
  label: string;
  sales: number;
  orders: number;
}
