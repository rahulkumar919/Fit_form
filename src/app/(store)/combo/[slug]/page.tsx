import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getComboBySlug, getComboProducts, getRelatedCombos, getAllProducts } from "@/services/catalog";
import { ComboBuilder } from "@/components/combos/combo-builder";
import { ComboCard } from "@/components/combos/combo-card";
import { ProductSection } from "@/components/home/product-section";
import { TrackView } from "@/components/tracking/tracker";
import { breadcrumbLd, jsonLd, siteUrl } from "@/lib/seo";
import { getStoreInfo } from "@/services/settings";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const combo = await getComboBySlug(slug);
  if (!combo) return { title: "Combo not found" };

  // Title: let root template append "| MelaMart" — do NOT add it manually
  const title = `${combo.name} — Complete Outfit Combo`;
  const itemNames = combo.items.map((i) => i.name).slice(0, 3).join(", ");
  const desc = `${combo.tagline || combo.description.slice(0, 100)} Complete men's look includes: ${itemNames}. Cash on Delivery. Free shipping above ₹1,999.`;

  return {
    title,
    description: desc.slice(0, 160),
    keywords: [combo.name, "outfit combo", "men fashion combo India", "complete look men", "buy online India", "MelaMart"],
    alternates: { canonical: `/combo/${combo.slug}` },
    openGraph: {
      title,
      description: desc.slice(0, 155),
      type: "website",
      images: combo.images.slice(0, 1).map((img) => ({ url: img, width: 800, height: 800, alt: combo.name })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 155),
      images: combo.images.slice(0, 1),
    },
  };
}

export default async function ComboPage({ params }: Props) {
  const { slug } = await params;
  const combo = await getComboBySlug(slug);
  if (!combo) notFound();
  const [products, info] = await Promise.all([getComboProducts(combo), getStoreInfo()]);
  const [relatedCombos, allProducts] = await Promise.all([
    getRelatedCombos(combo, 4),
    getAllProducts(),
  ]);
  // Products that appear in this combo's categories (but not in this combo itself)
  const comboProductIds = new Set(combo.items.map((i) => i.productId));
  const comboCategories = new Set(combo.items.map((i) => i.category ?? ""));
  const relatedProducts = allProducts
    .filter((p) => !comboProductIds.has(p.id) && comboCategories.has(p.category))
    .slice(0, 8);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: combo.name,
    image: combo.images,
    description: combo.description,
    sku: combo.id,
    url: siteUrl(`/combo/${combo.slug}`),
    brand: { "@type": "Brand", name: "MelaMart" },
    offers: {
      "@type": "Offer",
      url: siteUrl(`/combo/${combo.slug}`),
      priceCurrency: "INR",
      price: combo.comboPrice,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "MelaMart" },
    },
    ...(combo.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: combo.rating.toFixed(1), reviewCount: combo.reviewCount, bestRating: "5", worstRating: "1" } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([productLd, breadcrumbLd([
        { name: "Home", path: "/" }, { name: "Combos", path: "/combos" }, { name: combo.name, path: `/combo/${combo.slug}` },
      ])]) }} />
      <TrackView type="combo_view" refId={combo.id} value={combo.comboPrice} />
      <ComboBuilder combo={combo} products={products} info={info} />

      {relatedCombos.length > 0 && (
        <section className="container-store py-8 sm:py-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sale">More combos</p>
              <h2 className="font-serif text-2xl font-bold tracking-tight">Similar looks</h2>
            </div>
            <a href="/combos" className="shrink-0 text-sm font-medium underline-offset-4 hover:underline">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {relatedCombos.map((c) => <ComboCard key={c.id} combo={c} />)}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="pb-10">
          <ProductSection
            section={{ eyebrow: "Shop the look", title: "Individual pieces", subtitle: "Buy any item from this combo separately.", perRow: 4, layout: "rail", showViewAll: true, mobileSize: "md" }}
            products={relatedProducts}
            viewAllHref="/shop/all-products"
          />
        </section>
      )}
    </>
  );
}
