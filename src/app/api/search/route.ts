/** GET /api/search?q=term — lightweight catalog search for the header dialog */
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { searchCatalog } from "@/services/catalog";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    if (q.length > 80) return ok({ products: [], combos: [] });
    const { products, combos } = await searchCatalog(q);
    return ok({
      products: products.map((p) => ({ id: p.id, slug: p.slug, name: p.name, categoryLabel: p.categoryLabel, price: p.price, image: p.images[0] })),
      combos: combos.map((c) => ({ id: c.id, slug: c.slug, name: c.name, itemCount: c.items.length, price: c.comboPrice, image: c.images[0] })),
    });
  } catch (err) {
    return serverError(err);
  }
}
