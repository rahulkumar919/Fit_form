/** PUT /api/admin/settings — save store settings (admin only). */

import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { badRequest, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { saveSettings } from "@/services/settings";
import { availableProviders } from "@/lib/storage";

const partialCodSchema = z.object({
  enabled: z.boolean(),
  advanceType: z.enum(["percentage", "fixed"]),
  advanceValue: z.number().min(1).max(100000),
  minOrderAmount: z.number().int().min(0),
  maxOrderAmount: z.number().int().min(0),
  minAdvanceAmount: z.number().int().min(0),
});

const schema = z.object({
  storeName: z.string().trim().min(2).max(60),
  supportEmail: z.union([z.literal(""), z.string().trim().email()]),
  supportPhone: z.string().trim().max(20).regex(/^[+\d\s-]*$/, "Digits, spaces, + and - only"),
  whatsappButton: z.boolean().optional().default(false),
  codEnabled: z.boolean(),
  activeGateway: z.enum(["cashfree", "razorpay", "none"]),
  freeShippingThreshold: z.number().int().min(0).max(100000),
  flatShipping: z.number().int().min(0).max(5000),
  defaultStorage: z.enum(["server", "cloudinary"]),
  partialCod: partialCodSchema.optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    if (!availableProviders().includes(parsed.data.defaultStorage)) return badRequest("Cloudinary is not configured");

    // Validate partialCod logic
    const pc = parsed.data.partialCod;
    if (pc?.enabled) {
      if (pc.advanceType === "percentage" && pc.advanceValue > 100) {
        return badRequest("Advance percentage cannot exceed 100%");
      }
      if (pc.maxOrderAmount > 0 && pc.minOrderAmount > pc.maxOrderAmount) {
        return badRequest("Minimum order amount cannot exceed maximum order amount");
      }
    }

    await saveSettings(parsed.data as Parameters<typeof saveSettings>[0]);
    await logAdminAction(session!, "settings.update", "settings", "store", "Updated store settings");
    revalidatePath("/", "layout");
    return ok(parsed.data);
  } catch (err) {
    return serverError(err);
  }
}
