// scripts/seed-faqs.mjs
// Run: node --env-file=.env.local scripts/seed-faqs.mjs

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const FaqSchema = new mongoose.Schema({
  question: String,
  answer:   String,
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Faq = mongoose.models?.Faq ?? mongoose.model("Faq", FaqSchema);

const FAQS = [
  {
    question: "What is MelaMart?",
    answer: "MelaMart is a premium men's fashion store offering a curated range of hoodies, jackets, jeans, track pants, shirts, and combos — all at unbeatable prices with fast delivery across India.",
  },
  {
    question: "Do you offer free shipping?",
    answer: "Yes! We offer free shipping on orders above ₹999. For orders below ₹999, a nominal shipping fee of ₹49 is charged. All orders are shipped within 1–2 business days.",
  },
  {
    question: "How long does delivery take?",
    answer: "Standard delivery takes 4–7 business days depending on your location. Metro cities typically receive orders in 3–4 days. You will receive a tracking link via WhatsApp and email once your order ships.",
  },
  {
    question: "Is Cash on Delivery (COD) available?",
    answer: "Yes, we offer Cash on Delivery across most pin codes in India. COD orders above ₹500 are accepted. Online payments via UPI, credit/debit cards, and net banking are also available.",
  },
  {
    question: "What is your return and exchange policy?",
    answer: "We offer a 7-day easy return and exchange policy. If you receive a damaged, defective, or wrong item, contact us within 7 days of delivery. Products must be unwashed, unworn, and have tags intact. WhatsApp us at the number listed on the site to initiate a return.",
  },
  {
    question: "How do I track my order?",
    answer: "Once your order is shipped, you will receive a tracking link on your registered WhatsApp number and email. You can also visit the 'Track Order' page on our website and enter your order ID.",
  },
  {
    question: "How do I choose the right size?",
    answer: "We have a detailed size guide on every product page. Click 'Size Guide' next to the size selector to see chest, shoulder, and length measurements. When in doubt, size up — our clothes are true to size or slightly fitted.",
  },
  {
    question: "Are the products original and of good quality?",
    answer: "Absolutely. All MelaMart products go through strict quality checks before dispatch. We source directly from trusted manufacturers and use premium fabrics. Our 4.8★ average rating from thousands of customers speaks to our quality.",
  },
  {
    question: "Can I cancel my order?",
    answer: "You can cancel your order within 12 hours of placing it by contacting us on WhatsApp. Once the order is shipped, cancellation is not possible, but you can request a return after delivery.",
  },
  {
    question: "Do you offer combo deals?",
    answer: "Yes! MelaMart offers exclusive combo packs where you get multiple items at a discounted bundle price. Check our 'Combos' section on the homepage or in the navigation for the latest deals.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept UPI (GPay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), net banking, and Cash on Delivery. All online payments are processed securely via Cashfree.",
  },
  {
    question: "How can I contact MelaMart support?",
    answer: "You can reach us via WhatsApp (button on the website), or email us at support@melamart.in. Our support team is available Monday–Saturday, 10 AM to 7 PM IST. We typically respond within 2 hours.",
  },
  {
    question: "Do you ship outside India?",
    answer: "Currently, MelaMart only ships within India. We are working on expanding to international shipping soon. Subscribe to our newsletter to be notified when we launch international delivery.",
  },
  {
    question: "How do I apply a discount coupon?",
    answer: "During checkout, you'll see a 'Have a coupon?' field. Enter your coupon code there and click Apply. The discount will be deducted from your order total. New customers can use code NEW10 for 10% off their first order.",
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: "melamart" });
  console.log("Connected to MongoDB");

  // Clear existing FAQs first
  const deleted = await Faq.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing FAQs`);

  const docs = FAQS.map((faq, i) => ({ ...faq, order: i }));
  await Faq.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} FAQs successfully!`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
