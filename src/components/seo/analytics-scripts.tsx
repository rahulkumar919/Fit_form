import Script from "next/script";
import { configured } from "@/lib/seo";

/** Google Analytics 4. Loads only when a real NEXT_PUBLIC_GA4_ID is set. */
export function AnalyticsScripts() {
  const ga = configured(process.env.NEXT_PUBLIC_GA4_ID, /X{4,}/);
  if (!ga || !/^G-[A-Z0-9]+$/.test(ga)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
