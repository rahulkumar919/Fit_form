/** POST /api/meesho/[id]/price-check — admin records the current Meesho price + availability. */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { SupplierProductModel } from "@/models/SupplierProduct";
import { SourcePriceHistoryModel } from "@/models/SourcePriceHistory";
import { ProductModel } from "@/models/Product";
import { ok, notFound, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { sourcePriceCheckSchema } from "@/lib/validations/meesho";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = sourcePriceCheckSchema.safeParse({ ...body, supplierProductId: id });
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const supplier = await SupplierProductModel.findById(id);
    if (!supplier) return notFound("Supplier product not found");

    // keep the selling price in sync with the live product
    const product = await ProductModel.findById(supplier.productId).select("price").lean();
    const sellingPrice = (product as { price?: number } | null)?.price ?? supplier.sellingPrice;

    const oldPrice = supplier.sourcePrice;
    const newPrice = parsed.data.newSourcePrice;
    const priceChanged = oldPrice !== newPrice;
    const now = new Date();

    supplier.sourcePrice = newPrice;
    supplier.sellingPrice = sellingPrice;
    supplier.estimatedProfit = sellingPrice - newPrice - supplier.handlingCost - supplier.deliveryCost - supplier.otherCost;
    supplier.available = parsed.data.available;
    supplier.lastPriceChecked = now;
    supplier.lastAvailabilityChecked = now;
    supplier.status = !parsed.data.available ? "out_of_stock" : priceChanged ? "price_changed" : "linked";
    await supplier.save();

    await SourcePriceHistoryModel.create({ supplierProductId: id, sourcePrice: newPrice, date: now, note: parsed.data.note });
    await logAdminAction(session!, "meesho.check", "supplier", id, `${supplier.productName}: ₹${oldPrice} → ₹${newPrice}, ${parsed.data.available ? "available" : "unavailable"}`);

    return ok({ priceChanged, oldPrice, newPrice, estimatedProfit: supplier.estimatedProfit, status: supplier.status });
  } catch (err) {
    return serverError(err);
  }
}
