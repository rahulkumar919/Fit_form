/** Client + server safe homepage helpers, shared by the storefront and the admin builder preview. */
import type { Category, Combo, Product } from "@/types";
import {
  sectionSchema, footerSchema,
  type CategoriesSection, type CombosSection, type FeatureItem, type FooterConfig, type HomeSection,
  type HomepageSettings, type ProductsSection, type SectionType,
} from "@/lib/validations/homepage";

export interface BannerView {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobileImage: string;
  alt: string;
  ctaLabel: string;
  ctaHref: string;
  highlights: string[];
  theme: "dark" | "light";
  overlay: boolean;
}

export interface SocialView {
  id: string;
  kind: "reel" | "post";
  instagramUrl: string;
  image: string;
  video: string;
  caption: string;
  showInReels: boolean;
  showInGallery: boolean;
  /** Resolved shop link (null when unlinked or the item is no longer on sale). */
  shop: { type: "combo" | "product"; name: string; href: string; price: number; image: string } | null;
}

/* ───────────────────────── section catalogue ───────────────────────── */

export const SECTION_META: Record<SectionType, { label: string; description: string }> = {
  hero: { label: "Hero banner slider", description: "Big sliding banners at the top (managed below the settings)." },
  promo: { label: "Promo banner", description: "1–4 clickable banner images anywhere on the page: sale, new drop, category push." },
  categories: { label: "Category row", description: "Category tiles, circles or cards. Pick which ones or use your homepage set." },
  products: { label: "Product row", description: "Best sellers, new arrivals, a category, a sale, or hand-picked products." },
  combos: { label: "Combo row", description: "Outfit combos at a better price." },
  features: { label: "Trust strip", description: "Free delivery, COD, easy returns… short reasons to buy." },
  reels: { label: "Shop the Reel", description: "Instagram reels with a shop button." },
  gallery: { label: "Instagram gallery", description: "Grid of posts, each opening its own Instagram link." },
  reviews: { label: "Customer reviews", description: "Latest approved reviews from verified buyers." },
  newsletter: { label: "Email sign-up", description: "Collect emails and show the welcome coupon." },
};

/** Random section id (lowercase letters + digits). */
export function newSectionId(): string {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "truck", title: "Free delivery", text: "On orders above {freeShipping}" },
  { icon: "cod", title: "Cash on Delivery", text: "Pay when it arrives" },
  { icon: "returns", title: "Easy returns", text: "7-day return window" },
  { icon: "secure", title: "Secure checkout", text: "UPI, cards & more" },
];

/** A fresh section of the given type with sensible defaults. */
export function createSection(type: SectionType, id = newSectionId()): HomeSection {
  switch (type) {
    case "hero": return { type, id, enabled: true, autoplaySeconds: 6, height: "standard", mobileAspect: "16/7" };
    case "promo": return { type, id, enabled: true, eyebrow: "", title: "", subtitle: "", items: [], aspect: "3/1", mobileAspect: "16/9", mobileLayout: "stack", fullWidth: false, rounded: true };
    case "categories": return { type, id, enabled: true, eyebrow: "Browse", title: "Shop by category", count: 8, perRow: 8, style: "tile", mobileLayout: "scroll", mobilePerRow: 3, showCount: false, showViewAll: true, slugs: [] };
    case "products": return { type, id, enabled: true, eyebrow: "", title: "Best sellers", subtitle: "", source: "bestsellers", category: "", productIds: [], sort: "default", count: 8, perRow: 4, layout: "rail", mobileSize: "md", showViewAll: true, viewAllHref: "" };
    case "combos": return { type, id, enabled: true, eyebrow: "Save more", title: "Trending outfit combos", subtitle: "Complete looks at a better price than buying separately.", source: "trending", count: 4, perRow: 4, mobileLayout: "scroll", mobileSize: "md" };
    case "features": return { type, id, enabled: true, items: DEFAULT_FEATURES.map((f) => ({ ...f })), style: "plain" };
    case "reels": return { type, id, enabled: true, title: "Shop the Reel", subtitle: "Watch the look, then shop it in a tap.", count: 5, autoplay: true };
    case "gallery": return { type, id, enabled: true, title: "Follow the looks", count: 6 };
    case "reviews": return { type, id, enabled: true, eyebrow: "From verified buyers", title: "What customers say", count: 6 };
    case "newsletter": return { type, id, enabled: true, title: "Get 10% off your first order", subtitle: "Join the list for new drops, styling tips and exclusive combo offers." };
  }
}

export const DEFAULT_FOOTER: FooterConfig = {
  tagline: "Premium men's fashion, curated into complete outfits and delivered to your door across India.",
  showFeatures: true,
  features: DEFAULT_FEATURES.map((f) => ({ ...f })),
  columns: [
    { title: "Shop", links: [{ label: "All products", href: "/shop/all-products" }, { label: "Complete combos", href: "/combos" }] },
    { title: "Help", links: [{ label: "Track order", href: "/orders" }, { label: "Contact us", href: "/contact-us" }, { label: "Shipping policy", href: "/shipping-policy" }] },
    { title: "Account", links: [{ label: "My account", href: "/account" }, { label: "My orders", href: "/orders" }, { label: "Wishlist", href: "/wishlist" }] },
  ],
  showPayments: true,
  copyright: "",
};

function defaultSections(): HomeSection[] {
  const p = (id: string, title: string, eyebrow: string, subtitle: string, source: ProductsSection["source"]): HomeSection =>
    ({ ...(createSection("products", id) as ProductsSection), title, eyebrow, subtitle, source });
  return [
    createSection("hero", "hero0001"),
    createSection("categories", "cats0001"),
    createSection("combos", "combo001"),
    p("best0001", "Best-selling products", "Most wanted", "What our customers keep coming back for.", "bestsellers"),
    createSection("reels", "reels001"),
    p("new00001", "New arrivals", "Just landed", "The latest additions to the collection.", "new"),
    p("ltd00001", "Limited-time offers", "Limited time", "Grab these before they're gone.", "limited"),
    createSection("reviews", "revw0001"),
    createSection("gallery", "gall0001"),
  ];
}

export const DEFAULT_HOMEPAGE: HomepageSettings = {
  sections: defaultSections(),
  instagramHandle: "",
  social: { facebook: "", youtube: "" },
  floating: { whatsapp: false, whatsappMessage: "", instagram: false },
  footer: DEFAULT_FOOTER,
  bottomNav: { enabled: true, items: ["home", "shop", "combos", "wishlist", "bag"] },
};

type Legacy = {
  banner?: Record<string, unknown>; categories?: Record<string, unknown>; combos?: Record<string, unknown>;
  reels?: Record<string, unknown>; gallery?: Record<string, unknown>;
};

/** Build sections from the older fixed-layout settings (before the builder) so nothing changes on upgrade. */
function legacySections(v: Legacy): HomeSection[] {
  const merge = (s: HomeSection, patch?: Record<string, unknown>) => (patch ? { ...s, ...patch, type: s.type, id: s.id } : s) as HomeSection;
  return defaultSections().map((s) => {
    if (s.type === "hero") return merge(s, v.banner);
    if (s.type === "categories") return merge(s, v.categories);
    if (s.type === "combos") return merge(s, v.combos);
    if (s.type === "reels") return merge(s, v.reels);
    if (s.type === "gallery") return merge(s, v.gallery);
    return s;
  });
}

/** Merge stored (possibly partial / older) settings over defaults. Invalid sections are dropped, never crash the page. */
export function mergeHomepage(raw: unknown): HomepageSettings {
  const v = (raw ?? {}) as Partial<HomepageSettings> & Legacy;
  let sections: HomeSection[];
  if (Array.isArray(v.sections)) {
    sections = v.sections.flatMap((s) => {
      const base = s && typeof s === "object" && "type" in s ? createSection((s as { type: SectionType }).type, (s as { id?: string }).id) : null;
      if (!base) return [];
      const r = sectionSchema.safeParse({ ...base, ...s });
      return r.success ? [r.data] : [];
    });
  } else {
    sections = legacySections(v);
  }
  const footer = footerSchema.safeParse({ ...DEFAULT_FOOTER, ...(v.footer ?? {}) });
  return {
    sections,
    instagramHandle: typeof v.instagramHandle === "string" ? v.instagramHandle : "",
    social: { ...DEFAULT_HOMEPAGE.social, ...(v.social ?? {}) },
    floating: { ...DEFAULT_HOMEPAGE.floating, ...(v.floating ?? {}) },
    footer: footer.success ? footer.data : DEFAULT_FOOTER,
    bottomNav: { ...DEFAULT_HOMEPAGE.bottomNav, ...(v.bottomNav ?? {}) },
  };
}

/* ───────────────────────── data selection ───────────────────────── */

/** Categories for a category section: explicit slugs in that order, else homepage-flagged in admin order. */
export function selectHomeCategories(categories: Category[], count: number, slugs: string[] = []): Category[] {
  if (slugs.length) {
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    return slugs.map((s) => bySlug.get(s)).filter((c): c is Category => !!c).slice(0, count);
  }
  return categories
    .filter((c) => c.showOnHome !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, count);
}

const discount = (p: Product) => (p.compareAtPrice && p.compareAtPrice > p.price ? (p.compareAtPrice - p.price) / p.compareAtPrice : 0);

export function selectProducts(s: ProductsSection, all: Product[]): Product[] {
  let list: Product[];
  switch (s.source) {
    case "bestsellers": list = all.filter((p) => p.isBestSeller); break;
    case "new": list = all.filter((p) => p.isNew); break;
    case "limited": list = all.filter((p) => p.isLimitedOffer); break;
    case "trending": list = all.filter((p) => p.isTrending); break;
    case "sale": list = all.filter((p) => discount(p) > 0); break;
    case "category":
      list = s.category === "casual-wear" ? all.filter((p) => p.tags.includes("casual"))
        : s.category === "party-wear" ? all.filter((p) => p.tags.includes("party"))
        : s.category === "all-products" ? all
        : all.filter((p) => p.category === s.category);
      break;
    case "manual": {
      const byId = new Map(all.map((p) => [p.id, p]));
      list = s.productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
      break;
    }
    default: list = all;
  }
  list = [...list];
  switch (s.sort) {
    case "newest": list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    case "price-asc": list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "discount": list.sort((a, b) => discount(b) - discount(a)); break;
  }
  return list.slice(0, s.count);
}

export function productsViewAllHref(s: ProductsSection): string {
  if (s.viewAllHref) return s.viewAllHref;
  if (s.source === "category" && s.category) return s.category === "combos" ? "/combos" : `/shop/${s.category}`;
  return "/shop/all-products";
}

export function selectCombos(s: CombosSection, all: Combo[]): Combo[] {
  const list = s.source === "trending" ? all.filter((c) => c.isTrending) : s.source === "bestsellers" ? all.filter((c) => c.isBestSeller) : all;
  return list.slice(0, s.count);
}

export type { CategoriesSection };

/** Replace {freeShipping} in admin-written text with the live threshold, so copy never goes stale. */
export function fillTokens(text: string, store: { freeShippingThreshold: number }): string {
  const v = store.freeShippingThreshold > 0 ? `₹${store.freeShippingThreshold.toLocaleString("en-IN")}` : "any amount";
  return text.replace(/\{freeShipping\}/g, v);
}
