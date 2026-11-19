/**
 * MelaMart — Database Seed Script
 * Run: node --env-file=.env.local scripts/seed.mjs
 *
 * Seeds categories, products, combos, and coupons from Phase 1 mock data
 * into the live MongoDB Atlas melamart database.
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌ MONGODB_URI not set");
  process.exit(1);
}

await mongoose.connect(MONGO_URI, { dbName: "melamart" });
console.log("✓ Connected to", mongoose.connection.db.databaseName);

/* ── Inline schemas (no TS needed) ── */

const CategorySchema = new mongoose.Schema({
  name: String, slug: String, description: String, image: String,
  productCount: Number, order: Number, isActive: Boolean,
  showOnHome: { type: Boolean, default: true }, showInNav: { type: Boolean, default: true },
}, { timestamps: true });

const SizeStockSchema = new mongoose.Schema({ size: String, inStock: Boolean, available: Number }, { _id: false });
const VariantSchema = new mongoose.Schema({ color: String, colorHex: String, images: [String], sizes: [SizeStockSchema] }, { _id: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, category: String, categoryLabel: String,
  description: String, highlights: [String], material: String, care: String,
  price: Number, compareAtPrice: Number, currency: String, images: [String],
  variants: [VariantSchema], sizes: [String], colors: [{ name: String, hex: String }],
  rating: Number, reviewCount: Number, status: String,
  isNewArrival: Boolean, isBestSeller: Boolean, isTrending: Boolean, isLimitedOffer: Boolean,
  sourceRef: String, tags: [String], seoTitle: String, seoDescription: String,
}, { timestamps: true });

const ComboItemSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId, name: String, slug: String, image: String,
  price: Number, category: String, categoryLabel: String, description: String,
  sizes: [String], colors: [{ name: String, hex: String }],
}, { _id: false });

const ComboSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, tagline: String, description: String,
  images: [String], video: String, items: [ComboItemSchema], combinedPrice: Number, comboPrice: Number,
  availableSizes: [String], tags: [String], rating: Number, reviewCount: Number,
  isTrending: Boolean, isBestSeller: Boolean, reelRef: String, isActive: Boolean,
  seoTitle: String, seoDescription: String,
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true }, description: String, type: String,
  value: Number, minSubtotal: Number, maxDiscount: Number,
  isActive: Boolean, usageCount: { type: Number, default: 0 }, firstOrderOnly: { type: Boolean, default: false },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product  = mongoose.models.Product  || mongoose.model("Product",  ProductSchema);
const Combo    = mongoose.models.Combo    || mongoose.model("Combo",    ComboSchema);
const Coupon   = mongoose.models.Coupon   || mongoose.model("Coupon",   CouponSchema);

/* ── Mock image builder ── */
const BASE = "https://images.unsplash.com";
const portrait = (id) => `${BASE}/${id}?auto=format&fit=crop&w=700&h=930&q=80`;
const img      = (id, w=800, h=1000) => `${BASE}/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const P = {
  man1:"photo-1507003211169-0a1dd7228f2d", man2:"photo-1500648767791-00dcc994a43e",
  man3:"photo-1492562080023-ab3db95bfbce", man4:"photo-1521572163474-6864f9cf17ab",
  man5:"photo-1531123897727-8f129e1688ce", man6:"photo-1488161628813-04466f872be2",
  denim1:"photo-1542272604-787c3835535d", denim2:"photo-1604176354204-9268737828e4",
  rack:"photo-1542327897-d73f4005b533", shoes1:"photo-1520975916090-3105956dac38",
  shoes2:"photo-1549298916-b41d501d3772", shoes3:"photo-1551489186-cf8726f514f8",
  man7:"photo-1434389677669-e08b4cac3105", man8:"photo-1483985988355-763728e1935b",
  store1:"photo-1441986300917-64674bd600d8", man9:"photo-1551232864-3f0890e580d9",
  man10:"photo-1583743814966-8936f5b7be1a", man11:"photo-1576995853123-5a10305d93c0",
  man12:"photo-1524504388940-b1c1722653e1", man13:"photo-1567401893414-76b7b1e5a7a5",
  man14:"photo-1611601322175-ef8ec8c85f01", man15:"photo-1542060748-10c28b62716f",
  man16:"photo-1565374395542-0ce18882c857", man17:"photo-1564859228273-274232fdb516",
  redShoe:"photo-1542291026-7eec264c27ff", man18:"photo-1606293459339-aa5d34a7b0e1",
  man19:"photo-1608231387042-66d1773070a5", man20:"photo-1515886657613-9f3515b0c78f",
  man21:"photo-1502716119720-b23a93e5fe1b",
};

/* ── Categories ── */
const CATEGORIES = [
  { name:"All Products",    slug:"all-products",  description:"Browse the full MelaMart collection.", image:img(P.rack,600,750), productCount:22 },
  { name:"Jeans",           slug:"jeans",          description:"Premium denim crafted for everyday wear.", image:portrait(P.denim1), productCount:4 },
  { name:"Shirts",          slug:"shirts",         description:"Structured and relaxed shirts for every occasion.", image:portrait(P.man3), productCount:4 },
  { name:"T-Shirts",        slug:"t-shirts",       description:"Heavyweight tees and elevated basics.", image:portrait(P.man4), productCount:4 },
  { name:"Shoes",           slug:"shoes",          description:"Refined footwear for formal and smart-casual.", image:portrait(P.shoes1), productCount:3 },
  { name:"Sneakers",        slug:"sneakers",       description:"Clean, modern sneakers built for comfort.", image:portrait(P.shoes2), productCount:3 },
  { name:"Casual Wear",     slug:"casual-wear",    description:"Easy, off-duty pieces for everyday style.", image:portrait(P.man9), productCount:8 },
  { name:"Party Wear",      slug:"party-wear",     description:"Sharp, elevated looks for nights out.", image:portrait(P.man5), productCount:6 },
  { name:"Accessories",     slug:"accessories",    description:"The finishing touches that complete a look.", image:portrait(P.man12), productCount:4 },
  { name:"Complete Combos", slug:"combos",         description:"Head-to-toe outfits curated for you.", image:portrait(P.man20), productCount:6 },
];

/* ── Sizes helper ── */
function sizes(arr, out=[]) {
  return arr.map((size,i) => ({ size, inStock: !out.includes(i), available: out.includes(i) ? 0 : Math.floor(Math.random()*18)+4 }));
}
const J = ["28","30","32","34","36"];
const A = ["S","M","L","XL","XXL"];
const S = ["6","7","8","9","10","11"];

/* ── Products ── */
const PRODUCTS = [
  { name:"Slim Fit Stretch Denim", slug:"slim-fit-stretch-denim", category:"jeans", categoryLabel:"Jeans",
    description:"A versatile slim-fit denim with just enough stretch for all-day comfort.", highlights:["98% cotton, 2% elastane","Mid-rise slim taper","Five-pocket styling"], material:"98% Cotton, 2% Elastane", care:"Machine wash cold.",
    price:1499, compareAtPrice:2299, currency:"INR", images:[portrait(P.denim1),portrait(P.denim2)],
    variants:[{color:"Indigo",colorHex:"#312e81",images:[portrait(P.denim1)],sizes:sizes(J,[0])},{color:"Black",colorHex:"#1a1a1a",images:[portrait(P.denim2)],sizes:sizes(J)}],
    sizes:J, colors:[{name:"Indigo",hex:"#312e81"},{name:"Black",hex:"#1a1a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:true, isLimitedOffer:false, sourceRef:"M-32145", tags:["casual","denim","essentials"] },

  { name:"Tapered Mid-Wash Jeans", slug:"tapered-mid-wash-jeans", category:"jeans", categoryLabel:"Jeans",
    description:"A relaxed tapered cut in a classic mid-wash blue.", highlights:["Heavy 12oz denim","Tapered leg","Mid-wash blue"], material:"100% Cotton", care:"Machine wash inside-out, cold.",
    price:1699, compareAtPrice:2499, currency:"INR", images:[portrait(P.denim2),portrait(P.denim1)],
    variants:[{color:"Mid Blue",colorHex:"#3b5b8a",images:[portrait(P.denim2)],sizes:sizes(J,[1,3])},{color:"Charcoal",colorHex:"#363636",images:[portrait(P.denim1)],sizes:sizes(J)}],
    sizes:J, colors:[{name:"Mid Blue",hex:"#3b5b8a"},{name:"Charcoal",hex:"#363636"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:false, isLimitedOffer:false, sourceRef:"M-32146", tags:["casual","denim"] },

  { name:"Distressed Skinny Jeans", slug:"distressed-skinny-jeans", category:"jeans", categoryLabel:"Jeans",
    description:"Statement skinny denim with subtle distressing at the knee.", highlights:["Skinny fit","Subtle distressing","Stretch denim"], material:"98% Cotton, 2% Elastane", care:"Machine wash cold.",
    price:1799, compareAtPrice:2599, currency:"INR", images:[portrait(P.denim1)],
    variants:[{color:"Dark Wash",colorHex:"#1e3a5f",images:[portrait(P.denim1)],sizes:sizes(J,[0,2])}],
    sizes:J, colors:[{name:"Dark Wash",hex:"#1e3a5f"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:true, isLimitedOffer:true, sourceRef:"M-32147", tags:["party","denim"] },

  { name:"Relaxed Fit Stonewash Jeans", slug:"relaxed-fit-stonewash-jeans", category:"jeans", categoryLabel:"Jeans",
    description:"Easy-wearing relaxed denim in a classic stonewash.", highlights:["Relaxed straight leg","Stonewash finish","Soft hand-feel"], material:"100% Cotton", care:"Machine wash cold.",
    price:1599, compareAtPrice:2199, currency:"INR", images:[portrait(P.denim2),portrait(P.denim1)],
    variants:[{color:"Stonewash",colorHex:"#8a9bb0",images:[portrait(P.denim2)],sizes:sizes(J)},{color:"Black",colorHex:"#1a1a1a",images:[portrait(P.denim1)],sizes:sizes(J,[4])}],
    sizes:J, colors:[{name:"Stonewash",hex:"#8a9bb0"},{name:"Black",hex:"#1a1a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:false, isLimitedOffer:false, sourceRef:"M-32148", tags:["casual","denim","essentials"] },

  { name:"Oxford Cotton Shirt", slug:"oxford-cotton-shirt", category:"shirts", categoryLabel:"Shirts",
    description:"A timeless oxford-weave shirt with a soft, structured drape.", highlights:["100% combed cotton","Oxford weave","Button-down collar"], material:"100% Cotton", care:"Machine wash cold.",
    price:1299, compareAtPrice:1899, currency:"INR", images:[portrait(P.man3),portrait(P.man12)],
    variants:[{color:"White",colorHex:"#f5f5f4",images:[portrait(P.man3)],sizes:sizes(A)},{color:"Sky Blue",colorHex:"#9ec5e8",images:[portrait(P.man12)],sizes:sizes(A,[0])},{color:"Navy",colorHex:"#1e293b",images:[portrait(P.man13)],sizes:sizes(A)}],
    sizes:A, colors:[{name:"White",hex:"#f5f5f4"},{name:"Sky Blue",hex:"#9ec5e8"},{name:"Navy",hex:"#1e293b"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:true, isLimitedOffer:false, sourceRef:"M-41022", tags:["party","essentials","formal"] },

  { name:"Linen Casual Shirt", slug:"linen-casual-shirt", category:"shirts", categoryLabel:"Shirts",
    description:"Breathable pure linen shirt with a relaxed cut.", highlights:["100% French linen","Relaxed fit","Breathable"], material:"100% Linen", care:"Machine wash cold.",
    price:1399, compareAtPrice:1999, currency:"INR", images:[portrait(P.man12),portrait(P.man3)],
    variants:[{color:"Sand",colorHex:"#d9c9a3",images:[portrait(P.man12)],sizes:sizes(A,[1])},{color:"Olive",colorHex:"#4d5d2f",images:[portrait(P.man3)],sizes:sizes(A)}],
    sizes:A, colors:[{name:"Sand",hex:"#d9c9a3"},{name:"Olive",hex:"#4d5d2f"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-41023", tags:["casual","summer"] },

  { name:"Flannel Check Shirt", slug:"flannel-check-shirt", category:"shirts", categoryLabel:"Shirts",
    description:"Brushed flannel in a classic check.", highlights:["Brushed cotton flannel","Classic check","Double chest pockets"], material:"100% Cotton", care:"Machine wash cold.",
    price:1499, compareAtPrice:2199, currency:"INR", images:[portrait(P.man13),portrait(P.man3)],
    variants:[{color:"Red Check",colorHex:"#9a3324",images:[portrait(P.man13)],sizes:sizes(A)},{color:"Green Check",colorHex:"#3f5e3a",images:[portrait(P.man3)],sizes:sizes(A,[4])}],
    sizes:A, colors:[{name:"Red Check",hex:"#9a3324"},{name:"Green Check",hex:"#3f5e3a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:false, isLimitedOffer:true, sourceRef:"M-41024", tags:["casual","winter"] },

  { name:"Mandarin Collar Shirt", slug:"mandarin-collar-shirt", category:"shirts", categoryLabel:"Shirts",
    description:"A clean band-collar shirt with a modern, minimalist feel.", highlights:["Mandarin band collar","Slim fit","Soft cotton blend"], material:"97% Cotton, 3% Elastane", care:"Machine wash cold.",
    price:1199, compareAtPrice:1799, currency:"INR", images:[portrait(P.man3),portrait(P.man13)],
    variants:[{color:"Black",colorHex:"#1a1a1a",images:[portrait(P.man3)],sizes:sizes(A)},{color:"Maroon",colorHex:"#6b1d1d",images:[portrait(P.man13)],sizes:sizes(A,[0])}],
    sizes:A, colors:[{name:"Black",hex:"#1a1a1a"},{name:"Maroon",hex:"#6b1d1d"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-41025", tags:["party","modern"] },

  { name:"Heavyweight Crew Tee", slug:"heavyweight-crew-tee", category:"t-shirts", categoryLabel:"T-Shirts",
    description:"A dense 240gsm crew neck tee that holds its shape wash after wash.", highlights:["240gsm heavyweight","Pre-shrunk","Ribbed crew neck"], material:"100% Combed Cotton", care:"Machine wash cold.",
    price:799, compareAtPrice:1199, currency:"INR", images:[portrait(P.man4),portrait(P.man16)],
    variants:[{color:"White",colorHex:"#f5f5f4",images:[portrait(P.man4)],sizes:sizes(A)},{color:"Black",colorHex:"#1a1a1a",images:[portrait(P.man16)],sizes:sizes(A,[3])},{color:"Olive",colorHex:"#4d5d2f",images:[portrait(P.man17)],sizes:sizes(A)}],
    sizes:A, colors:[{name:"White",hex:"#f5f5f4"},{name:"Black",hex:"#1a1a1a"},{name:"Olive",hex:"#4d5d2f"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:true, isLimitedOffer:false, sourceRef:"M-50012", tags:["casual","essentials"] },

  { name:"Oversized Drop-Shoulder Tee", slug:"oversized-drop-shoulder-tee", category:"t-shirts", categoryLabel:"T-Shirts",
    description:"A relaxed oversized tee with a dropped shoulder.", highlights:["Oversized fit","Dropped shoulder","Heavyweight cotton"], material:"100% Cotton", care:"Machine wash cold.",
    price:899, compareAtPrice:1399, currency:"INR", images:[portrait(P.man16),portrait(P.man4)],
    variants:[{color:"Sand",colorHex:"#d9c9a3",images:[portrait(P.man16)],sizes:sizes(A)},{color:"Charcoal",colorHex:"#363636",images:[portrait(P.man4)],sizes:sizes(A,[0,1])}],
    sizes:A, colors:[{name:"Sand",hex:"#d9c9a3"},{name:"Charcoal",hex:"#363636"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-50013", tags:["casual","streetwear"] },

  { name:"Striped Knit Polo", slug:"striped-knit-polo", category:"t-shirts", categoryLabel:"T-Shirts",
    description:"A finely knit polo with a subtle stripe pattern.", highlights:["Fine knit cotton","Striped pattern","Ribbed collar"], material:"100% Cotton", care:"Machine wash cold.",
    price:1099, compareAtPrice:1699, currency:"INR", images:[portrait(P.man17),portrait(P.man4)],
    variants:[{color:"Navy Stripe",colorHex:"#1e293b",images:[portrait(P.man17)],sizes:sizes(A)},{color:"Maroon Stripe",colorHex:"#6b1d1d",images:[portrait(P.man4)],sizes:sizes(A)}],
    sizes:A, colors:[{name:"Navy Stripe",hex:"#1e293b"},{name:"Maroon Stripe",hex:"#6b1d1d"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:false, isLimitedOffer:false, sourceRef:"M-50014", tags:["casual","party","smart"] },

  { name:"Graphic Print Tee", slug:"graphic-print-tee", category:"t-shirts", categoryLabel:"T-Shirts",
    description:"A soft tee with an all-over graphic print.", highlights:["Soft hand-feel","All-over print","Regular fit"], material:"100% Cotton", care:"Machine wash cold, inside-out.",
    price:699, compareAtPrice:1099, currency:"INR", images:[portrait(P.man4),portrait(P.man16)],
    variants:[{color:"Black Print",colorHex:"#1a1a1a",images:[portrait(P.man4)],sizes:sizes(A,[2])}],
    sizes:A, colors:[{name:"Black Print",hex:"#1a1a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:false, isLimitedOffer:true, sourceRef:"M-50015", tags:["casual","streetwear"] },

  { name:"Leather Derby Shoes", slug:"leather-derby-shoes", category:"shoes", categoryLabel:"Shoes",
    description:"A polished leather derby with a classic profile.", highlights:["Full-grain leather","Goodyear welt","Cushioned footbed"], material:"Full-grain leather", care:"Polish with quality cream.",
    price:2999, compareAtPrice:4499, currency:"INR", images:[portrait(P.shoes1),portrait(P.shoes3)],
    variants:[{color:"Tan",colorHex:"#9a6b3f",images:[portrait(P.shoes1)],sizes:sizes(S,[0])},{color:"Black",colorHex:"#1a1a1a",images:[portrait(P.shoes3)],sizes:sizes(S)}],
    sizes:S, colors:[{name:"Tan",hex:"#9a6b3f"},{name:"Black",hex:"#1a1a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:false, isLimitedOffer:false, sourceRef:"M-68001", tags:["party","formal","essentials"] },

  { name:"Suede Loafers", slug:"suede-loafers", category:"shoes", categoryLabel:"Shoes",
    description:"Soft suede loafers with a slip-on profile.", highlights:["Brushed suede","Slip-on","Padded insole"], material:"Suede", care:"Brush with a suede brush.",
    price:2499, compareAtPrice:3499, currency:"INR", images:[portrait(P.shoes3),portrait(P.shoes1)],
    variants:[{color:"Brown",colorHex:"#6b4423",images:[portrait(P.shoes3)],sizes:sizes(S,[5])},{color:"Navy",colorHex:"#1e293b",images:[portrait(P.shoes1)],sizes:sizes(S)}],
    sizes:S, colors:[{name:"Brown",hex:"#6b4423"},{name:"Navy",hex:"#1e293b"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-68002", tags:["party","smart"] },

  { name:"Monk Strap Shoes", slug:"monk-strap-shoes", category:"shoes", categoryLabel:"Shoes",
    description:"A single-strap monk strap with a sleek silhouette.", highlights:["Single monk strap","Polished leather","Buckle detail"], material:"Full-grain leather", care:"Polish regularly.",
    price:2799, compareAtPrice:3999, currency:"INR", images:[portrait(P.shoes1),portrait(P.shoes3)],
    variants:[{color:"Oxblood",colorHex:"#6b1d1d",images:[portrait(P.shoes1)],sizes:sizes(S,[1,2])}],
    sizes:S, colors:[{name:"Oxblood",hex:"#6b1d1d"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:false, isLimitedOffer:true, sourceRef:"M-68003", tags:["party","formal"] },

  { name:"Minimalist White Sneakers", slug:"minimalist-white-sneakers", category:"sneakers", categoryLabel:"Sneakers",
    description:"A clean, low-profile white sneaker that goes with everything.", highlights:["Full-grain leather upper","Cushioned insole","Minimalist profile"], material:"Leather upper", care:"Wipe clean with damp cloth.",
    price:2299, compareAtPrice:3299, currency:"INR", images:[portrait(P.shoes2),portrait(P.redShoe)],
    variants:[{color:"White",colorHex:"#f5f5f4",images:[portrait(P.shoes2)],sizes:sizes(S)},{color:"Off White",colorHex:"#ece8df",images:[portrait(P.redShoe)],sizes:sizes(S,[0])}],
    sizes:S, colors:[{name:"White",hex:"#f5f5f4"},{name:"Off White",hex:"#ece8df"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:true, isLimitedOffer:false, sourceRef:"M-68100", tags:["casual","essentials","streetwear"] },

  { name:"Retro Runner Sneakers", slug:"retro-runner-sneakers", category:"sneakers", categoryLabel:"Sneakers",
    description:"A retro-inspired runner with mesh and suede paneling.", highlights:["Mesh + suede upper","EVA cushioning","Retro colourway"], material:"Mesh & Suede", care:"Spot clean.",
    price:2499, compareAtPrice:3499, currency:"INR", images:[portrait(P.redShoe),portrait(P.shoes2)],
    variants:[{color:"Red/White",colorHex:"#b91c1c",images:[portrait(P.redShoe)],sizes:sizes(S)},{color:"Navy/White",colorHex:"#1e293b",images:[portrait(P.shoes2)],sizes:sizes(S,[5])}],
    sizes:S, colors:[{name:"Red/White",hex:"#b91c1c"},{name:"Navy/White",hex:"#1e293b"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-68101", tags:["casual","streetwear"] },

  { name:"Chunky Sole Sneakers", slug:"chunky-sole-sneakers", category:"sneakers", categoryLabel:"Sneakers",
    description:"A bold chunky-sole sneaker that adds height and attitude.", highlights:["Chunky platform sole","Mesh + leather upper","Extra cushioning"], material:"Leather & Mesh", care:"Spot clean.",
    price:2699, compareAtPrice:3699, currency:"INR", images:[portrait(P.shoes2),portrait(P.redShoe)],
    variants:[{color:"Triple Black",colorHex:"#1a1a1a",images:[portrait(P.shoes2)],sizes:sizes(S,[2,4])},{color:"White/Red",colorHex:"#e2e2e2",images:[portrait(P.redShoe)],sizes:sizes(S)}],
    sizes:S, colors:[{name:"Triple Black",hex:"#1a1a1a"},{name:"White/Red",hex:"#e2e2e2"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:true, isLimitedOffer:true, sourceRef:"M-68102", tags:["streetwear","casual"] },

  { name:"Reversible Leather Belt", slug:"reversible-leather-belt", category:"accessories", categoryLabel:"Accessories",
    description:"A reversible full-grain leather belt — black on one side, brown on the other.", highlights:["Full-grain leather","Reversible black/brown","Brushed buckle"], material:"Full-grain leather", care:"Wipe clean.",
    price:899, compareAtPrice:1499, currency:"INR", images:[portrait(P.man12),portrait(P.man13)],
    variants:[{color:"Black/Brown",colorHex:"#3b2a1a",images:[portrait(P.man12)],sizes:[{size:"One Size",inStock:true,available:20}]}],
    sizes:["One Size"], colors:[{name:"Black/Brown",hex:"#3b2a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:false, isLimitedOffer:false, sourceRef:"M-70010", tags:["essentials","accessory"] },

  { name:"Aviator Sunglasses", slug:"aviator-sunglasses", category:"accessories", categoryLabel:"Accessories",
    description:"Classic aviator sunglasses with UV400 protection.", highlights:["UV400 protection","Lightweight metal frame","Polarized lens","Includes case"], material:"Metal & Polycarbonate", care:"Clean with microfibre cloth.",
    price:1499, compareAtPrice:2299, currency:"INR", images:[portrait(P.man13),portrait(P.man12)],
    variants:[{color:"Gold/Brown",colorHex:"#9a6b3f",images:[portrait(P.man13)],sizes:[{size:"One Size",inStock:true,available:15}]},{color:"Gunmetal",colorHex:"#475569",images:[portrait(P.man12)],sizes:[{size:"One Size",inStock:true,available:12}]}],
    sizes:["One Size"], colors:[{name:"Gold/Brown",hex:"#9a6b3f"},{name:"Gunmetal",hex:"#475569"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:true, isBestSeller:false, isTrending:true, isLimitedOffer:false, sourceRef:"M-70011", tags:["accessory","party"] },

  { name:"Minimalist Leather Watch", slug:"minimalist-leather-watch", category:"accessories", categoryLabel:"Accessories",
    description:"A clean-dial watch on a genuine leather strap.", highlights:["Minimalist dial","Genuine leather strap","3ATM water resistance"], material:"Stainless steel & Leather", care:"Avoid water immersion.",
    price:3999, compareAtPrice:5999, currency:"INR", images:[portrait(P.man12),portrait(P.man13)],
    variants:[{color:"Tan Strap",colorHex:"#9a6b3f",images:[portrait(P.man12)],sizes:[{size:"One Size",inStock:true,available:8}]},{color:"Black Strap",colorHex:"#1a1a1a",images:[portrait(P.man13)],sizes:[{size:"One Size",inStock:true,available:6}]}],
    sizes:["One Size"], colors:[{name:"Tan Strap",hex:"#9a6b3f"},{name:"Black Strap",hex:"#1a1a1a"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:true, isTrending:false, isLimitedOffer:false, sourceRef:"M-70012", tags:["accessory","essentials"] },

  { name:"Canvas Tote Bag", slug:"canvas-tote-bag", category:"accessories", categoryLabel:"Accessories",
    description:"A sturdy waxed-canvas tote with a structured base.", highlights:["Waxed canvas","Structured base","Interior pocket","Reinforced straps"], material:"Waxed Canvas", care:"Spot clean.",
    price:799, compareAtPrice:1299, currency:"INR", images:[portrait(P.man13),portrait(P.man12)],
    variants:[{color:"Olive",colorHex:"#4d5d2f",images:[portrait(P.man13)],sizes:[{size:"One Size",inStock:true,available:10}]}],
    sizes:["One Size"], colors:[{name:"Olive",hex:"#4d5d2f"}], rating:0, reviewCount:0,
    status:"active", isNewArrival:false, isBestSeller:false, isTrending:false, isLimitedOffer:true, sourceRef:"M-70013", tags:["accessory","casual"] },
];

/* ── Coupons ── */
const COUPONS = [
  { code:"NEW10", description:"10% off your first order", type:"percentage", value:10, minSubtotal:0, maxDiscount:500, isActive:true, firstOrderOnly:true },
  { code:"COMBO500", description:"₹500 off orders above ₹2,999", type:"flat", value:500, minSubtotal:2999, isActive:true },
  { code:"FESTIVE15", description:"15% off orders above ₹3,999", type:"percentage", value:15, minSubtotal:3999, maxDiscount:1000, isActive:true },
];

/* ── Seed ── */
// Safety: seeding REPLACES categories, products, combos and coupons. Refuse on a database
// that already has a catalog unless explicitly forced (npm run seed -- --force).
{
  const existing = await Product.countDocuments();
  if (existing > 0 && !process.argv.includes("--force")) {
    console.error(`\n✋ The database already has ${existing} products. Seeding would delete them.`);
    console.error("   Re-run with: npm run seed -- --force   (only on a dev/test database)\n");
    await mongoose.disconnect();
    process.exit(1);
  }
}
console.log("\n📦 Seeding melamart database...\n");

// Categories
await Category.deleteMany({});
await Category.insertMany(CATEGORIES.map((c,i) => ({ ...c, order:i, isActive:true, showInNav:true, showOnHome: c.slug !== "all-products" })));
console.log(`✓ ${CATEGORIES.length} categories`);

// Products
await Product.deleteMany({});
const insertedProducts = await Product.insertMany(PRODUCTS.map(p => ({
  ...p,
  seoTitle: `${p.name} — MelaMart`,
  seoDescription: p.description.slice(0,160),
})));
console.log(`✓ ${insertedProducts.length} products`);

// Build productId map
const productIdMap = {};
insertedProducts.forEach((p,i) => { productIdMap[PRODUCTS[i].slug] = p._id; });

// Combos
const COMBOS = [
  { name:"Streetwear Daily Combo", slug:"streetwear-daily-combo", tagline:"Tee + Jeans + Sneakers",
    description:"An effortless streetwear fit. Heavyweight tee, slim stretch denim and clean white sneakers — coordinated for a sharp off-duty look.",
    images:[portrait(P.man20),portrait(P.man9),portrait(P.man18)],
    itemSlugs:["heavyweight-crew-tee","slim-fit-stretch-denim","minimalist-white-sneakers"],
    combinedPrice:4597, comboPrice:3699, tags:["casual","streetwear"], rating:0, reviewCount:0, isTrending:true, isBestSeller:true, reelRef:"instagram_reel_01" },
  { name:"Smart Casual Combo", slug:"smart-casual-combo", tagline:"Shirt + Jeans + Loafers",
    description:"Smart-casual done right. Oxford shirt, tapered jeans and suede loafers for a polished everyday look.",
    images:[portrait(P.man5),portrait(P.man2),portrait(P.man14)],
    itemSlugs:["oxford-cotton-shirt","tapered-mid-wash-jeans","suede-loafers"],
    combinedPrice:5397, comboPrice:4299, tags:["smart","casual"], rating:0, reviewCount:0, isTrending:true, isBestSeller:false, reelRef:"instagram_reel_02" },
  { name:"Night Out Combo", slug:"night-out-combo", tagline:"Mandarin Shirt + Distressed Jeans + Monk Straps",
    description:"Built for evenings out. A band-collar shirt, distressed denim and oxblood monk straps.",
    images:[portrait(P.man19),portrait(P.man1),portrait(P.man15)],
    itemSlugs:["mandarin-collar-shirt","distressed-skinny-jeans","monk-strap-shoes"],
    combinedPrice:5797, comboPrice:4499, tags:["party"], rating:0, reviewCount:0, isTrending:true, isBestSeller:true, reelRef:"instagram_reel_03" },
  { name:"Weekend Ease Combo", slug:"weekend-ease-combo", tagline:"Oversized Tee + Relaxed Jeans + Sneakers",
    description:"Relaxed from head to toe. Oversized tee, relaxed stonewash jeans and retro runners.",
    images:[portrait(P.man9),portrait(P.man4),portrait(P.man16)],
    itemSlugs:["oversized-drop-shoulder-tee","relaxed-fit-stonewash-jeans","retro-runner-sneakers"],
    combinedPrice:5197, comboPrice:4099, tags:["casual","streetwear"], rating:0, reviewCount:0, isTrending:false, isBestSeller:true },
  { name:"Office Sharp Combo", slug:"office-sharp-combo", tagline:"Oxford Shirt + Tapered Jeans + Derby Shoes",
    description:"A refined work fit. Oxford shirt, tapered mid-wash jeans and leather derbies.",
    images:[portrait(P.man14),portrait(P.man2),portrait(P.man5)],
    itemSlugs:["oxford-cotton-shirt","tapered-mid-wash-jeans","leather-derby-shoes"],
    combinedPrice:5997, comboPrice:4799, tags:["party","formal"], rating:0, reviewCount:0, isTrending:false, isBestSeller:false },
  { name:"Summer Linen Combo", slug:"summer-linen-combo", tagline:"Linen Shirt + Polo + Sneakers",
    description:"Light and breezy for warm days. Linen casual shirt layered over a knit polo with white sneakers.",
    images:[portrait(P.man18),portrait(P.man10),portrait(P.man17)],
    itemSlugs:["linen-casual-shirt","striped-knit-polo","minimalist-white-sneakers"],
    combinedPrice:4397, comboPrice:3499, tags:["casual","summer"], rating:0, reviewCount:0, isTrending:true, isBestSeller:false, reelRef:"instagram_reel_04" },
];

await Combo.deleteMany({});
const comboDocs = await Combo.insertMany(COMBOS.map(c => {
  const items = c.itemSlugs.map(slug => {
    const p = PRODUCTS.find(p => p.slug === slug);
    return {
      productId: productIdMap[slug],
      name: p.name, slug: p.slug, image: p.images[0],
      price: p.price, category: p.category, categoryLabel: p.categoryLabel,
      description: p.description, sizes: p.sizes, colors: p.colors,
    };
  });
  const { itemSlugs: _itemSlugs, ...rest } = c; // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    ...rest, items,
    availableSizes: ["S","M","L","XL","28","30","32","34","6","7","8","9","10"],
    isActive: true,
    seoTitle: `${c.name} — Outfit Combo — MelaMart`,
    seoDescription: c.description.slice(0,160),
  };
}));
console.log(`✓ ${comboDocs.length} combos`);

// Coupons
await Coupon.deleteMany({});
await Coupon.insertMany(COUPONS);
console.log(`✓ ${COUPONS.length} coupons`);

await mongoose.disconnect();
console.log("\n✅ Seed complete! melamart database is ready.\n");
