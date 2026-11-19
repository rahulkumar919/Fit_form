/**
 * GET  /api/meesho   — list supplier products (admin)
 * POST /api/meesho   — add supplier product link (admin)
 */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { SupplierProductModel } from "@/models/SupplierProduct";
import { SourcePriceHistoryModel } from "@/models/SourcePriceHistory";
import { ok, created, serverError, zodError, badRequest } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { supplierProductSchema } from "@/lib/validations/meesho";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    if (hasDB()) {
      await connectDB();
      const products = await SupplierProductModel.find().sort({ updatedAt: -1 }).lean();
      return ok(products);
    }

    return ok([]);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const parsed = supplierProductSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();

    const existing = await SupplierProductModel.findOne({ productId: parsed.data.productId });
    if (existing) return badRequest("This product already has a Meesho source link");

    // Auto-calculate profit
    const { sourcePrice, sellingPrice, handlingCost, deliveryCost, otherCost } = parsed.data;
    const estimatedProfit = sellingPrice - sourcePrice - handlingCost - deliveryCost - otherCost;

    const supplier = await SupplierProductModel.create({ ...parsed.data, estimatedProfit });

    // Record initial price in history
    await SourcePriceHistoryModel.create({
      supplierProductId: supplier._id,
      sourcePrice,
      note: "Initial source price",
    });

    return created(supplier);
  } catch (err) {
    return serverError(err);
  }
}
