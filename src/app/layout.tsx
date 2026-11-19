import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { StoreProvider } from "@/lib/store/store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsScripts } from "@/components/seo/analytics-scripts";
import { configured, jsonLd, siteUrl } from "@/lib/seo";
import { getSettings } from "@/services/settings";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const gsc = configured(process.env.NEXT_PUBLIC_GSC_VERIFICATION, /^$/);

export const metadata: Metadata = {
  title: {
    default: "MelaMart — Men's Fashion Combos | Jeans, Shirts, Sneakers & More",
    template: "%s | MelaMart",
  },
  description:
    "Shop complete outfit combos for men — jeans, shirts, t-shirts, sneakers, shoes & accessories. Best prices, Cash on Delivery, free shipping above ₹1,999. Delivered across India.",
  keywords: [
    "men's fashion combos", "outfit combos for men", "men jeans online India", "men shirts online",
    "men sneakers India", "buy clothes online India", "MelaMart", "melamart.in",
    "men fashion India", "affordable men clothing", "complete look men",
  ],
  metadataBase: new URL(siteUrl()),
  alternates: { canonical: "/" },
  openGraph: {
    title: "MelaMart — Men's Fashion Combos | Jeans, Shirts, Sneakers & More",
    description: "Complete outfit combos for men at best prices. Free shipping, Cash on Delivery, easy returns.",
    type: "website",
    siteName: "MelaMart",
    locale: "en_IN",
    url: siteUrl("/"),
    images: [{ url: siteUrl("/og-default.png"), width: 1200, height: 630, alt: "MelaMart — Men's Fashion Combos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MelaMart — Men's Fashion Combos",
    description: "Complete outfit combos for men at best prices. Free shipping across India.",
    images: [siteUrl("/og-default.png")],
  },
  robots: { index: true, follow: true },
  ...(gsc ? { verification: { google: gsc } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
  colorScheme: "light dark",
};

const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": siteUrl("/#org"),
      name: "MelaMart",
      url: siteUrl("/"),
      logo: { "@type": "ImageObject", url: siteUrl("/logo.png") },
      description: "Men's fashion combos — complete outfits at the best prices, delivered across India.",
      sameAs: ["https://www.instagram.com/melamart.in/", "https://www.facebook.com/melamart.in/"],
    },
    {
      "@type": "WebSite",
      "@id": siteUrl("/#website"),
      name: "MelaMart",
      url: siteUrl("/"),
      publisher: { "@id": siteUrl("/#org") },
      inLanguage: "en-IN",
      potentialAction: { "@type": "SearchAction", target: siteUrl("/shop/all-products?q={search_term_string}"), "query-input": "required name=search_term_string" },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgLd) }} />
        <SessionProvider>
          <StoreProvider shippingRules={{ threshold: settings.freeShippingThreshold, flat: settings.flatShipping }}>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <Toaster />
          </StoreProvider>
        </SessionProvider>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
