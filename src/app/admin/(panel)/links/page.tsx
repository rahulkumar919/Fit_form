import { headers } from "next/headers";
import { getLinkStats } from "@/services/analytics";
import { getAdminCombos, getPickerProducts } from "@/services/admin";
import { LinksManager } from "@/components/admin/links-manager";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const [links, products, combos, h] = await Promise.all([getLinkStats(), getPickerProducts(), getAdminCombos(), headers()]);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const destinations = [
    { label: "Homepage", path: "/" },
    { label: "All combos", path: "/combos" },
    { label: "All products", path: "/shop/all-products" },
    ...combos.filter((c) => c.isActive).map((c) => ({ label: `Combo · ${c.combo.name}`, path: `/combo/${c.combo.slug}` })),
    ...products.map((p) => ({ label: `Product · ${p.name}`, path: `/product/${p.slug}` })),
  ];
  return <LinksManager links={links} destinations={destinations} origin={origin.replace(/\/$/, "")} />;
}
