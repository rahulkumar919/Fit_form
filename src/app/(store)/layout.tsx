import { AnnouncementBar, type Announcement } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Tracker } from "@/components/tracking/tracker";
import { FloatingSocial } from "@/components/layout/floating-social";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getHomepageSettings } from "@/services/homepage";
import { cashfreeConfigured } from "@/lib/payments/cashfree";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { findActiveCoupon } from "@/lib/pricing/coupons";
import { getPublicFaqs } from "@/services/faq";

const WELCOME_COUPON = "NEW10";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, welcome, layout, faqs] = await Promise.all([
    getCategories(),
    getSettings(),
    findActiveCoupon(WELCOME_COUPON).catch(() => null),
    getHomepageSettings(),
    getPublicFaqs(),
  ]);

  const nav = categories
    .filter((c) => c.showInNav !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => ({ name: c.name, slug: c.slug }));

  // Every message reflects live settings, so the bar never promises something checkout won't honour.
  const messages: Announcement[] = [];
  // Kept short so each message fits on one line on a phone.
  const shipping = settings.freeShippingThreshold > 0 ? `Free shipping over ${inr(settings.freeShippingThreshold)}` : "Free shipping";
  messages.push({ icon: "truck", text: settings.codEnabled ? `${shipping} · COD available` : shipping });
  if (welcome) messages.push({ icon: "tag", text: `${welcome.description || "Welcome offer"} · code ${welcome.code}` });
  messages.push({ icon: "sparkles", text: "New drops every week" });

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar messages={messages} />
      <Header categories={nav} />
      <main className="flex-1">{children}</main>
      <Footer
        config={layout.footer}
        faqs={faqs}
        store={{
          storeName: settings.storeName,
          freeShippingThreshold: settings.freeShippingThreshold,
          codEnabled: settings.codEnabled,
          onlinePayments: cashfreeConfigured(),
          instagramHandle: layout.instagramHandle,
          facebook: layout.social.facebook,
          youtube: layout.social.youtube,
          whatsapp: settings.supportPhone,
          supportEmail: settings.supportEmail,
        }}
      />
      <CartDrawer />
      <Tracker />
      {(layout.floating.whatsapp || layout.floating.instagram) && (
        <FloatingSocial
          whatsapp={layout.floating.whatsapp ? settings.supportPhone : ""}
          whatsappMessage={layout.floating.whatsappMessage}
          instagramHandle={layout.floating.instagram ? layout.instagramHandle : ""}
          storeName={settings.storeName}
          aboveBottomNav={layout.bottomNav.enabled}
        />
      )}
      {layout.bottomNav.enabled && <BottomNav items={layout.bottomNav.items} />}
    </div>
  );
}
