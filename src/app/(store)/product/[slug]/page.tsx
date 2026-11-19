import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/services/catalog";
import { getProductReviews } from "@/services/reviews";
import { getStoreInfo } from "@/services/settings";
import { ProductSection } from "@/components/home/product-section";
import { ProductDetails } from "@/components/products/product-details";
import { TrackView } from "@/components/tracking/tracker";
import { ProductReviewsSection } from "@/components/products/reviews-section";
import { breadcrumbLd, jsonLd, siteUrl } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  // Use admin-entered SEO fields when available, fall back to auto-generated
  const title = product.seoTitle?.trim()
    || `${product.name} — Buy Online India`;
  const autoDesc = `${product.description.slice(0, 115)} Buy ${product.name} online in India. Free shipping above ₹1,999. Cash on Delivery available.`;
  const desc = product.seoDescription?.trim() || autoDesc;

  // Build keyword list from real product attributes
  const keywords = [
    product.name,
    product.categoryLabel,
    ...(product.material ? [`${product.material} ${product.categoryLabel}`] : []),
    ...(product.colors.map((c) => `${c.name} ${product.categoryLabel} for men`).slice(0, 2)),
    "buy online India",
    "MelaMart",
    "men fashion India",
    "Cash on Delivery",
  ].filter(Boolean);

  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description: desc.slice(0, 155),
      type: "website",
      images: product.images.slice(0, 1).map((img) => ({ url: img, width: 800, height: 800, alt: product.name })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 155),
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, { reviews, summary }, info] = await Promise.all([getRelatedProducts(product, 8), getProductReviews(product.id), getStoreInfo()]);
  const inStock = product.variants.some((v) => v.sizes.some((s) => s.inStock && s.available > 0));

  // Structured data
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sourceRef || product.id,
    category: product.categoryLabel,
    url: siteUrl(`/product/${product.slug}`),
    brand: { "@type": "Brand", name: "MelaMart" },
    offers: {
      "@type": "Offer",
      url: siteUrl(`/product/${product.slug}`),
      priceCurrency: "INR",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "MelaMart" },
      ...(product.compareAtPrice && product.compareAtPrice > product.price
        ? { priceValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10) }
        : {}),
    },
    ...(summary.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average.toFixed(1), reviewCount: summary.count, bestRating: "5", worstRating: "1" } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: jsonLd(breadcrumbLd([
          { name: "Home", path: "/" },
          { name: product.categoryLabel, path: `/shop/${product.category}` },
          { name: product.name, path: `/product/${product.slug}` },
        ]))
      }} />
      <TrackView type="product_view" refId={product.id} value={product.price} />
      <ProductDetails product={{ ...product, rating: summary.average, reviewCount: summary.count }} info={info} />

      <section id="reviews" className="scroll-mt-24 border-t border-border bg-muted/30 py-8 sm:py-10">
        <div className="container-store">
          <h2 className="font-serif text-xl font-bold tracking-tight sm:text-2xl">
            Ratings &amp; Reviews
            {summary.count > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {summary.count} review{summary.count === 1 ? "" : "s"}
              </span>
            )}
          </h2>
          <ProductReviewsSection
            productId={product.id}
            initialReviews={reviews}
            summary={summary}
          />
        </div>
      </section>

      {related.length > 0 && (
        <section className="pb-8 sm:pb-10">
          <ProductSection
            section={{ eyebrow: "More like this", title: "You may also like", subtitle: "", perRow: 4, layout: "rail", showViewAll: true, mobileSize: "md" }}
            products={related}
            viewAllHref={`/shop/${product.category}`}
          />
        </section>
      )}
    </>
  );
}
