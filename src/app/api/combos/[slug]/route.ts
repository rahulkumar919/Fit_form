/** GET /api/combos/[slug] — public, active combos only. */

import { NextRequest } from "next/server";
import { ok, notFound, serverError } from "@/lib/api/response";
import { getComboBySlug } from "@/services/catalog";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const combo = await getComboBySlug(slug);
    if (!combo) return notFound("Combo not found");
    return ok(combo);
  } catch (err) {
    return serverError(err);
  }
}
