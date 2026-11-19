import type {
  Product,
  Combo,
  Category,
  Coupon,
  Address,
  Review,
  ProductCategorySlug,
} from "@/types";
import { img, portrait, PHOTO } from "./images";

/* ============================== Categories ============================== */

export const CATEGORIES: Category[] = [
  { id: "c1", name: "All Products", slug: "all-products", description: "Browse the full MelaMart collection.", image: img(PHOTO.rack, 600, 750), productCount: 22 },
  { id: "c2", name: "Jeans", slug: "jeans", description: "Premium denim crafted for everyday wear and statement fits.", image: portrait(PHOTO.denim1), productCount: 4 },
  { id: "c3", name: "Shirts", slug: "shirts", description: "Structured and relaxed shirts for every occasion.", image: portrait(PHOTO.man3), productCount: 4 },
  { id: "c4", name: "T-Shirts", slug: "t-shirts", description: "Heavyweight tees and elevated basics.", image: portrait(PHOTO.man4), productCount: 4 },
  { id: "c5", name: "Shirts & Shoes", slug: "shoes", description: "Refined leather footwear for formal and smart-casual looks.", image: portrait(PHOTO.shoes1), productCount: 3 },
  { id: "c6", name: "Sneakers", slug: "sneakers", description: "Clean, modern sneakers built for comfort.", image: portrait(PHOTO.shoes2), productCount: 3 },
  { id: "c7", name: "Casual Wear", slug: "casual-wear", description: "Easy, off-duty pieces for everyday style.", image: portrait(PHOTO.man9), productCount: 8 },
  { id: "c8", name: "Party Wear", slug: "party-wear", description: "Sharp, elevated looks for nights out.", image: portrait(PHOTO.man5), productCount: 6 },
  { id: "c9", name: "Accessories", slug: "accessories", description: "The finishing touches that complete a look.", image: portrait(PHOTO.man12), productCount: 4 },
  { id: "c10", name: "Complete Combos", slug: "combos", description: "Head-to-toe outfits curated for you, at a better price.", image: portrait(PHOTO.man20), productCount: 6 },
];

/* ============================== Reviews ============================== */

function review(author: string, rating: number, title: string, body: string, daysAgo: number): Review {
  return {
    id: `r_${author}_${rating}`,
    author,
    rating,
    title,
    body,
    date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    verified: true,
  };
}

/* ============================== Helpers ============================== */

const JEANS_SIZES = ["28", "30", "32", "34", "36"];
const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["6", "7", "8", "9", "10", "11"];

function sizesInStock(sizes: string[], outIdx: number[] = []): { size: string; inStock: boolean; available: number }[] {
  return sizes.map((size, i) => ({
    size,
    inStock: !outIdx.includes(i),
    available: outIdx.includes(i) ? 0 : Math.floor(Math.random() * 18) + 4,
  }));
}

/* ============================== Products ============================== */

export const PRODUCTS: Product[] = [
  {
    id: "p1", name: "Slim Fit Stretch Denim", slug: "slim-fit-stretch-denim",
    category: "jeans", categoryLabel: "Jeans",
    description: "A versatile slim-fit denim with just enough stretch for all-day comfort. Mid-rise with a clean taper from thigh to ankle, finished in a deep indigo wash that pairs with everything.",
    highlights: ["98% cotton, 2% elastane", "Mid-rise slim taper", "Five-pocket styling", "Reinforced stress seams"],
    material: "98% Cotton, 2% Elastane", care: "Machine wash cold. Do not bleach. Tumble dry low.",
    price: 1499, compareAtPrice: 2299, currency: "INR",
    images: [portrait(PHOTO.denim1), portrait(PHOTO.denim2), img(PHOTO.denim1, 700, 930, "sat=-20")],
    variants: [
      { id: "v1", color: "Indigo", colorHex: "#312e81", images: [portrait(PHOTO.denim1)], sizes: sizesInStock(JEANS_SIZES, [0]) },
      { id: "v2", color: "Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.denim2)], sizes: sizesInStock(JEANS_SIZES) },
    ],
    sizes: JEANS_SIZES, colors: [{ name: "Indigo", hex: "#312e81" }, { name: "Black", hex: "#1a1a1a" }],
    rating: 4.6, reviewCount: 128,
    reviews: [review("Arjun M.", 5, "Perfect fit", "Slim but not tight, the stretch makes it very comfortable.", 9), review("Rahul S.", 4, "Good denim", "Color is exactly as shown, slightly long for me.", 24)],
    status: "active", isNew: false, isBestSeller: true, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-32145", createdAt: "2026-09-12", tags: ["casual", "denim", "essentials"],
  },
  {
    id: "p2", name: "Tapered Mid-Wash Jeans", slug: "tapered-mid-wash-jeans",
    category: "jeans", categoryLabel: "Jeans",
    description: "A relaxed tapered cut in a classic mid-wash blue. Broken-in feel from day one with a clean finish that dresses up or down.",
    highlights: ["Heavy 12oz denim", "Tapered leg", "Mid-wash blue", "Button-fly closure"],
    material: "100% Cotton", care: "Machine wash inside-out, cold.",
    price: 1699, compareAtPrice: 2499, currency: "INR",
    images: [portrait(PHOTO.denim2), portrait(PHOTO.denim1)],
    variants: [
      { id: "v1", color: "Mid Blue", colorHex: "#3b5b8a", images: [portrait(PHOTO.denim2)], sizes: sizesInStock(JEANS_SIZES, [1, 3]) },
      { id: "v2", color: "Charcoal", colorHex: "#363636", images: [portrait(PHOTO.denim1)], sizes: sizesInStock(JEANS_SIZES) },
    ],
    sizes: JEANS_SIZES, colors: [{ name: "Mid Blue", hex: "#3b5b8a" }, { name: "Charcoal", hex: "#363636" }],
    rating: 4.4, reviewCount: 86,
    reviews: [review("Karan T.", 4, "Solid pair", "Great wash and fit, fabric feels premium.", 15)],
    status: "active", isNew: true, isBestSeller: false, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-32146", createdAt: "2026-10-20", tags: ["casual", "denim"],
  },
  {
    id: "p3", name: "Distressed Skinny Jeans", slug: "distressed-skinny-jeans",
    category: "jeans", categoryLabel: "Jeans",
    description: "Statement skinny denim with subtle distressing at the knee. Designed for a sharp, modern silhouette.",
    highlights: ["Skinny fit", "Subtle distressing", "Stretch denim", "Dark wash"],
    material: "98% Cotton, 2% Elastane", care: "Machine wash cold.",
    price: 1799, compareAtPrice: 2599, currency: "INR",
    images: [portrait(PHOTO.denim1), img(PHOTO.denim2, 700, 930, "sat=-30")],
    variants: [{ id: "v1", color: "Dark Wash", colorHex: "#1e3a5f", images: [portrait(PHOTO.denim1)], sizes: sizesInStock(JEANS_SIZES, [0, 2]) }],
    sizes: JEANS_SIZES, colors: [{ name: "Dark Wash", hex: "#1e3a5f" }],
    rating: 4.3, reviewCount: 54,
    reviews: [review("Vivek R.", 4, "Edgy", "Love the distressing, fits true to size.", 30)],
    status: "active", isNew: false, isBestSeller: false, isTrending: true, isLimitedOffer: true,
    sourceRef: "M-32147", createdAt: "2026-09-28", tags: ["party", "denim"],
  },
  {
    id: "p4", name: "Relaxed Fit Stonewash Jeans", slug: "relaxed-fit-stonewash-jeans",
    category: "jeans", categoryLabel: "Jeans",
    description: "Easy-wearing relaxed denim in a classic stonewash. A laid-back essential that moves with you.",
    highlights: ["Relaxed straight leg", "Stonewash finish", "Soft hand-feel", "Mid-weight denim"],
    material: "100% Cotton", care: "Machine wash cold, inside-out.",
    price: 1599, compareAtPrice: 2199, currency: "INR",
    images: [portrait(PHOTO.denim2), portrait(PHOTO.denim1)],
    variants: [
      { id: "v1", color: "Stonewash", colorHex: "#8a9bb0", images: [portrait(PHOTO.denim2)], sizes: sizesInStock(JEANS_SIZES) },
      { id: "v2", color: "Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.denim1)], sizes: sizesInStock(JEANS_SIZES, [4]) },
    ],
    sizes: JEANS_SIZES, colors: [{ name: "Stonewash", hex: "#8a9bb0" }, { name: "Black", hex: "#1a1a1a" }],
    rating: 4.5, reviewCount: 71,
    reviews: [review("Dev P.", 5, "So comfortable", "Relaxed without looking sloppy. New favourite jeans.", 12)],
    status: "active", isNew: false, isBestSeller: true, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-32148", createdAt: "2026-08-15", tags: ["casual", "denim", "essentials"],
  },
  {
    id: "p5", name: "Oxford Cotton Shirt", slug: "oxford-cotton-shirt",
    category: "shirts", categoryLabel: "Shirts",
    description: "A timeless oxford-weave shirt with a soft, structured drape. The kind of shirt that works for the office and the weekend.",
    highlights: ["100% combed cotton", "Oxford weave", "Button-down collar", "Mother-of-pearl buttons"],
    material: "100% Cotton", care: "Machine wash cold. Iron medium.",
    price: 1299, compareAtPrice: 1899, currency: "INR",
    images: [portrait(PHOTO.man3), portrait(PHOTO.man12)],
    variants: [
      { id: "v1", color: "White", colorHex: "#f5f5f4", images: [portrait(PHOTO.man3)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Sky Blue", colorHex: "#9ec5e8", images: [portrait(PHOTO.man12)], sizes: sizesInStock(APPAREL_SIZES, [0]) },
      { id: "v3", color: "Navy", colorHex: "#1e293b", images: [portrait(PHOTO.man13)], sizes: sizesInStock(APPAREL_SIZES) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "White", hex: "#f5f5f4" }, { name: "Sky Blue", hex: "#9ec5e8" }, { name: "Navy", hex: "#1e293b" }],
    rating: 4.7, reviewCount: 142,
    reviews: [review("Sahil K.", 5, "Crisp and clean", "Perfect formal shirt, fabric feels great.", 6), review("Manav G.", 4, "Good value", "Slightly slim, size up if you prefer relaxed.", 20)],
    status: "active", isNew: false, isBestSeller: true, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-41022", createdAt: "2026-09-02", tags: ["party", "essentials", "formal"],
  },
  {
    id: "p6", name: "Linen Casual Shirt", slug: "linen-casual-shirt",
    category: "shirts", categoryLabel: "Shirts",
    description: "Breathable pure linen shirt with a relaxed cut. Made for warm days and easy layering.",
    highlights: ["100% French linen", "Relaxed fit", "Breathable", "Curved hem"],
    material: "100% Linen", care: "Machine wash cold. Hang dry.",
    price: 1399, compareAtPrice: 1999, currency: "INR",
    images: [portrait(PHOTO.man12), portrait(PHOTO.man3)],
    variants: [
      { id: "v1", color: "Sand", colorHex: "#d9c9a3", images: [portrait(PHOTO.man12)], sizes: sizesInStock(APPAREL_SIZES, [1]) },
      { id: "v2", color: "Olive", colorHex: "#4d5d2f", images: [portrait(PHOTO.man3)], sizes: sizesInStock(APPAREL_SIZES) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "Sand", hex: "#d9c9a3" }, { name: "Olive", hex: "#4d5d2f" }],
    rating: 4.5, reviewCount: 63,
    reviews: [review("Aryan J.", 5, "Summer staple", "Light and breezy, exactly what I wanted.", 18)],
    status: "active", isNew: true, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-41023", createdAt: "2026-10-18", tags: ["casual", "summer"],
  },
  {
    id: "p7", name: "Flannel Check Shirt", slug: "flannel-check-shirt",
    category: "shirts", categoryLabel: "Shirts",
    description: "Brushed flannel in a classic check. Warm, soft, and ready for layering through the season.",
    highlights: ["Brushed cotton flannel", "Classic check", "Soft brushed finish", "Double chest pockets"],
    material: "100% Cotton", care: "Machine wash cold.",
    price: 1499, compareAtPrice: 2199, currency: "INR",
    images: [portrait(PHOTO.man13), portrait(PHOTO.man3)],
    variants: [
      { id: "v1", color: "Red Check", colorHex: "#9a3324", images: [portrait(PHOTO.man13)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Green Check", colorHex: "#3f5e3a", images: [portrait(PHOTO.man3)], sizes: sizesInStock(APPAREL_SIZES, [4]) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "Red Check", hex: "#9a3324" }, { name: "Green Check", hex: "#3f5e3a" }],
    rating: 4.6, reviewCount: 47,
    reviews: [review("Rohit D.", 5, "Cozy", "Super soft flannel, perfect for winter.", 8)],
    status: "active", isNew: false, isBestSeller: false, isTrending: false, isLimitedOffer: true,
    sourceRef: "M-41024", createdAt: "2026-10-05", tags: ["casual", "winter"],
  },
  {
    id: "p8", name: "Mandarin Collar Shirt", slug: "mandarin-collar-shirt",
    category: "shirts", categoryLabel: "Shirts",
    description: "A clean band-collar shirt with a modern, minimalist feel. Sharp enough for evenings, easy enough for day.",
    highlights: ["Mandarin band collar", "Slim fit", "Soft cotton blend", "Minimalist placket"],
    material: "97% Cotton, 3% Elastane", care: "Machine wash cold.",
    price: 1199, compareAtPrice: 1799, currency: "INR",
    images: [portrait(PHOTO.man3), portrait(PHOTO.man13)],
    variants: [
      { id: "v1", color: "Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.man3)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Maroon", colorHex: "#6b1d1d", images: [portrait(PHOTO.man13)], sizes: sizesInStock(APPAREL_SIZES, [0]) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "Black", hex: "#1a1a1a" }, { name: "Maroon", hex: "#6b1d1d" }],
    rating: 4.4, reviewCount: 39,
    reviews: [review("Ishaan V.", 4, "Sharp look", "Band collar looks great, fits well.", 22)],
    status: "active", isNew: false, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-41025", createdAt: "2026-09-19", tags: ["party", "modern"],
  },
  {
    id: "p9", name: "Heavyweight Crew Tee", slug: "heavyweight-crew-tee",
    category: "t-shirts", categoryLabel: "T-Shirts",
    description: "A dense 240gsm crew neck tee that holds its shape wash after wash. The elevated basic your wardrobe needs.",
    highlights: ["240gsm heavyweight", "Pre-shrunk", "Ribbed crew neck", "Drop shoulder"],
    material: "100% Combed Cotton", care: "Machine wash cold. Tumble dry low.",
    price: 799, compareAtPrice: 1199, currency: "INR",
    images: [portrait(PHOTO.man4), portrait(PHOTO.man16)],
    variants: [
      { id: "v1", color: "White", colorHex: "#f5f5f4", images: [portrait(PHOTO.man4)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.man16)], sizes: sizesInStock(APPAREL_SIZES, [3]) },
      { id: "v3", color: "Olive", colorHex: "#4d5d2f", images: [portrait(PHOTO.man17)], sizes: sizesInStock(APPAREL_SIZES) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "White", hex: "#f5f5f4" }, { name: "Black", hex: "#1a1a1a" }, { name: "Olive", hex: "#4d5d2f" }],
    rating: 4.7, reviewCount: 210,
    reviews: [review("Neel B.", 5, "Best basic tee", "Thick and structured, doesn't go see-through. Worth it.", 5), review("Taran S.", 4, "Great quality", "Runs a touch oversized which I like.", 19)],
    status: "active", isNew: false, isBestSeller: true, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-50012", createdAt: "2026-09-05", tags: ["casual", "essentials"],
  },
  {
    id: "p10", name: "Oversized Drop-Shoulder Tee", slug: "oversized-drop-shoulder-tee",
    category: "t-shirts", categoryLabel: "T-Shirts",
    description: "A relaxed oversized tee with a dropped shoulder for that easy streetwear silhouette.",
    highlights: ["Oversized fit", "Dropped shoulder", "Heavyweight cotton", "Boxy cut"],
    material: "100% Cotton", care: "Machine wash cold.",
    price: 899, compareAtPrice: 1399, currency: "INR",
    images: [portrait(PHOTO.man16), portrait(PHOTO.man4)],
    variants: [
      { id: "v1", color: "Sand", colorHex: "#d9c9a3", images: [portrait(PHOTO.man16)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Charcoal", colorHex: "#363636", images: [portrait(PHOTO.man4)], sizes: sizesInStock(APPAREL_SIZES, [0, 1]) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "Sand", hex: "#d9c9a3" }, { name: "Charcoal", hex: "#363636" }],
    rating: 4.5, reviewCount: 96,
    reviews: [review("Harsh N.", 5, "Street fit", "Oversized in the best way. Looks expensive.", 11)],
    status: "active", isNew: true, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-50013", createdAt: "2026-10-22", tags: ["casual", "streetwear"],
  },
  {
    id: "p11", name: "Striped Knit Polo", slug: "striped-knit-polo",
    category: "t-shirts", categoryLabel: "T-Shirts",
    description: "A finely knit polo with a subtle stripe pattern. Smart-casual done right.",
    highlights: ["Fine knit cotton", "Striped pattern", "Ribbed collar", "Two-button placket"],
    material: "100% Cotton", care: "Machine wash cold.",
    price: 1099, compareAtPrice: 1699, currency: "INR",
    images: [portrait(PHOTO.man17), portrait(PHOTO.man4)],
    variants: [
      { id: "v1", color: "Navy Stripe", colorHex: "#1e293b", images: [portrait(PHOTO.man17)], sizes: sizesInStock(APPAREL_SIZES) },
      { id: "v2", color: "Maroon Stripe", colorHex: "#6b1d1d", images: [portrait(PHOTO.man4)], sizes: sizesInStock(APPAREL_SIZES) },
    ],
    sizes: APPAREL_SIZES, colors: [{ name: "Navy Stripe", hex: "#1e293b" }, { name: "Maroon Stripe", hex: "#6b1d1d" }],
    rating: 4.6, reviewCount: 58,
    reviews: [review("Gaurav P.", 5, "Classy polo", "Knit looks premium, fits true.", 14)],
    status: "active", isNew: false, isBestSeller: true, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-50014", createdAt: "2026-09-10", tags: ["casual", "party", "smart"],
  },
  {
    id: "p12", name: "Graphic Print Tee", slug: "graphic-print-tee",
    category: "t-shirts", categoryLabel: "T-Shirts",
    description: "A soft tee with an all-over graphic print for a bold, expressive look.",
    highlights: ["Soft hand-feel", "All-over print", "Regular fit", "Reinforced collar"],
    material: "100% Cotton", care: "Machine wash cold, inside-out.",
    price: 699, compareAtPrice: 1099, currency: "INR",
    images: [portrait(PHOTO.man4), portrait(PHOTO.man16)],
    variants: [{ id: "v1", color: "Black Print", colorHex: "#1a1a1a", images: [portrait(PHOTO.man4)], sizes: sizesInStock(APPAREL_SIZES, [2]) }],
    sizes: APPAREL_SIZES, colors: [{ name: "Black Print", hex: "#1a1a1a" }],
    rating: 4.3, reviewCount: 44,
    reviews: [review("Mohan R.", 4, "Cool print", "Print is sharp, tee is soft.", 26)],
    status: "active", isNew: false, isBestSeller: false, isTrending: false, isLimitedOffer: true,
    sourceRef: "M-50015", createdAt: "2026-10-01", tags: ["casual", "streetwear"],
  },
  {
    id: "p13", name: "Leather Derby Shoes", slug: "leather-derby-shoes",
    category: "shoes", categoryLabel: "Shoes",
    description: "A polished leather derby with a classic profile. Goodyear-welted construction built to last.",
    highlights: ["Full-grain leather", "Goodyear welt", "Cushioned footbed", "Rubber outsole"],
    material: "Full-grain leather", care: "Polish with quality cream. Use shoe trees.",
    price: 2999, compareAtPrice: 4499, currency: "INR",
    images: [portrait(PHOTO.shoes1), portrait(PHOTO.shoes3)],
    variants: [
      { id: "v1", color: "Tan", colorHex: "#9a6b3f", images: [portrait(PHOTO.shoes1)], sizes: sizesInStock(SHOE_SIZES, [0]) },
      { id: "v2", color: "Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.shoes3)], sizes: sizesInStock(SHOE_SIZES) },
    ],
    sizes: SHOE_SIZES, colors: [{ name: "Tan", hex: "#9a6b3f" }, { name: "Black", hex: "#1a1a1a" }],
    rating: 4.7, reviewCount: 88,
    reviews: [review("Aditya K.", 5, "Sharp formal shoe", "Leather feels premium, very comfortable.", 7)],
    status: "active", isNew: false, isBestSeller: true, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-68001", createdAt: "2026-08-28", tags: ["party", "formal", "essentials"],
  },
  {
    id: "p14", name: "Suede Loafers", slug: "suede-loafers",
    category: "shoes", categoryLabel: "Shoes",
    description: "Soft suede loafers with a slip-on profile. Smart-casual ease for any day.",
    highlights: ["Brushed suede", "Slip-on", "Padded insole", "Flexible sole"],
    material: "Suede", care: "Brush with a suede brush. Protect with spray.",
    price: 2499, compareAtPrice: 3499, currency: "INR",
    images: [portrait(PHOTO.shoes3), portrait(PHOTO.shoes1)],
    variants: [
      { id: "v1", color: "Brown", colorHex: "#6b4423", images: [portrait(PHOTO.shoes3)], sizes: sizesInStock(SHOE_SIZES, [5]) },
      { id: "v2", color: "Navy", colorHex: "#1e293b", images: [portrait(PHOTO.shoes1)], sizes: sizesInStock(SHOE_SIZES) },
    ],
    sizes: SHOE_SIZES, colors: [{ name: "Brown", hex: "#6b4423" }, { name: "Navy", hex: "#1e293b" }],
    rating: 4.5, reviewCount: 61,
    reviews: [review("Kabir S.", 4, "Smart casual", "Great loafers, comfy from first wear.", 16)],
    status: "active", isNew: true, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-68002", createdAt: "2026-10-25", tags: ["party", "smart"],
  },
  {
    id: "p15", name: "Monk Strap Shoes", slug: "monk-strap-shoes",
    category: "shoes", categoryLabel: "Shoes",
    description: "A single-strap monk strap with a sleek, distinctive silhouette. For when you want to stand out subtly.",
    highlights: ["Single monk strap", "Polished leather", "Buckle detail", "Leather sole"],
    material: "Full-grain leather", care: "Polish regularly.",
    price: 2799, compareAtPrice: 3999, currency: "INR",
    images: [portrait(PHOTO.shoes1), portrait(PHOTO.shoes3)],
    variants: [{ id: "v1", color: "Oxblood", colorHex: "#6b1d1d", images: [portrait(PHOTO.shoes1)], sizes: sizesInStock(SHOE_SIZES, [1, 2]) }],
    sizes: SHOE_SIZES, colors: [{ name: "Oxblood", hex: "#6b1d1d" }],
    rating: 4.4, reviewCount: 33,
    reviews: [review("Pranav M.", 5, "Statement shoe", "Unique and elegant, lots of compliments.", 21)],
    status: "active", isNew: false, isBestSeller: false, isTrending: false, isLimitedOffer: true,
    sourceRef: "M-68003", createdAt: "2026-09-22", tags: ["party", "formal"],
  },
  {
    id: "p16", name: "Minimalist White Sneakers", slug: "minimalist-white-sneakers",
    category: "sneakers", categoryLabel: "Sneakers",
    description: "A clean, low-profile white sneaker that goes with everything. Premium leather upper on a cushioned sole.",
    highlights: ["Full-grain leather upper", "Cushioned insole", "Minimalist profile", "Durable cup sole"],
    material: "Leather upper", care: "Wipe clean with damp cloth.",
    price: 2299, compareAtPrice: 3299, currency: "INR",
    images: [portrait(PHOTO.shoes2), portrait(PHOTO.redShoe)],
    variants: [
      { id: "v1", color: "White", colorHex: "#f5f5f4", images: [portrait(PHOTO.shoes2)], sizes: sizesInStock(SHOE_SIZES) },
      { id: "v2", color: "Off White", colorHex: "#ece8df", images: [portrait(PHOTO.redShoe)], sizes: sizesInStock(SHOE_SIZES, [0]) },
    ],
    sizes: SHOE_SIZES, colors: [{ name: "White", hex: "#f5f5f4" }, { name: "Off White", hex: "#ece8df" }],
    rating: 4.8, reviewCount: 176,
    reviews: [review("Yash T.", 5, "Goes with everything", "Cleanest white sneakers I own.", 4), review("Dhruv L.", 5, "Comfy", "Broke in fast, super comfortable.", 17)],
    status: "active", isNew: false, isBestSeller: true, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-68100", createdAt: "2026-08-30", tags: ["casual", "essentials", "streetwear"],
  },
  {
    id: "p17", name: "Retro Runner Sneakers", slug: "retro-runner-sneakers",
    category: "sneakers", categoryLabel: "Sneakers",
    description: "A retro-inspired runner with mesh and suede paneling. Lightweight comfort with throwback style.",
    highlights: ["Mesh + suede upper", "EVA cushioning", "Retro colourway", "Padded collar"],
    material: "Mesh & Suede", care: "Spot clean.",
    price: 2499, compareAtPrice: 3499, currency: "INR",
    images: [portrait(PHOTO.redShoe), portrait(PHOTO.shoes2)],
    variants: [
      { id: "v1", color: "Red/White", colorHex: "#b91c1c", images: [portrait(PHOTO.redShoe)], sizes: sizesInStock(SHOE_SIZES) },
      { id: "v2", color: "Navy/White", colorHex: "#1e293b", images: [portrait(PHOTO.shoes2)], sizes: sizesInStock(SHOE_SIZES, [5]) },
    ],
    sizes: SHOE_SIZES, colors: [{ name: "Red/White", hex: "#b91c1c" }, { name: "Navy/White", hex: "#1e293b" }],
    rating: 4.6, reviewCount: 92,
    reviews: [review("Reyansh G.", 5, "Retro vibes", "Love the look, very comfy for daily wear.", 9)],
    status: "active", isNew: true, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-68101", createdAt: "2026-10-24", tags: ["casual", "streetwear"],
  },
  {
    id: "p18", name: "Chunky Sole Sneakers", slug: "chunky-sole-sneakers",
    category: "sneakers", categoryLabel: "Sneakers",
    description: "A bold chunky-sole sneaker that adds height and attitude. Statement streetwear energy.",
    highlights: ["Chunky platform sole", "Mesh + leather upper", "Extra cushioning", "Statement look"],
    material: "Leather & Mesh", care: "Spot clean.",
    price: 2699, compareAtPrice: 3699, currency: "INR",
    images: [portrait(PHOTO.shoes2), portrait(PHOTO.redShoe)],
    variants: [
      { id: "v1", color: "Triple Black", colorHex: "#1a1a1a", images: [portrait(PHOTO.shoes2)], sizes: sizesInStock(SHOE_SIZES, [2, 4]) },
      { id: "v2", color: "White/Red", colorHex: "#e2e2e2", images: [portrait(PHOTO.redShoe)], sizes: sizesInStock(SHOE_SIZES) },
    ],
    sizes: SHOE_SIZES, colors: [{ name: "Triple Black", hex: "#1a1a1a" }, { name: "White/Red", hex: "#e2e2e2" }],
    rating: 4.5, reviewCount: 71,
    reviews: [review("Krish P.", 4, "Bold", "Big sole as expected, comfy and loud.", 13)],
    status: "active", isNew: false, isBestSeller: false, isTrending: true, isLimitedOffer: true,
    sourceRef: "M-68102", createdAt: "2026-09-30", tags: ["streetwear", "casual"],
  },
  {
    id: "p19", name: "Reversible Leather Belt", slug: "reversible-leather-belt",
    category: "accessories", categoryLabel: "Accessories",
    description: "A reversible full-grain leather belt — black on one side, brown on the other. Two looks, one belt.",
    highlights: ["Full-grain leather", "Reversible black/brown", "Brushed buckle", "Adjustable"],
    material: "Full-grain leather", care: "Wipe clean.",
    price: 899, compareAtPrice: 1499, currency: "INR",
    images: [portrait(PHOTO.man12), portrait(PHOTO.man13)],
    variants: [{ id: "v1", color: "Black/Brown", colorHex: "#3b2a1a", images: [portrait(PHOTO.man12)], sizes: sizesInStock(["One Size"]) }],
    sizes: ["One Size"], colors: [{ name: "Black/Brown", hex: "#3b2a1a" }],
    rating: 4.6, reviewCount: 54,
    reviews: [review("Nakul S.", 5, "Two in one", "Great quality, the reversible is genius.", 10)],
    status: "active", isNew: false, isBestSeller: true, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-70010", createdAt: "2026-09-08", tags: ["essentials", "accessory"],
  },
  {
    id: "p20", name: "Aviator Sunglasses", slug: "aviator-sunglasses",
    category: "accessories", categoryLabel: "Accessories",
    description: "Classic aviator sunglasses with UV400 protection and a lightweight metal frame.",
    highlights: ["UV400 protection", "Lightweight metal frame", "Polarized lens", "Includes case"],
    material: "Metal & Polycarbonate", care: "Clean with microfibre cloth.",
    price: 1499, compareAtPrice: 2299, currency: "INR",
    images: [portrait(PHOTO.man13), portrait(PHOTO.man12)],
    variants: [
      { id: "v1", color: "Gold/Brown", colorHex: "#9a6b3f", images: [portrait(PHOTO.man13)], sizes: sizesInStock(["One Size"]) },
      { id: "v2", color: "Gunmetal", colorHex: "#475569", images: [portrait(PHOTO.man12)], sizes: sizesInStock(["One Size"]) },
    ],
    sizes: ["One Size"], colors: [{ name: "Gold/Brown", hex: "#9a6b3f" }, { name: "Gunmetal", hex: "#475569" }],
    rating: 4.7, reviewCount: 67,
    reviews: [review("Vivaan R.", 5, "Sharp shades", "Look expensive, fit well.", 12)],
    status: "active", isNew: true, isBestSeller: false, isTrending: true, isLimitedOffer: false,
    sourceRef: "M-70011", createdAt: "2026-10-23", tags: ["accessory", "party"],
  },
  {
    id: "p21", name: "Minimalist Leather Watch", slug: "minimalist-leather-watch",
    category: "accessories", categoryLabel: "Accessories",
    description: "A clean-dial watch on a genuine leather strap. Understated design for everyday elegance.",
    highlights: ["Minimalist dial", "Genuine leather strap", "3ATM water resistance", "Quartz movement"],
    material: "Stainless steel & Leather", care: "Avoid water immersion.",
    price: 3999, compareAtPrice: 5999, currency: "INR",
    images: [portrait(PHOTO.man12), portrait(PHOTO.man13)],
    variants: [
      { id: "v1", color: "Tan Strap", colorHex: "#9a6b3f", images: [portrait(PHOTO.man12)], sizes: sizesInStock(["One Size"]) },
      { id: "v2", color: "Black Strap", colorHex: "#1a1a1a", images: [portrait(PHOTO.man13)], sizes: sizesInStock(["One Size"]) },
    ],
    sizes: ["One Size"], colors: [{ name: "Tan Strap", hex: "#9a6b3f" }, { name: "Black Strap", hex: "#1a1a1a" }],
    rating: 4.8, reviewCount: 49,
    reviews: [review("Aarav J.", 5, "Classy", "Looks way more expensive than it is.", 8)],
    status: "active", isNew: false, isBestSeller: true, isTrending: false, isLimitedOffer: false,
    sourceRef: "M-70012", createdAt: "2026-09-15", tags: ["accessory", "essentials"],
  },
  {
    id: "p22", name: "Canvas Tote Bag", slug: "canvas-tote-bag",
    category: "accessories", categoryLabel: "Accessories",
    description: "A sturdy waxed-canvas tote with a structured base and interior pocket. Carry-everything everyday.",
    highlights: ["Waxed canvas", "Structured base", "Interior pocket", "Reinforced straps"],
    material: "Waxed Canvas", care: "Spot clean.",
    price: 799, compareAtPrice: 1299, currency: "INR",
    images: [portrait(PHOTO.man13), portrait(PHOTO.man12)],
    variants: [{ id: "v1", color: "Olive", colorHex: "#4d5d2f", images: [portrait(PHOTO.man13)], sizes: sizesInStock(["One Size"]) }],
    sizes: ["One Size"], colors: [{ name: "Olive", hex: "#4d5d2f" }],
    rating: 4.4, reviewCount: 28,
    reviews: [review("Samar G.", 4, "Useful", "Solid tote, holds a lot.", 19)],
    status: "active", isNew: false, isBestSeller: false, isTrending: false, isLimitedOffer: true,
    sourceRef: "M-70013", createdAt: "2026-10-03", tags: ["accessory", "casual"],
  },
];

/* ============================== Combos ============================== */

function comboItem(p: Product) {
  return {
    productId: p.id, name: p.name, slug: p.slug, image: p.images[0],
    price: p.price, category: p.category, categoryLabel: p.categoryLabel,
    description: p.description, sizes: p.sizes, colors: p.colors,
  };
}

export const COMBOS: Combo[] = [
  {
    id: "co1", name: "Streetwear Daily Combo", slug: "streetwear-daily-combo",
    tagline: "Tee + Jeans + Sneakers",
    description: "An effortless streetwear fit ready to wear. Heavyweight tee, slim stretch denim and clean white sneakers — coordinated for a sharp off-duty look.",
    images: [portrait(PHOTO.man20), portrait(PHOTO.man9), portrait(PHOTO.man18)],
    items: [comboItem(PRODUCTS[8]), comboItem(PRODUCTS[0]), comboItem(PRODUCTS[15])],
    combinedPrice: 4597, comboPrice: 3699, availableSizes: ["S", "M", "L", "XL", "28", "30", "32", "34", "6", "7", "8", "9", "10"],
    tags: ["casual", "streetwear"], rating: 4.7, reviewCount: 64, isTrending: true, isBestSeller: true,
    reelRef: "instagram_reel_01",
  },
  {
    id: "co2", name: "Smart Casual Combo", slug: "smart-casual-combo",
    tagline: "Shirt + Jeans + Loafers",
    description: "Smart-casual done right. Oxford shirt, tapered jeans and suede loafers for a polished everyday look.",
    images: [portrait(PHOTO.man5), portrait(PHOTO.man2), portrait(PHOTO.man14)],
    items: [comboItem(PRODUCTS[4]), comboItem(PRODUCTS[1]), comboItem(PRODUCTS[13])],
    combinedPrice: 5397, comboPrice: 4299, availableSizes: ["S", "M", "L", "XL", "28", "30", "32", "34", "6", "7", "8", "9", "10"],
    tags: ["smart", "casual"], rating: 4.6, reviewCount: 41, isTrending: true, isBestSeller: false,
    reelRef: "instagram_reel_02",
  },
  {
    id: "co3", name: "Night Out Combo", slug: "night-out-combo",
    tagline: "Mandarin Shirt + Distressed Jeans + Monk Straps",
    description: "Built for evenings out. A band-collar shirt, distressed denim and oxblood monk straps for a sharp, distinctive look.",
    images: [portrait(PHOTO.man19), portrait(PHOTO.man1), portrait(PHOTO.man15)],
    items: [comboItem(PRODUCTS[7]), comboItem(PRODUCTS[2]), comboItem(PRODUCTS[14])],
    combinedPrice: 5797, comboPrice: 4499, availableSizes: ["S", "M", "L", "XL", "28", "30", "32", "34", "6", "7", "8", "9", "10"],
    tags: ["party"], rating: 4.8, reviewCount: 33, isTrending: true, isBestSeller: true,
    reelRef: "instagram_reel_03",
  },
  {
    id: "co4", name: "Weekend Ease Combo", slug: "weekend-ease-combo",
    tagline: "Oversized Tee + Relaxed Jeans + Sneakers",
    description: "Relaxed from head to toe. Oversized tee, relaxed stonewash jeans and retro runners for easy weekend style.",
    images: [portrait(PHOTO.man9), portrait(PHOTO.man4), portrait(PHOTO.man16)],
    items: [comboItem(PRODUCTS[9]), comboItem(PRODUCTS[3]), comboItem(PRODUCTS[16])],
    combinedPrice: 5197, comboPrice: 4099, availableSizes: ["S", "M", "L", "XL", "28", "30", "32", "34", "6", "7", "8", "9", "10"],
    tags: ["casual", "streetwear"], rating: 4.6, reviewCount: 52, isTrending: false, isBestSeller: true,
  },
  {
    id: "co5", name: "Office Sharp Combo", slug: "office-sharp-combo",
    tagline: "Oxford Shirt + Tapered Jeans + Derby Shoes",
    description: "A refined work fit. Oxford shirt, tapered mid-wash jeans and leather derbies that mean business.",
    images: [portrait(PHOTO.man14), portrait(PHOTO.man2), portrait(PHOTO.man5)],
    items: [comboItem(PRODUCTS[4]), comboItem(PRODUCTS[1]), comboItem(PRODUCTS[12])],
    combinedPrice: 5997, comboPrice: 4799, availableSizes: ["S", "M", "L", "XL", "28", "30", "32", "34", "6", "7", "8", "9", "10"],
    tags: ["party", "formal"], rating: 4.7, reviewCount: 29, isTrending: false, isBestSeller: false,
  },
  {
    id: "co6", name: "Summer Linen Combo", slug: "summer-linen-combo",
    tagline: "Linen Shirt + Polo + Sneakers",
    description: "Light and breezy for warm days. Linen casual shirt layered over a knit polo with white sneakers.",
    images: [portrait(PHOTO.man18), portrait(PHOTO.man10), portrait(PHOTO.man17)],
    items: [comboItem(PRODUCTS[5]), comboItem(PRODUCTS[10]), comboItem(PRODUCTS[15])],
    combinedPrice: 4397, comboPrice: 3499, availableSizes: ["S", "M", "L", "XL", "6", "7", "8", "9", "10"],
    tags: ["casual", "summer"], rating: 4.5, reviewCount: 24, isTrending: true, isBestSeller: false,
    reelRef: "instagram_reel_04",
  },
];

/* ============================== Coupons ============================== */

export const COUPONS: Coupon[] = [
  { code: "NEW10", description: "10% off your first order", type: "percentage", value: 10, minSubtotal: 0, maxDiscount: 500 },
  { code: "COMBO500", description: "₹500 off orders above ₹2,999", type: "flat", value: 500, minSubtotal: 2999 },
  { code: "FESTIVE15", description: "15% off orders above ₹3,999", type: "percentage", value: 15, minSubtotal: 3999, maxDiscount: 1000 },
];

/* ============================== Addresses ============================== */

export const ADDRESSES: Address[] = [
  { id: "a1", label: "Home", fullName: "Riyaan Sharma", phone: "+91 98765 43210", line1: "12, MG Road, Indiranagar", line2: "2nd Floor", city: "Bengaluru", state: "Karnataka", pincode: "560038", isDefault: true },
  { id: "a2", label: "Office", fullName: "Riyaan Sharma", phone: "+91 98765 43210", line1: "Tower B, Cyber Hub", line2: "Unit 401", city: "Gurugram", state: "Haryana", pincode: "122002", isDefault: false },
];

/* ============================== Selectors ============================== */

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
export function getComboBySlug(slug: string): Combo | undefined {
  return COMBOS.find((c) => c.slug === slug);
}
export function getComboById(id: string): Combo | undefined {
  return COMBOS.find((c) => c.id === id);
}

export function getProductsByCategory(slug: ProductCategorySlug): Product[] {
  if (slug === "all-products" || slug === "combos") return PRODUCTS;
  if (slug === "casual-wear") return PRODUCTS.filter((p) => p.tags.includes("casual"));
  if (slug === "party-wear") return PRODUCTS.filter((p) => p.tags.includes("party"));
  return PRODUCTS.filter((p) => p.category === slug);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const BEST_SELLERS = PRODUCTS.filter((p) => p.isBestSeller);
export const NEW_ARRIVALS = PRODUCTS.filter((p) => p.isNew);
export const TRENDING_PRODUCTS = PRODUCTS.filter((p) => p.isTrending);
export const LIMITED_OFFERS = PRODUCTS.filter((p) => p.isLimitedOffer);
export const TRENDING_COMBOS = COMBOS.filter((c) => c.isTrending);

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, limit);
}

/** Products featured in the Shop-the-Reel section (mapped via reelRef). */
export function getShopTheReel() {
  return COMBOS.filter((c) => c.reelRef).map((combo) => ({
    combo,
    reelRef: combo.reelRef as string,
  }));
}

/** Aggregate rating snippets for the homepage reviews carousel. */
export const HOME_REVIEWS = [
  { author: "Aarav S.", city: "Mumbai", rating: 5, text: "The combos are a steal. Everything fit perfectly and the quality is way above the price." },
  { author: "Dev P.", city: "Delhi", rating: 5, text: "Ordered the streetwear combo after seeing a reel. Packaging was premium and delivery was quick." },
  { author: "Karan M.", city: "Pune", rating: 4, text: "Great value for money. The denim fits true to size and feels expensive." },
  { author: "Ishaan G.", city: "Jaipur", rating: 5, text: "Customer support was responsive and the COD option made it easy to try." },
  { author: "Neel R.", city: "Bengaluru", rating: 5, text: "Best basic tees I've bought online. Holding up after many washes." },
  { author: "Rohit K.", city: "Chandigarh", rating: 4, text: "Sneakers are clean and comfy. Will buy more combos." },
];
