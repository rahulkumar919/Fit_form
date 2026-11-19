import { getAdminBanners, getHomepageSettings, getLiveBanners, getLiveSocialPosts } from "@/services/homepage";
import { getAllCombos, getAllProducts, getCategories } from "@/services/catalog";
import { getRecentReviews } from "@/services/reviews";
import { getSettings } from "@/services/settings";
import { cashfreeConfigured } from "@/lib/payments/cashfree";
import { HomepageBuilder } from "@/components/admin/homepage-builder";
import { categoryHref } from "@/lib/catalog-constants";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const [adminBanners, liveBanners, layout, categories, settings, products, combos, social, reviews] = await Promise.all([
    getAdminBanners(), getLiveBanners(), getHomepageSettings(), getCategories(), getSettings(),
    getAllProducts(), getAllCombos(), getLiveSocialPosts(), getRecentReviews(9),
  ]);
  const heroHighlights = [
    settings.codEnabled ? "Cash on Delivery" : "",
    settings.freeShippingThreshold > 0 ? `Free shipping over ₹${settings.freeShippingThreshold.toLocaleString("en-IN")}` : "Free shipping",
  ].filter(Boolean);
  const destinations = [
    { label: "All products", href: "/shop/all-products" },
    ...categories.map((c) => ({ label: c.name, href: categoryHref(c.slug) })),
  ].filter((d, i, a) => a.findIndex((x) => x.href === d.href) === i);

  return (
    <HomepageBuilder
      layout={layout}
      banners={adminBanners}
      phone={settings.supportPhone}
      data={{
        products, combos, categories, banners: liveBanners, social, reviews,
        instagramHandle: layout.instagramHandle, heroHighlights, freeShippingThreshold: settings.freeShippingThreshold,
      }}
      footerStore={{
        storeName: settings.storeName, freeShippingThreshold: settings.freeShippingThreshold, codEnabled: settings.codEnabled,
        onlinePayments: cashfreeConfigured(), instagramHandle: layout.instagramHandle, facebook: layout.social.facebook,
        youtube: layout.social.youtube, whatsapp: settings.supportPhone, supportEmail: settings.supportEmail,
      }}
      ctx={{
        categories, products, destinations,
        socialCount: { reels: social.filter((s) => s.showInReels).length, gallery: social.filter((s) => s.showInGallery).length },
        reviewCount: reviews.length,
      }}
    />
  );
}
