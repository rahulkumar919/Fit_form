/** Razorpay helpers (server only). */

import crypto from "node:crypto";

export function razorpayConfigured(): boolean {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return /^rzp_(test|live)_[A-Za-z0-9]+$/.test(id) && !id.includes("xxxx") && !!secret && !secret.startsWith("your-");
}

export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const Razorpay = (await import("razorpay")).default;
  const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  const order = await rzp.orders.create({ amount: Math.round(amountRupees * 100), currency: "INR", receipt: receipt.slice(0, 40) });
  return { id: order.id as string, amount: Number(order.amount), currency: String(order.currency) };
}

/** Constant-time HMAC comparison. */
function safeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]+$/i.test(a) || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(signature, expected);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || secret.startsWith("your-")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(signature, expected);
}
