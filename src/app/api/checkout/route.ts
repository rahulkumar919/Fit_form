/**
* POST /api/checkout — place an order.
*
* Supports authenticated customers and unauthenticated guests.
* Supports paymentMethod: razorpay | cashfree | partial_cod
* Prices, coupon and shipping are always recalculated server-side.
* Every selected size/colour must exist and be in stock.
* The order is credited to the visitor's traffic source / tracked link.
*/

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel, generateOrderNumber } from "@/models/Order";
import { UserModel } from "@/models/User";
import { ProductModel } from "@/models/Product";  
import { ComboModel } from "@/models/Combo";
import { CouponModel } from "@/models/Coupon";
import { SupplierProductModel } from "@/models/SupplierProduct";
import { calculateOrderPrices } from "@/lib/pricing/calculator";
import { badRequest, created, serverError, zodError } from "@/lib/api/response";
import { extractUserId } from "@/lib/api/auth-guard";
import { createOrderSchema } from "@/lib/validations/order";
import { ATTR_COOKIE, SID_COOKIE, VID_COOKIE, decodeAttr } from "@/lib/tracking/cookies";
import { rateLimited } from "@/lib/tracking/record";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { getSettings } from "@/services/settings";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/payments/razorpay";
import { cashfreeConfigured, createCashfreeOrder } from "@/lib/payments/cashfree";
import { auth } from "@/lib/auth/auth";
import { sendOrderConfirmationEmail, orderToEmailData } from "@/lib/email";
import { getPartialCodBreakdown } from "@/lib/pricing/partial-cod";

/* eslint-disable @typescript-eslint/no-explicit-any */

const checkoutSchema = createOrderSchema.extend({
  items: createOrderSchema.shape.items.max(30, "Too many items in one order"),
  saveAddress: z.boolean().optional(),
});

function variantHasSize(product: any, color: string, size: string): boolean {
  const variant = (product.variants ?? []).find((v: any) => v.color === color);
  const s = variant?.sizes?.find((z: any) => z.size === size);
  return !!s && s.inStock !== false && (s.available ?? 0) > 0;
}

/** Fire-and-forget: mark emailSentAt then send. Never throws. */
async function sendConfirmation(order: any): Promise<void> {
  try {
    if (order.emailSentAt) return; // idempotency guard
    const isGuest = !order.userId;
    const data = orderToEmailData(order, isGuest);
    const sent = await sendOrderConfirmationEmail(data);
    if (sent) {
      await OrderModel.updateOne({ _id: order._id }, { $set: { emailSentAt: new Date() } });
    }
  } catch (err) {
    console.error("[checkout] email send error:", (err as Error).message);
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── auth check: optional (guests allowed) ──
    const session = await auth();
    const isAuthenticated = !!session?.user;
    const userId: string | null = isAuthenticated ? extractUserId(session!) : null;

    if (!hasDB()) return badRequest("Ordering is unavailable right now");

    // Rate limit by userId if logged in, by IP if guest
    const rateLimitKey = userId
      ? `checkout:${userId}`
      : `checkout:${req.headers.get("x-forwarded-for") ?? "unknown"}`;
    if (rateLimited(rateLimitKey, 8)) return badRequest("Too many attempts. Please wait a minute.");

    const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;

    const storeSettings = await getSettings();

    if (input.paymentMethod === "razorpay") {
      if (!razorpayConfigured()) return badRequest("Online payment is not available yet. Please try again later.");
      if ((storeSettings.activeGateway ?? "cashfree") !== "razorpay") return badRequest("Razorpay is not the active payment gateway.");
    }
    if (input.paymentMethod === "cashfree") {
      if (!cashfreeConfigured()) return badRequest("Online payment is not available yet. Please try again later.");
      if ((storeSettings.activeGateway ?? "cashfree") !== "cashfree") return badRequest("Cashfree is not the active payment gateway.");
    }
    if (input.paymentMethod === "partial_cod") {
      if (!razorpayConfigured()) return badRequest("Partial payment requires Razorpay. Please configure Razorpay keys.");
      if ((storeSettings.activeGateway ?? "cashfree") !== "razorpay") return badRequest("Partial payment requires Razorpay as the active gateway.");
      if (!storeSettings.partialCod.enabled) return badRequest("Partial payment is not available right now.");
    }

    await connectDB();
    /* ── availability: every line must reference live products ── */
    const productIds = new Set<string>();
    const comboIds = new Set<string>();
    for (const it of input.items) {
      if (!OBJECT_ID_RE.test(it.refId)) return badRequest(`"${it.name}" is no longer available`);
      (it.kind === "product" ? productIds : comboIds).add(it.refId);
      for (const s of it.selections ?? []) if (OBJECT_ID_RE.test(s.productId)) productIds.add(s.productId);
    }
    const [products, combos] = await Promise.all([
      ProductModel.find({ _id: { $in: [...productIds] }, status: "active" }).lean(),
      ComboModel.find({ _id: { $in: [...comboIds] }, isActive: true }).lean(),
    ]);
    const pMap = new Map(products.map((p: any) => [String(p._id), p]));
    const cMap = new Map(combos.map((c: any) => [String(c._id), c]));

    for (const it of input.items) {
      if (it.kind === "product") {
        const p = pMap.get(it.refId);
        if (!p) return badRequest(`"${it.name}" is no longer available`);
        if (!variantHasSize(p, it.color ?? "", it.size ?? "")) return badRequest(`${p.name} (${it.color}, ${it.size}) is out of stock`);
      } else {
        const c: any = cMap.get(it.refId);
        if (!c) return badRequest(`"${it.name}" is no longer available`);
        const want = (c.items ?? []).map((x: any) => String(x.productId)).sort().join(",");
        const got = (it.selections ?? []).map((s) => s.productId).sort().join(",");
        if (want !== got) return badRequest(`Please re-add "${c.name}" to your bag; the combo has changed`);
        for (const sel of it.selections ?? []) {
          const p = pMap.get(sel.productId);
          if (!p || !variantHasSize(p, sel.color, sel.size)) return badRequest(`${p?.name ?? "An item"} (${sel.color}, ${sel.size}) in "${c.name}" is out of stock`);
        }
      }
    }

    /* ── authoritative prices ── */
    const pricing = await calculateOrderPrices(
      input.items as never,
      input.couponCode,
      userId ? { userId } : {},
    );
    if (input.couponCode?.trim() && !pricing.couponApplied) {
      return badRequest(pricing.couponMessage || "This coupon can't be applied to your order");
    }

    /* ── estimated profit ── */
    const suppliers = await SupplierProductModel.find({ productId: { $in: [...productIds] } }).lean();
    const costOf = new Map(suppliers.map((s: any) => [String(s.productId), s.sourcePrice + s.handlingCost + s.deliveryCost + s.otherCost]));
    let profit = 0;
    let allCosted = true;
    for (const it of pricing.items) {
      const ids = it.kind === "product" ? [it.refId] : (it.selections ?? []).map((s: any) => s.productId);
      let cost = 0;
      for (const id of ids) {
        const c = costOf.get(id);
        if (c === undefined) allCosted = false;
        else cost += c;
      }
      profit += (it.unitPrice - cost) * it.quantity;
    }
    profit -= pricing.discount;

    /* ── attribution ── */
    const jar = await cookies();
    const attr = decodeAttr(jar.get(ATTR_COOKIE)?.value);
    const vid = jar.get(VID_COOKIE)?.value ?? "";
    const sid = jar.get(SID_COOKIE)?.value ?? "";

    /* ── guest tracking token (guests only) ── */
    const guestTrackingToken = !userId ? uuidv4() : undefined;

    /* ── Partial COD: compute advance server-side from live settings ── */
    let advanceAmount = 0;
    let remainingAmount = 0;
    let advancePaise = 0;
    if (input.paymentMethod === "partial_cod") {
      const breakdown = getPartialCodBreakdown(
        pricing.total,
        storeSettings.partialCod,
        storeSettings.activeGateway,
      );
      if (!breakdown) {
        return badRequest("Partial COD is not available for this order amount.");
      }
      advanceAmount = breakdown.advance;
      remainingAmount = breakdown.remaining;
      advancePaise = breakdown.advancePaise;
    }

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId: userId ?? null,
      guestTrackingToken,
      customerName: input.fullName,
      customerEmail: input.email,
      status: "new",
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "partial_cod" ? "pending" : "pending",
      advanceAmount: input.paymentMethod === "partial_cod" ? advanceAmount : 0,
      remainingAmount: input.paymentMethod === "partial_cod" ? remainingAmount : 0,
      items: pricing.items as never[],
      address: {
        label: "Delivery",
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 ?? "",
        city: input.city,
        state: input.state,
        pincode: input.pincode,
      },
      couponCode: pricing.couponApplied ? input.couponCode?.toUpperCase() : "",
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      shipping: pricing.shipping,
      total: pricing.total,
      estimatedProfit: allCosted ? profit : 0,
      notes: allCosted ? "" : "Some items have no Meesho source cost; profit not estimated.",
      attribution: {
        source: attr?.source ?? "direct",
        medium: attr?.medium ?? "",
        campaign: attr?.campaign ?? "",
        linkCode: attr?.linkCode ?? "",
        landingPath: attr?.landingPath ?? "",
        visitorId: vid,
        sessionId: sid,
      },
    });

    /* ── save address (authenticated users only) ── */
    if (input.saveAddress && userId && OBJECT_ID_RE.test(userId)) {
      const user = await UserModel.findById(userId).select("addresses");
      if (user) {
        const key = `${input.line1.trim().toLowerCase()}|${input.pincode}`;
        const exists = user.addresses.some((a) => `${a.line1.trim().toLowerCase()}|${a.pincode}` === key);
        if (!exists && user.addresses.length < 5) {
          user.addresses.push({
            label: user.addresses.length === 0 ? "Home" : `Address ${user.addresses.length + 1}`,
            fullName: input.fullName,
            phone: input.phone,
            line1: input.line1,
            line2: input.line2 ?? "",
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            isDefault: user.addresses.length === 0,
          });
          await user.save();
        }
      }
    }

    /* ── coupon usage increment ── */
    if (pricing.couponApplied && input.couponCode) {
      await CouponModel.updateOne({ code: input.couponCode.toUpperCase() }, { $inc: { usageCount: 1 } });
    }

    /* ── Razorpay ── */
    if (input.paymentMethod === "razorpay") {
      try {
        const rzp = await createRazorpayOrder(order.total, order.orderNumber);
        order.razorpayOrderId = rzp.id;
        await order.save();
        return created({
          orderNumber: order.orderNumber,
          total: order.total,
          id: String(order._id),
          guestTrackingToken: guestTrackingToken ?? null,
          razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: rzp.id,
            amount: rzp.amount,
            currency: rzp.currency,
          },
        });
      } catch (e) {
        order.paymentStatus = "failed";
        order.status = "cancelled";
        order.notes = "Could not start Razorpay payment";
        await order.save();
        throw e;
      }
    }

    /* ── Partial COD: Razorpay for advance only ── */
    if (input.paymentMethod === "partial_cod") {
      try {
        // Create a Razorpay order for the advance amount only (paise, integer)
        const rzp = await createRazorpayOrder(advanceAmount, `${order.orderNumber}-ADV`);
        order.razorpayOrderId = rzp.id;
        await order.save();
        return created({
          orderNumber: order.orderNumber,
          total: order.total,
          id: String(order._id),
          guestTrackingToken: guestTrackingToken ?? null,
          advanceAmount,
          remainingAmount,
          razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: rzp.id,
            amount: rzp.amount,      // paise
            currency: rzp.currency,
          },
        });
      } catch (e) {
        order.paymentStatus = "failed";
        order.status = "cancelled";
        order.notes = "Could not start Partial COD advance payment";
        await order.save();
        throw e;
      }
    }

    /* ── Cashfree ── */
    if (input.paymentMethod === "cashfree") {
      try {
        const cf = await createCashfreeOrder({
          mongoOrderId: String(order._id),
          orderNumber: order.orderNumber,
          amountRupees: order.total,
          customerPhone: input.phone,
          customerEmail: input.email,
          customerName: input.fullName,
        });
        order.cashfreeOrderId = cf.cfOrderId;
        await order.save();
        return created({
          orderNumber: order.orderNumber,
          total: order.total,
          id: String(order._id),
          guestTrackingToken: guestTrackingToken ?? null,
          cashfree: {
            paymentSessionId: cf.paymentSessionId,
            cfOrderId: cf.cfOrderId,
            sandbox: cf.sandbox,
          },
        });
      } catch (e) {
        order.paymentStatus = "failed";
        order.status = "cancelled";
        order.notes = "Could not start Cashfree payment";
        await order.save();
        throw e;
      }
    }

    // Should never reach here — all allowed payment methods are handled above.
    return badRequest("Invalid payment method.");
  } catch (err) {
    return serverError(err);
  }
}
