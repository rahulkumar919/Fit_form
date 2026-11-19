/** POST /api/coupons/validate — preview a coupon against a subtotal (re-checked at checkout). */
import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { checkCoupon } from "@/lib/pricing/coupons";
import { rateLimited } from "@/lib/tracking/record";

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().min(0).max(10_000_000),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (rateLimited(`coupon:${ip}`, 30)) return badRequest("Too many attempts. Please wait a minute.");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid request");
    const { code, subtotal } = parsed.data;

    const session = await auth();
    const result = await checkCoupon(code, subtotal, session?.user?.userId);
    if (!result.ok) return badRequest(result.message);

    return ok({
      code: result.coupon.code,
      description: result.coupon.description,
      type: result.coupon.type,
      discount: result.discount,
    });
  } catch (err) {
    return serverError(err);
  }
}
