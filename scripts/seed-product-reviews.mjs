/**
 * MelaMart — Seed 10 reviews for a specific product
 * Targets: Men's Premium Layered Hoodie (slug: mens-premium-layered-hoodie)
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-product-reviews.mjs
 *
 * What it does:
 *  1. Finds the product by slug
 *  2. Deletes any existing reviews for that product
 *  3. Inserts 10 realistic, hand-crafted store testimonials (approved instantly)
 *  4. Recomputes and updates product.rating + product.reviewCount
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error("❌  MONGODB_URI not set"); process.exit(1); }

await mongoose.connect(MONGO_URI, { dbName: "melamart" });
console.log("✓ Connected to", mongoose.connection.db.databaseName);

/* ── Schemas ── */
const ProductSchema = new mongoose.Schema({ name: String, slug: String, rating: Number, reviewCount: Number }, { strict: false });
const ReviewSchema  = new mongoose.Schema(
  {
    productId:     { type: mongoose.Schema.Types.ObjectId, required: true },
    userId:        { type: mongoose.Schema.Types.ObjectId, default: null },
    orderId:       { type: mongoose.Schema.Types.ObjectId, default: null },
    author:        { type: String, required: true },
    rating:        { type: Number, required: true },
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

/* ── Find the product ── */
const TARGET_SLUG = "mens-premium-layered-hoodie";
const product = await Product.findOne({ slug: TARGET_SLUG }).lean();

if (!product) {
  console.error(`❌  Product not found: ${TARGET_SLUG}`);
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`\n📦 Product: "${product.name}"  (${product._id})`);

/* ════════════════════════════════════════════════════════════
   10 HAND-CRAFTED REVIEWS — realistic, varied, authentic-feel
════════════════════════════════════════════════════════════ */
const REVIEWS = [
  {
    author:  "Arjun Mehta",
    rating:  5,
    title:   "Looks like it costs 5x the price!",
    body:    "Honestly didn't expect this quality at this price point. The layered design is super unique — it looks like two separate pieces but it's one hoodie. The fabric is thick and premium, the stitching is clean, and the fit is perfect. Got it in M and it's spot on. Already ordered another colour. Highly recommend!",
    helpful: 22,
    featured: true,
    daysAgo: 28,
  },
  {
    author:  "Rahul Sharma",
    rating:  5,
    title:   "Best hoodie I've bought in years",
    body:    "I've bought a lot of hoodies and this one stands out. The layered graphic detail on the front is eye-catching without being loud. The zipper is smooth, the hood is generously sized, and the fleece interior is incredibly soft. Wore it to college and everyone kept asking about it. Absolutely worth it.",
    helpful: 17,
    featured: true,
    daysAgo: 25,
  },
  {
    author:  "Kabir Singh",
    rating:  5,
    title:   "Fits perfectly and looks amazing",
    body:    "Ordered the XL and the fit is exactly right — relaxed without being too baggy. The cream/grey colourway is versatile and pairs well with jeans or track pants. The fabric weight is satisfying, not thin at all. After 4 washes the colour and graphics are still intact. MelaMart has gained a loyal customer!",
    helpful: 15,
    featured: true,
    daysAgo: 22,
  },
  {
    author:  "Nikhil Patel",
    rating:  4,
    title:   "Great quality, sizing slightly generous",
    body:    "The hoodie itself is excellent — premium feel, great design, and very comfortable. I'd suggest sizing down if you prefer a more fitted look (I usually wear L and the L felt more like an XL on me). That said, the quality of fabric and print is outstanding. Really happy with the purchase overall.",
    helpful: 11,
    featured: false,
    daysAgo: 20,
  },
  {
    author:  "Vikram Nair",
    rating:  5,
    title:   "Stood out at every event I wore it to",
    body:    "Wore this to three different outings and each time someone asked where I got it. The layered look with the graphic detail is a conversation starter. The build quality is solid — no loose threads, no cheap zipper pulls, nothing. This is the kind of piece you buy once and wear for years. Five stars, no hesitation.",
    helpful: 20,
    featured: true,
    daysAgo: 18,
  },
  {
    author:  "Rohan Gupta",
    rating:  5,
    title:   "Exceeded every expectation",
    body:    "Was a bit skeptical buying a premium hoodie online but MelaMart delivered big time. The packaging was neat, the product looks exactly like the photos, and the fabric is heavyweight and structured. The hood has a proper drawstring that actually works. Zero complaints — this is now my go-to winter hoodie.",
    helpful: 13,
    featured: false,
    daysAgo: 16,
  },
  {
    author:  "Aditya Verma",
    rating:  5,
    title:   "Perfect winter streetwear piece",
    body:    "If you're looking for a hoodie that works for college, outings, or just casual daily wear — this is it. The layered design gives it a high-fashion look without the high-fashion price tag. The inner fleece lining is super warm. Delivery was fast and the product was well-packed. Very happy with this purchase.",
    helpful: 10,
    featured: true,
    daysAgo: 13,
  },
  {
    author:  "Siddharth Joshi",
    rating:  4,
    title:   "Solid quality, would buy again",
    body:    "The hoodie is well-made and the design is genuinely unique. I've been wearing it almost every day this week — it's that comfortable. The only minor thing is the front graphic placement is slightly off-center on mine, but it's barely noticeable. Quality-wise it's excellent, especially at this price. Recommended.",
    helpful: 8,
    featured: false,
    daysAgo: 10,
  },
  {
    author:  "Pranav Kulkarni",
    rating:  5,
    title:   "My new favourite piece of clothing",
    body:    "No joke — I wear this almost every day now. The layered look is so clean and the fabric keeps you warm without being heavy or stiff. The zipper mechanism is smooth and the cuffs are properly ribbed so they don't lose shape. This is the kind of hoodie that becomes a wardrobe staple. 10/10 from me.",
    helpful: 18,
    featured: true,
    daysAgo: 7,
  },
  {
    author:  "Harsh Malhotra",
    rating:  5,
    title:   "Bought it as a gift — huge hit!",
    body:    "Got this as a birthday gift for my younger brother and he absolutely loves it. The packaging made it feel premium right from the unboxing. The fit, the quality, and the design all impressed him immediately. He's already told all his friends about it. Would definitely order from MelaMart again. Great product!",
    helpful: 14,
    featured: false,
    daysAgo: 4,
  },
];

/* ── Clear existing reviews for THIS product only ── */
const deleted = await Review.deleteMany({ productId: product._id });
console.log(`🗑  Cleared ${deleted.deletedCount} existing review(s) for this product`);

/* ── Insert reviews ── */
const now = Date.now();
const docs = REVIEWS.map((r) => {
  const { daysAgo, helpful, ...rest } = r;
  const ts = new Date(now - daysAgo * 86_400_000);
  return {
    ...rest,
    productId:     product._id,
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
  console.log(`  ${String(i + 1).padStart(2)}. ${r.author.padEnd(20)} ${r.rating}★  "${r.title}"`);
});

/* ── Recompute and update product rating + reviewCount ── */
const agg = await Review.aggregate([
  { $match: { productId: product._id, status: "approved" } },
  { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
]);
const rating      = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
const reviewCount = agg[0]?.n ?? 0;

await Product.updateOne({ _id: product._id }, { $set: { rating, reviewCount } });
console.log(`\n📊 Updated product stats → rating: ${rating} ⭐  |  reviewCount: ${reviewCount}`);

await mongoose.disconnect();
console.log("\n🎉 Done! Reviews are live on the product page.\n");
