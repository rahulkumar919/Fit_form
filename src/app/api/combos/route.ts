/** GET /api/combos?trending=true — public, active combos only. Writes live under /api/admin/combos. */

import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { getAllCombos } from "@/services/catalog";

export async function GET(req: NextRequest) {
  try {
    const trending = new URL(req.url).searchParams.get("trending") === "true";
    const combos = await getAllCombos();
    return ok(trending ? combos.filter((c) => c.isTrending) : combos);
  } catch (err) {
    return serverError(err);
  }
}
