import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategory, getProductsByCategory } from "@/services/catalog";
import { ShopExplorer } from "@/components/products/shop-explorer";
import { breadcrumbLd, jsonLd, siteUrl } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };

  // Friendly fallback description when admin hasn't set one
  const autoDesc = `Shop ${category.name} for men at MelaMart. Free shipping above ₹1,999, Cash on Delivery across India.`;
  const desc = category.description?.trim() || autoDesc;

  return {
    title: category.name,
    description: desc,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title: `${category.name} — Shop Online`,
      description: desc.slice(0, 155),
      type: "website",
      ...(category.image ? { images: [{ url: category.image, alt: category.name }] } : {}),
    },
    // empty categories are thin pages: keep them out of the index
    robots: category.productCount > 0 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function ShopPage({ params }: Props) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const products = await getProductsByCategory(slug);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} for Men`,
    description: category.description || `Shop ${category.name} for men at MelaMart.`,
    url: siteUrl(`/shop/${category.slug}`),
    publisher: { "@id": siteUrl("/#org") },
    ...(products.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 10).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: siteUrl(`/product/${p.slug}`),
              name: p.name,
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd([
        { name: "Home", path: "/" }, { name: category.name, path: `/shop/${category.slug}` },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionLd) }} />
      <ShopExplorer products={products} category={category} />
    </>
  );
}
