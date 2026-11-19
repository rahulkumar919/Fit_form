/** PUT /api/admin/homepage — save the homepage builder layout (sections, footer, social, floating buttons). */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { badRequest, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { homepageSettingsSchema } from "@/lib/validations/homepage";
import { afterHomepageChange, saveHomepageSettings } from "@/services/homepage";
import { getSettings } from "@/services/settings";

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = homepageSettingsSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const v = parsed.data;
    if (v.floating.whatsapp && (await getSettings()).supportPhone.replace(/\D/g, "").length < 10) {
      return badRequest("Add your WhatsApp number in Admin → Settings first, then turn on the WhatsApp button");
    }
    await saveHomepageSettings(v);
    const on = v.sections.filter((s) => s.enabled).map((s) => s.type);
    await logAdminAction(session!, "homepage.update", "settings", "homepage", `Layout: ${on.join(" › ") || "empty"}`);
    await afterHomepageChange();
    // Footer and floating buttons live in the store layout, used on every page.
    revalidatePath("/", "layout");
    return ok(v);
  } catch (err) {
    return serverError(err);
  }
}
