/** GET /api/catalog/lookup?ids=a,b,c — products and combos by id (wishlist) */
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { getCombosByIds, getProductsByIds } from "@/services/catalog";

export async function GET(req: NextRequest) {
  try {
    const raw = new URL(req.url).searchParams.get("ids") ?? "";
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
    const [products, combos] = await Promise.all([getProductsByIds(ids), getCombosByIds(ids)]);
    return ok({ products, combos });
  } catch (err) {
    return serverError(err);
  }
}
