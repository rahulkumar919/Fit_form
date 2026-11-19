/**
 * MelaMart — Review Seed Script
 * Removes ALL existing reviews and inserts 10 fresh hand-crafted ones.
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-reviews.mjs
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

await mongoose.connect(MONGO_URI, { dbName: "melamart" });
console.log("✓ Connected to", mongoose.connection.db.databaseName);

/* ── Inline schemas ── */
const ProductSchema = new mongoose.Schema({ name: String, slug: String }, { strict: false });
const ReviewSchema  = new mongoose.Schema(
  {
    productId:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User",    default: null },
    orderId:       { type: mongoose.Schema.Types.ObjectId, ref: "Order",   default: null },
    author:        { type: String, required: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    title:         { type: String, default: "" },
    body:          { type: String, default: "" },
    verified:      { type: Boolean, default: false },
    isApproved:    { type: Boolean, default: true },
    source:        { type: String, default: "store_testimonial" },
    status:        { type: String, default: "approved" },
    images:        [String],
    customerImage: { type: String, default: "" },
    helpfulCount:  { type: Number, default: 0 },
    helpfulVoters: [String],
    featured:      { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Review  = mongoose.models.Review  || mongoose.model("Review",  ReviewSchema);

/* ── Fetch all products (slug → _id map) ── */
const allProducts = await Product.find({}, "_id slug name").lean();
if (allProducts.length === 0) {
  console.error("❌ No products found in DB. Run npm run seed first.");
  await mongoose.disconnect();
  process.exit(1);
}

const slugMap = {};
allProducts.forEach((p) => { slugMap[p.slug] = p._id; });

// Helper: return productId by slug, fall back to a random product if not found
const pid = (slug) => {
  if (slugMap[slug]) return slugMap[slug];
  const fallback = allProducts[Math.floor(Math.random() * allProducts.length)];
  console.warn(`  ⚠  Slug "${slug}" not found — using "${fallback.slug}" instead`);
  return fallback._id;
};

/* ══════════════════════════════════════════════════════════════
   10 HAND-CRAFTED REVIEWS — using real slugs from your DB
══════════════════════════════════════════════════════════════ */
const REVIEWS = [
  {
    slug:    "korean-luxe-casual-jacket",
    author:  "Arjun Mehta",
    rating:  5,
    title:   "Best jacket I've owned — premium feel at a great price",
    body:    "Ordered the Korean Luxe Casual Jacket and I'm blown away by the quality. The fabric is thick and structured, the stitching is immaculate, and the fit is exactly as shown. Got so many compliments the first time I wore it. Shipping was quick too. Definitely ordering more from MelaMart!",
    helpful: 14,
    featured: true,
  },
  {
    slug:    "noirflex-korean-zipper-hoodie-for-men",
    author:  "Rahul Sharma",
    rating:  5,
    title:   "Exactly what a premium hoodie should feel like",
    body:    "The NoirFlex hoodie exceeded my expectations. The zipper is smooth, the fleece lining is incredibly soft, and the fit is relaxed without looking sloppy. Wore it on a college trip and everyone kept asking where I got it from. MelaMart quality is genuinely top-tier. Ordering two more colours!",
    helpful: 11,
    featured: true,
  },
  {
    slug:    "mens-black-straight-fit-jeans",
    author:  "Kabir Singh",
    rating:  5,
    title:   "Perfect black jeans — fits like a dream",
    body:    "Finally found black jeans that actually fit well straight off the shelf. Slim through the thigh, clean straight leg, and the fabric has just enough stretch for all-day comfort. I've washed them 6 times and the black hasn't faded at all. Brilliant value. Would give 6 stars if I could.",
    helpful: 18,
    featured: true,
  },
  {
    slug:    "mens-premium-layered-hoodie",
    author:  "Nikhil Patel",
    rating:  5,
    title:   "The layered look is a total head-turner",
    body:    "This hoodie has the most unique design I've seen — the layered graphic detail makes it look like you're wearing two pieces when it's actually one. Super comfortable, heavyweight fabric, and the colours are rich. Wore it to a college fest and was easily the best-dressed person there.",
    helpful: 9,
    featured: true,
  },
  {
    slug:    "mens-olive-green-stretch-cargo-pant",
    author:  "Vikram Nair",
    rating:  4,
    title:   "Comfortable, stylish cargo pants — great everyday wear",
    body:    "The olive green stretch cargo pants are a solid buy. The stretch fabric makes them incredibly comfortable for long days, and the multiple pockets are actually useful, not just decorative. Fit is true to size. Lost one star only because the olive shade is slightly darker than in the photos, but I still love them.",
    helpful: 7,
    featured: false,
  },
  {
    slug:    "luxerider-premium-beige-leather-biker-jacket-for-men",
    author:  "Rohan Gupta",
    rating:  5,
    title:   "Looks like it costs 4x the price — absolutely stunning",
    body:    "The LuxeRider beige leather biker jacket is hands-down the best purchase I've made this year. Full-grain leather, exceptional stitching, and the beige colour is a rare find that works with almost any outfit. Got compliments at a family function and everyone thought it was a designer piece. Zero regrets.",
    helpful: 22,
    featured: true,
  },
  {
    slug:    "mens-forest-green-beige-vintage-checkered-casual-shirt",
    author:  "Aditya Verma",
    rating:  5,
    title:   "Vintage vibes done perfectly — a must-have shirt",
    body:    "This checkered shirt nails the vintage aesthetic without looking outdated. The forest green and beige combination is earthy and versatile — pairs brilliantly with beige chinos or dark denim. The cotton blend is soft and breathable. I've already recommended it to three friends. Great product, great price.",
    helpful: 13,
    featured: true,
  },
  {
    slug:    "cozycore-classic-unisex-hoodie",
    author:  "Siddharth Joshi",
    rating:  4,
    title:   "Super soft and cozy — worth every rupee",
    body:    "The CozyCore hoodie lives up to its name. The fleece interior is incredibly plush and the fit is relaxed enough to layer over a t-shirt comfortably. Quality of the fabric is noticeably better than other hoodies in this price range. The only reason it's 4 stars is the hood could be slightly larger. Overall a great buy.",
    helpful: 8,
    featured: false,
  },
  {
    slug:    "mens-brown-beige-oversized-checkered-casual-shirt",
    author:  "Pranav Kulkarni",
    rating:  5,
    title:   "Oversized done right — the perfect lazy-day shirt",
    body:    "Obsessed with this brown and beige checkered shirt. The oversized fit is generous but still structured — it doesn't look like you've borrowed your father's shirt. The fabric is mid-weight so it works for both AC environments and mild outdoor weather. Already on my third order from MelaMart. Consistent quality every time.",
    helpful: 16,
    featured: true,
  },
  {
    slug:    "mens-black-tiger-print-varsity-bomber-jacket",
    author:  "Harsh Malhotra",
    rating:  5,
    title:   "Bold, eye-catching and incredibly well-made",
    body:    "The tiger print varsity bomber jacket is a statement piece that actually delivers. The print quality is sharp and hasn't cracked after multiple washes. The bomber fit is classic — slightly cropped with ribbed cuffs and hem. If you want to stand out at an event without trying too hard, this is it. 10/10 from me.",
    helpful: 20,
    featured: true,
  },
];

/* ── Clear existing reviews ── */
const deleted = await Review.deleteMany({});
console.log(`\n🗑  Cleared ${deleted.deletedCount} existing review(s)`);

/* ── Insert 10 new reviews ── */
const docs = REVIEWS.map((r, i) => {
  const { slug, helpful, ...rest } = r;
  // Stagger timestamps: oldest = 30 days ago, newest = 3 days ago
  const daysAgo = 30 - i * 3;
  const ts = new Date(Date.now() - daysAgo * 86_400_000);
  return {
    ...rest,
    productId:     pid(slug),
    source:        "store_testimonial",
    status:        "approved",
    isApproved:    true,
    verified:      false,
    userId:        null,
    orderId:       null,
    images:        [],
    customerImage: "",
    helpfulCount:  helpful,
    helpfulVoters: [],
    createdAt:     ts,
    updatedAt:     ts,
  };
});

const inserted = await Review.insertMany(docs);
console.log(`\n✅ Inserted ${inserted.length} reviews:\n`);
inserted.forEach((_, i) => {
  const r = REVIEWS[i];
  console.log(`  ${i + 1}. ${r.author.padEnd(20)} ${r.rating}★  "${r.title}"`);
});

await mongoose.disconnect();
console.log("\n🎉 Done! All 10 reviews are live and approved.\n");
