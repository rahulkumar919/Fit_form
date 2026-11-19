import * as React from "react";
import type { Category, Combo, Product } from "@/types";
import type { HomeSection } from "@/lib/validations/homepage";
import {
  fillTokens, productsViewAllHref, selectCombos, selectHomeCategories, selectProducts,
  type BannerView, type SocialView,
} from "@/lib/homepage";
import { HeroCarousel } from "./hero-carousel";
import { ShopByCategory } from "./shop-by-category";
import { TrendingCombos } from "./trending-combos";
import { ProductSection } from "./product-section";
import { PromoBanners } from "./promo-banners";
import { FeaturesStrip } from "./features-strip";
import { ShopTheReel } from "./shop-the-reel";
import { InstagramGallery } from "./instagram-gallery";
import { CustomerReviews, type HomeReview } from "./customer-reviews";
import { Newsletter } from "./newsletter";

export interface HomeData {
  products: Product[];
  combos: Combo[];
  categories: Category[];
  banners: BannerView[];
  social: SocialView[];
  reviews: HomeReview[];
  instagramHandle: string;
  heroHighlights: string[];
  freeShippingThreshold: number;
}

/** Renders one section. Shared by the storefront and the admin builder preview (so they always match). */
export function RenderSection({ section: s, data: d, preview = false }: { section: HomeSection; data: HomeData; preview?: boolean }) {
  switch (s.type) {
    case "hero":
      return (
        <section aria-label="Featured" className="px-2 pt-2 sm:px-4 sm:pt-4 md:px-6 md:pt-5 lg:px-10 lg:pt-6 xl:px-16">
          {/* max-w-6xl keeps the banner contained on ultra-wide screens — Floriwish style */}
          <div className="mx-auto w-full max-w-6xl">
            <HeroCarousel banners={d.banners} autoplaySeconds={s.autoplaySeconds} height={s.height} mobileAspect={s.mobileAspect} fallback={{ highlights: d.heroHighlights }} preview={preview} />
          </div>
        </section>
      );
    case "promo":
      return <PromoBanners section={s} preview={preview} />;
    case "categories":
      return <ShopByCategory categories={selectHomeCategories(d.categories, s.count, s.slugs)} config={s} />;
    case "products":
      return <ProductSection section={s} products={selectProducts(s, d.products)} viewAllHref={productsViewAllHref(s)} />;
    case "combos":
      return <TrendingCombos combos={selectCombos(s, d.combos)} config={s} />;
    case "features":
      return <FeaturesStrip style={s.style} items={s.items.map((f) => ({ ...f, title: fillTokens(f.title, d), text: fillTokens(f.text, d) }))} />;
    case "reels":
      return <ShopTheReel posts={d.social} config={s} handle={d.instagramHandle} preview={preview} />;
    case "gallery":
      return <InstagramGallery posts={d.social} config={s} handle={d.instagramHandle} />;
    case "reviews":
      return <CustomerReviews reviews={d.reviews.slice(0, s.count)} eyebrow={s.eyebrow} title={s.title} />;
    case "newsletter":
      return <Newsletter title={s.title} subtitle={s.subtitle} preview={preview} />;
  }
}

export function HomeSections({ sections, data }: { sections: HomeSection[]; data: HomeData }) {
  return (
    <>
      {sections.filter((s) => s.enabled).map((s) => (
        <RenderSection key={s.id} section={s} data={data} />
      ))}
    </>
  );
}
