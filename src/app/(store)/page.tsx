import type { Metadata } from "next";
import { HomeSections } from "@/components/home/home-sections";
import { getAllCombos, getAllProducts, getCategories } from "@/services/catalog";
import { getRecentReviews } from "@/services/reviews";
import { getHomepageSettings, getLiveBanners, getLiveSocialPosts } from "@/services/homepage";
import { getSettings } from "@/services/settings";
import { jsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  // No title here — the root default is used: "MelaMart — Men's Fashion Combos | Jeans, Shirts, Sneakers & More"
  description:
    "Shop complete outfit combos for men — jeans, shirts, t-shirts, sneakers, shoes & accessories. Best prices, free shipping above ₹1,999. Delivered across India.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MelaMart — Men's Fashion Combos | Jeans, Shirts, Sneakers & More",
    description: "Complete outfit combos for men at best prices. Free shipping, Cash on Delivery, easy returns.",
    url: siteUrl("/"),
    type: "website",
  },
};

// Re-render at most every 5 minutes; catalog and layout edits also revalidate on save.
export const revalidate = 300;

export default async function HomePage() {
  const [products, combos, categories, reviews, layout, banners, settings, social] = await Promise.all([
    getAllProducts(), getAllCombos(), getCategories(), getRecentReviews(9), getHomepageSettings(),
    getLiveBanners(), getSettings(), getLiveSocialPosts(),
  ]);

  // Shown on the built-in banner only until real banners exist; derived from live settings.
  const heroHighlights = [
    settings.freeShippingThreshold > 0 ? `Free shipping over ₹${settings.freeShippingThreshold.toLocaleString("en-IN")}` : "Free shipping",
    "Easy returns",
  ].filter(Boolean);

  return (
    <>
      <h1 className="sr-only">{settings.storeName}: men&apos;s outfits, combos and essentials</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": siteUrl("/#webpage"),
            name: "MelaMart — Men's Fashion Combos",
            url: siteUrl("/"),
            isPartOf: { "@id": siteUrl("/#website") },
            about: { "@id": siteUrl("/#org") },
            description:
              "Shop complete outfit combos for men — jeans, shirts, sneakers & more. Free shipping above ₹1,999.",
          }),
        }}
      />
      <HomeSections
        sections={layout.sections}
        data={{
          products, combos, categories, banners, social, reviews,
          instagramHandle: layout.instagramHandle,
          heroHighlights,
          freeShippingThreshold: settings.freeShippingThreshold,
        }}
      />
    </>
  );
}
