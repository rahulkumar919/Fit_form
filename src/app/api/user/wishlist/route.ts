/**
 * GET  /api/user/wishlist  — the signed-in customer's saved ids
 * POST /api/user/wishlist  — add / remove one item ({ kind, id, add? }); omit `add` to toggle
 * PUT  /api/user/wishlist  — merge a list of ids (used once after login to
 *                            fold the guest wishlist into the account)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { WishlistModel } from "@/models/Wishlist";
import { ok, serverError, badRequest } from "@/lib/api/response";
import { requireAuth, extractUserId } from "@/lib/api/auth-guard";
import { getCombosByIds, getProductsByIds } from "@/services/catalog";

const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

const itemSchema = z.object({
  kind: z.enum(["product", "combo"]),
  id: idSchema,
  add: z.boolean().optional(),
});

const mergeSchema = z.object({ ids: z.array(idSchema).max(200) });

async function readLists(userId: string) {
  const doc = await WishlistModel.findOne({ userId }).lean();
  return {
    productIds: (doc?.productIds ?? []) as string[],
    comboIds: (doc?.comboIds ?? []) as string[],
  };
}

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    if (!hasDB()) return ok({ productIds: [], comboIds: [] });

    await connectDB();
    return ok(await readLists(extractUserId(session!)));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const parsed = itemSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid request");
    if (!hasDB()) return ok({ added: parsed.data.add ?? true });

    const userId = extractUserId(session!);
    const { kind, id } = parsed.data;
    const field = kind === "product" ? "productIds" : "comboIds";

    await connectDB();
    const lists = await readLists(userId);
    const present = (lists[field] as string[]).includes(id);
    const shouldAdd = parsed.data.add ?? !present;

    await WishlistModel.updateOne(
      { userId },
      shouldAdd ? { $addToSet: { [field]: id } } : { $pull: { [field]: id } },
      { upsert: true },
    );
    return ok({ added: shouldAdd });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const parsed = mergeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid request");
    if (!hasDB()) return ok({ productIds: [], comboIds: [] });

    const userId = extractUserId(session!);
    await connectDB();

    // Only ids that exist in the live catalog are kept; unknown/stale ids are dropped.
    const [products, combos] = await Promise.all([
      getProductsByIds(parsed.data.ids),
      getCombosByIds(parsed.data.ids),
    ]);

    await WishlistModel.updateOne(
      { userId },
      {
        $addToSet: {
          productIds: { $each: products.map((p) => p.id) },
          comboIds: { $each: combos.map((c) => c.id) },
        },
      },
      { upsert: true },
    );
    return ok(await readLists(userId));
  } catch (err) {
    return serverError(err);
  }
}
