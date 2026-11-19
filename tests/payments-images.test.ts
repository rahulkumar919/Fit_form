import crypto from "node:crypto";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/payments/razorpay";
import { ImageValidationError, processImage } from "@/lib/storage/process";

describe("Razorpay signatures", () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = "hook_secret";
  });

  it("accepts a correct payment signature and rejects tampering", () => {
    const sig = crypto.createHmac("sha256", "test_secret").update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", sig)).toBe(true);
    expect(verifyPaymentSignature("order_2", "pay_1", sig)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "deadbeef")).toBe(false);
  });

  it("verifies webhook bodies", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const sig = crypto.createHmac("sha256", "hook_secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig)).toBe(false);
  });
});

describe("image processing", () => {
  it("produces compressed WebP renditions and strips metadata", async () => {
    const input = await sharp({ create: { width: 2400, height: 3000, channels: 3, background: { r: 30, g: 80, b: 160 } } })
      .composite([{ input: Buffer.from('<svg width="2400" height="3000"><circle cx="1200" cy="1500" r="900" fill="#fff"/></svg>') }])
      .withMetadata({ exif: { IFD0: { Copyright: "secret-gps-owner" } } })
      .jpeg({ quality: 95 })
      .toBuffer();

    const out = await processImage(input);
    const [large, medium, thumb] = out.renditions;
    expect(large.width).toBe(1600);
    expect(medium.width).toBe(800);
    expect(thumb.width).toBe(320);
    expect(medium.bytes).toBeLessThan(input.length);
    expect(out.blurDataURL.startsWith("data:image/webp;base64,")).toBe(true);

    const meta = await sharp(medium.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
  });

  it("rejects non-images and tiny images", async () => {
    await expect(processImage(Buffer.from("<?php echo 1; ?>"))).rejects.toBeInstanceOf(ImageValidationError);
    const tiny = await sharp({ create: { width: 50, height: 50, channels: 3, background: "#fff" } }).png().toBuffer();
    await expect(processImage(tiny)).rejects.toBeInstanceOf(ImageValidationError);
  });
});
