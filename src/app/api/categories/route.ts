import { getCategories } from "@/services/catalog";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  try {
    return ok(await getCategories());
  } catch (err) {
    return serverError(err);
  }
}
