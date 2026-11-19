import type { Metadata } from "next";
import { ComboCard } from "@/components/combos/combo-card";
import { getAllCombos } from "@/services/catalog";
import { jsonLd, siteUrl } from "@/lib/seo";

// Title must NOT include "| MelaMart" — the root template appends it automatically
export const metadata: Metadata = {
  title: "Complete Men's Outfit Combos",
  description: "Shop complete men's fashion outfits curated into combos — jeans, shirts, tees and shoes styled together at a better price. Free shipping & Cash on Delivery.",
  alternates: { canonical: "/combos" },
  openGraph: {
    title: "Complete Men's Outfit Combos",
    description: "Head-to-toe outfits styled for you. Buy the full look and save.",
    type: "website",
  },
};

export const revalidate = 300;

export default async function CombosPage() {
  const COMBOS = await getAllCombos();

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Men's Outfit Combos",
    description: "Complete head-to-toe outfit combos for men curated by MelaMart.",
    url: siteUrl("/combos"),
    publisher: { "@id": siteUrl("/#org") },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: COMBOS.slice(0, 10).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: siteUrl(`/combo/${c.slug}`),
        name: c.name,
      })),
    },
  };

  return (
    <div className="container-store py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionLd) }} />
      {/* hero */}
      <div className="mb-8 rounded-3xl bg-foreground px-6 py-12 text-center text-background md:px-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Complete looks</p>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight md:text-5xl">Combo Collection</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-background/70">
          Head-to-toe outfits, styled by us so you don&apos;t have to think. Buy the full look and save,
          or pick just the pieces you want.
        </p>
        <p className="mt-4 text-sm">
          <span className="font-bold text-amber-300">{COMBOS.length}</span> combos · up to{" "}
          <span className="font-bold text-amber-300">₹1,300</span> savings per look
        </p>
      </div>

      {/* grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {COMBOS.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>
    </div>
  );
}
