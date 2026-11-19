import { z } from "zod";
import { imageUrlSchema } from "@/lib/validations/product";
import { IMAGE_URL_MESSAGE, isAllowedImageUrl, SLUG_RE } from "@/lib/catalog-constants";
import { normaliseHandle, parseInstagramUrl } from "@/lib/instagram";
import { isAllowedVideoUrl } from "@/lib/storage/video-url";

/** Internal storefront path only: no protocol-relative URLs, no admin/api targets. */
export const internalHrefSchema = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) => v === "" || (/^\/(?!\/)[A-Za-z0-9\-._~/?#=&%]*$/.test(v) && !/^\/(admin|api)(\/|$)/.test(v)),
    "Use a store path like /combos or /shop/jeans",
  );

const optionalImage = z
  .string()
  .trim()
  .refine((v) => v === "" || isAllowedImageUrl(v), IMAGE_URL_MESSAGE);

const optionalDate = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

export const bannerInputSchema = z
  .object({
    title: z.string().trim().max(80),
    subtitle: z.string().trim().max(160),
    eyebrow: z.string().trim().max(40),
    image: imageUrlSchema,
    mobileImage: optionalImage,
    alt: z.string().trim().max(160),
    ctaLabel: z.string().trim().max(30),
    ctaHref: internalHrefSchema,
    highlights: z.array(z.string().trim().min(1).max(30)).max(3),
    theme: z.enum(["dark", "light"]),
    overlay: z.boolean(),
    isActive: z.boolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
  })
  .superRefine((v, ctx) => {
    if (v.ctaLabel && !v.ctaHref) ctx.addIssue({ code: "custom", path: ["ctaHref"], message: "Add a link for the button" });
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
    }
  });
export type BannerInput = z.infer<typeof bannerInputSchema>;

/** Partial update used by quick toggles in the list. */
export const bannerPatchSchema = z.object({ isActive: z.boolean() });

export const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1).max(200),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
  slug: z.string().trim().toLowerCase().min(2).max(40).regex(SLUG_RE, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().max(240),
  image: optionalImage,
  isActive: z.boolean(),
  showOnHome: z.boolean(),
  showInNav: z.boolean(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryPatchSchema = categoryInputSchema
  .pick({ isActive: true, showOnHome: true, showInNav: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

/* ── Homepage layout settings ── */
export const CATEGORY_COUNTS = [4, 6, 8, 10, 12] as const;
export const CATEGORY_PER_ROW = [4, 5, 6, 8, 10] as const;
export const CATEGORY_STYLES = ["tile", "circle", "card"] as const;
export const BANNER_HEIGHTS = ["compact", "standard", "tall"] as const;
/** Phone banner aspect: taller = more image visible. */
export const MOBILE_BANNER_ASPECTS = ["16/7", "16/9", "4/3", "1/1", "4/5"] as const;
export const CATEGORY_MOBILE_COLS = [2, 3, 4, 5] as const;
export const COMBO_COUNTS = [3, 4, 6, 8, 10, 12] as const;
export const COMBO_PER_ROW = [2, 3, 4, 5, 6] as const;
/** Card size on phones: lg ≈ 1.5 per screen, md = 2, sm = 3. */
export const MOBILE_CARD_SIZES = ["lg", "md", "sm"] as const;
export const BOTTOM_NAV_ITEMS = ["home", "shop", "combos", "search", "wishlist", "bag", "account", "orders"] as const;
export type BottomNavItem = (typeof BOTTOM_NAV_ITEMS)[number];
export const REEL_COUNTS = [4, 5, 6, 8, 10] as const;
export const GALLERY_COUNTS = [6, 12] as const;

export const PRODUCT_COUNTS = [4, 6, 8, 10, 12, 16] as const;
export const CARD_PER_ROW = [2, 3, 4, 5, 6] as const;
export const REVIEW_COUNTS = [3, 6, 9] as const;
export const PRODUCT_SOURCES = ["bestsellers", "new", "limited", "trending", "sale", "category", "manual", "all"] as const;
export const PRODUCT_SORTS = ["default", "newest", "price-asc", "price-desc", "discount"] as const;
export const COMBO_SOURCES = ["trending", "bestsellers", "all"] as const;
export const PROMO_ASPECTS = ["21/9", "3/1", "4/1", "6/1", "16/9", "4/3", "1/1", "4/5"] as const;
export const FEATURE_ICONS = ["truck", "cod", "returns", "secure", "tag", "star", "support", "gift"] as const;
export const SECTION_TYPES = ["hero", "promo", "categories", "products", "combos", "features", "reels", "gallery", "reviews", "newsletter"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const literalNumber = <T extends readonly number[]>(vals: T) =>
  z.number().refine((n) => (vals as readonly number[]).includes(n), `Choose one of ${vals.join(", ")}`) as unknown as z.ZodType<T[number]>;

const t = (max: number) => z.string().trim().max(max);
const sectionBase = {
  id: z.string().regex(/^[a-z0-9]{4,16}$/, "Invalid section id"),
  enabled: z.boolean(),
};
const heading = { eyebrow: t(30), title: t(60), subtitle: t(120) };
const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

export const heroSectionSchema = z.object({
  type: z.literal("hero"), ...sectionBase,
  autoplaySeconds: z.number().int().min(0).max(15),
  height: z.enum(BANNER_HEIGHTS),
  /** How tall the banner is on phones. Default "4/3". */
  mobileAspect: z.enum(MOBILE_BANNER_ASPECTS).optional().default("4/3"),
});

export const promoItemSchema = z.object({
  image: imageUrlSchema,
  mobileImage: optionalImage,
  alt: t(160),
  href: internalHrefSchema,
  title: t(60),
  subtitle: t(120),
  ctaLabel: t(30),
  theme: z.enum(["dark", "light"]),
  overlay: z.boolean(),
});
export const promoSectionSchema = z.object({
  type: z.literal("promo"), ...sectionBase, ...heading,
  items: z.array(promoItemSchema).min(1, "Add at least one banner image").max(4),
  aspect: z.enum(PROMO_ASPECTS),
  mobileAspect: z.enum(PROMO_ASPECTS),
  mobileLayout: z.enum(["stack", "scroll", "grid"]),
  fullWidth: z.boolean(),
  rounded: z.boolean(),
});

export const categoriesSectionSchema = z.object({
  type: z.literal("categories"), ...sectionBase,
  eyebrow: t(30),
  title: t(60),
  count: literalNumber(CATEGORY_COUNTS),
  perRow: literalNumber(CATEGORY_PER_ROW),
  /** How many category tiles per row on phones. */
  mobilePerRow: z.number().refine((n) => (CATEGORY_MOBILE_COLS as readonly number[]).includes(n)).optional().default(3),
  style: z.enum(CATEGORY_STYLES),
  mobileLayout: z.enum(["grid", "scroll"]),
  showCount: z.boolean(),
  showViewAll: z.boolean(),
  /** Empty = categories switched on for the homepage (Admin → Categories). Otherwise these slugs, in this order. */
  slugs: z.array(z.string().regex(SLUG_RE)).max(20),
});

export const productsSectionSchema = z
  .object({
    type: z.literal("products"), ...sectionBase, ...heading,
    source: z.enum(PRODUCT_SOURCES),
    category: z.string().regex(SLUG_RE).or(z.literal("")),
    productIds: z.array(objectId).max(24),
    sort: z.enum(PRODUCT_SORTS),
    count: literalNumber(PRODUCT_COUNTS),
    perRow: literalNumber(CARD_PER_ROW),
    layout: z.enum(["rail", "grid"]),
    mobileSize: z.enum(MOBILE_CARD_SIZES),
    showViewAll: z.boolean(),
    viewAllHref: internalHrefSchema,
  })
  .superRefine((v, ctx) => {
    if (v.source === "category" && !v.category) ctx.addIssue({ code: "custom", path: ["category"], message: "Choose a category" });
    if (v.source === "manual" && v.productIds.length === 0) ctx.addIssue({ code: "custom", path: ["productIds"], message: "Pick at least one product" });
  });

export const combosSectionSchema = z.object({
  type: z.literal("combos"), ...sectionBase, ...heading,
  source: z.enum(COMBO_SOURCES),
  count: literalNumber(COMBO_COUNTS),
  perRow: literalNumber(COMBO_PER_ROW),
  mobileLayout: z.enum(["grid", "scroll"]),
  mobileSize: z.enum(MOBILE_CARD_SIZES),
});

export const featureItemSchema = z.object({ icon: z.enum(FEATURE_ICONS), title: t(40).min(1, "Add a title"), text: t(70) });
export const featuresSectionSchema = z.object({
  type: z.literal("features"), ...sectionBase,
  items: z.array(featureItemSchema).min(1).max(6),
  style: z.enum(["plain", "cards"]),
});

export const reelsSectionSchema = z.object({
  type: z.literal("reels"), ...sectionBase,
  title: t(60), subtitle: t(120),
  count: literalNumber(REEL_COUNTS),
  autoplay: z.boolean(),
});
export const gallerySectionSchema = z.object({
  type: z.literal("gallery"), ...sectionBase,
  title: t(60),
  count: literalNumber(GALLERY_COUNTS),
});
export const reviewsSectionSchema = z.object({
  type: z.literal("reviews"), ...sectionBase,
  eyebrow: t(30), title: t(60),
  count: literalNumber(REVIEW_COUNTS),
});
export const newsletterSectionSchema = z.object({
  type: z.literal("newsletter"), ...sectionBase,
  title: t(60), subtitle: t(120),
});

export const sectionSchema = z.union([
  heroSectionSchema, promoSectionSchema, categoriesSectionSchema, productsSectionSchema, combosSectionSchema,
  featuresSectionSchema, reelsSectionSchema, gallerySectionSchema, reviewsSectionSchema, newsletterSectionSchema,
]);
export type HomeSection = z.infer<typeof sectionSchema>;
export type HeroSection = z.infer<typeof heroSectionSchema>;
export type PromoSection = z.infer<typeof promoSectionSchema>;
export type PromoItem = z.infer<typeof promoItemSchema>;
export type CategoriesSection = z.infer<typeof categoriesSectionSchema>;
export type ProductsSection = z.infer<typeof productsSectionSchema>;
export type CombosSection = z.infer<typeof combosSectionSchema>;
export type FeaturesSection = z.infer<typeof featuresSectionSchema>;
export type FeatureItem = z.infer<typeof featureItemSchema>;
export type ReelsSection = z.infer<typeof reelsSectionSchema>;
export type GallerySection = z.infer<typeof gallerySectionSchema>;
export type ReviewsSection = z.infer<typeof reviewsSectionSchema>;
export type NewsletterSection = z.infer<typeof newsletterSectionSchema>;

const externalUrl = (hosts: RegExp, msg: string) =>
  z.string().trim().max(200).refine((v) => {
    if (v === "") return true;
    try { const u = new URL(v); return u.protocol === "https:" && hosts.test(u.hostname); } catch { return false; }
  }, msg);

export const footerSchema = z.object({
  tagline: t(240),
  showFeatures: z.boolean(),
  features: z.array(featureItemSchema).max(4),
  columns: z.array(z.object({
    title: t(30).min(1, "Add a column title"),
    links: z.array(z.object({ label: t(40).min(1, "Add a link label"), href: internalHrefSchema.refine((v) => v !== "", "Add a link") })).max(8),
  })).max(4),
  showPayments: z.boolean(),
  copyright: t(80),
});
export type FooterConfig = z.infer<typeof footerSchema>;

export const homepageSettingsSchema = z
  .object({
    sections: z.array(sectionSchema).max(40),
    instagramHandle: z
      .string()
      .trim()
      .max(80)
      .refine((v) => v === "" || normaliseHandle(v) !== "", "Enter your Instagram username, e.g. melamart")
      .transform(normaliseHandle),
    social: z.object({
      facebook: externalUrl(/(^|\.)facebook\.com$/i, "Use a facebook.com link"),
      youtube: externalUrl(/(^|\.)(youtube\.com|youtu\.be)$/i, "Use a youtube.com link"),
    }),
    floating: z.object({
      whatsapp: z.boolean(),
      whatsappMessage: t(120),
      instagram: z.boolean(),
    }),
    footer: footerSchema,
    bottomNav: z.object({
      enabled: z.boolean(),
      items: z.array(z.enum(BOTTOM_NAV_ITEMS)).min(3, "Pick at least 3 buttons").max(5, "Up to 5 buttons fit on a phone")
        .refine((v) => new Set(v).size === v.length, "Each button only once"),
    }),
  })
  .superRefine((v, ctx) => {
    const ids = new Set<string>();
    v.sections.forEach((s, i) => {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", path: ["sections", i, "id"], message: "Duplicate section id" });
      ids.add(s.id);
    });
    if (v.floating.instagram && !v.instagramHandle) {
      ctx.addIssue({ code: "custom", path: ["floating", "instagram"], message: "Add your Instagram username to show the Instagram button" });
    }
  });
export type HomepageSettings = z.infer<typeof homepageSettingsSchema>;

/* ── Instagram posts / reels ── */

export const socialPostInputSchema = z
  .object({
    instagramUrl: z.string().trim().refine((v) => !!parseInstagramUrl(v), "Paste a public Instagram reel or post link, e.g. https://www.instagram.com/reel/ABC123/"),
    image: imageUrlSchema,
    video: z.string().trim().refine((v) => v === "" || isAllowedVideoUrl(v), "Upload the video here (MP4 or WebM)"),
    caption: z.string().trim().max(120),
    linkType: z.enum(["none", "combo", "product"]),
    linkId: z.string().regex(/^[a-f0-9]{24}$/i).or(z.literal("")),
    showInReels: z.boolean(),
    showInGallery: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.linkType !== "none" && !v.linkId) ctx.addIssue({ code: "custom", path: ["linkId"], message: "Choose what to shop" });
    if (!v.showInReels && !v.showInGallery) ctx.addIssue({ code: "custom", path: ["showInReels"], message: "Show it in at least one section" });
  })
  .transform((v) => {
    const p = parseInstagramUrl(v.instagramUrl)!;
    return { ...v, instagramUrl: p.url, kind: p.kind, linkId: v.linkType === "none" || !v.linkId ? null : v.linkId };
  });
export type SocialPostInput = z.infer<typeof socialPostInputSchema>;

export const socialPostPatchSchema = z
  .object({ isActive: z.boolean(), showInReels: z.boolean(), showInGallery: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
