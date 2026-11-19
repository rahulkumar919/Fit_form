/** POST /api/newsletter — opt in to the mailing list and receive the welcome coupon on screen. */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { SubscriberModel } from "@/models/Subscriber";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { rateLimited } from "@/lib/tracking/record";
import { findActiveCoupon } from "@/lib/pricing/coupons";

/** Welcome coupon revealed after sign-up; only shown if it's actually live. */
const WELCOME_COUPON = "NEW10";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  source: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(`newsletter:${ip}`, 5)) return badRequest("Too many attempts. Please wait a minute.");
    if (!hasDB()) return badRequest("Sign-up is unavailable right now");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid email");

    await connectDB();
    await SubscriberModel.updateOne(
      { email: parsed.data.email },
      { $set: { status: "subscribed" }, $setOnInsert: { source: parsed.data.source || "homepage" } },
      { upsert: true },
    );

    const coupon = await findActiveCoupon(WELCOME_COUPON);
    return ok({
      coupon: coupon
        ? { code: coupon.code, description: coupon.description, firstOrderOnly: !!coupon.firstOrderOnly, maxDiscount: coupon.maxDiscount ?? null }
        : null,
    });
  } catch (err) {
    return serverError(err);
  }
}
