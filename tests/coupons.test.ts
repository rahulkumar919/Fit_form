import { beforeAll, describe, expect, it } from "vitest";
import { checkCoupon, discountFor } from "@/lib/pricing/coupons";

// Exercise the rules without a database (falls back to the built-in coupon list).
beforeAll(() => {
  delete process.env.USE_REAL_DB;
});

describe("discountFor", () => {
  it("caps percentage coupons at maxDiscount", () => {
    expect(discountFor({ code: "P", description: "", type: "percentage", value: 10, maxDiscount: 500 }, 3000)).toBe(300);
    expect(discountFor({ code: "P", description: "", type: "percentage", value: 10, maxDiscount: 500 }, 9000)).toBe(500);
  });

  it("never discounts more than the subtotal for flat coupons", () => {
    expect(discountFor({ code: "F", description: "", type: "flat", value: 500 }, 300)).toBe(300);
    expect(discountFor({ code: "F", description: "", type: "flat", value: 500 }, 3000)).toBe(500);
  });

  it("rounds percentage discounts to whole rupees", () => {
    expect(discountFor({ code: "P", description: "", type: "percentage", value: 15 }, 999)).toBe(150);
  });
});

describe("checkCoupon", () => {
  it("rejects unknown codes", async () => {
    const r = await checkCoupon("NOPE", 5000);
    expect(r.ok).toBe(false);
  });

  it("is case-insensitive and trims input", async () => {
    const r = await checkCoupon("  new10 ", 2000);
    expect(r).toMatchObject({ ok: true, discount: 200 });
  });

  it("enforces the minimum subtotal", async () => {
    const r = await checkCoupon("COMBO500", 2000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/Minimum order/);
    expect(await checkCoupon("COMBO500", 2999)).toMatchObject({ ok: true, discount: 500 });
  });
});
