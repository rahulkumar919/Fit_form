import Link from "next/link";
import type { FooterConfig, FeatureItem } from "@/lib/validations/homepage";
import { fillTokens } from "@/lib/homepage";
import { FEATURE_ICON_MAP } from "@/components/home/features-strip";
import { MelaLogo } from "@/components/icons/logo";
import { InstagramIcon } from "@/components/icons/instagram";
import { cn } from "@/lib/utils";
import { FooterFaq } from "@/components/faq/footer-faq";
import type { FaqItem } from "@/components/faq/faq-section";

export interface FooterStore {
  storeName: string;
  freeShippingThreshold: number;
  codEnabled: boolean;
  onlinePayments: boolean;
  instagramHandle: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  supportEmail: string;
}

/** Policy pages always shown in the bottom strip. */
const POLICY_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund & Returns", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "FAQ", href: "#faq" },
];

function TrustFeature({ item, store }: { item: FeatureItem; store: FooterStore }) {
  const Icon = FEATURE_ICON_MAP[item.icon];
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground/8">
        <Icon className="size-5 text-foreground" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{fillTokens(item.title, store)}</p>
        {item.text && <p className="text-xs text-muted-foreground">{fillTokens(item.text, store)}</p>}
      </div>
    </div>
  );
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (new tab)`}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-foreground hover:bg-muted hover:text-foreground">
      {children}
    </a>
  );
}

const FbIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
  </svg>
);
const YtIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);
const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" />
  </svg>
);

/** Store footer. Desktop: side-by-side grid. Mobile: clean stacked layout. */
export function Footer({
  config: c,
  store: s,
  faqs = [],
}: {
  config: FooterConfig;
  store: FooterStore;
  faqs?: FaqItem[];
}) {
  const wa = s.whatsapp.replace(/\D/g, "");

  const socials: { label: string; href: string; icon: React.ReactNode }[] = [
    ...(s.instagramHandle ? [{ label: "Instagram", href: `https://www.instagram.com/${s.instagramHandle}/`, icon: <InstagramIcon className="size-4" /> }] : []),
    ...(s.facebook ? [{ label: "Facebook", href: s.facebook, icon: <FbIcon /> }] : []),
    ...(s.youtube ? [{ label: "YouTube", href: s.youtube, icon: <YtIcon /> }] : []),
    ...(wa.length >= 10 ? [{ label: "WhatsApp", href: `https://wa.me/${wa}`, icon: <WaIcon /> }] : []),
  ];

  const payments = [
    ...(s.onlinePayments ? ["UPI", "Visa / MC", "Net Banking", "Cashfree"] : []),
    ...(s.codEnabled ? ["Cash on Delivery"] : []),
  ];

  // Limit to 3 link columns so the layout always fits
  const cols = c.columns.slice(0, 3);

  /* Desktop grid: [brand col] [link cols…] — the class is explicit so Tailwind can see it. */
  const gridCls =
    cols.length === 3 ? "lg:grid-cols-[260px_repeat(3,minmax(0,1fr))]"
    : cols.length === 2 ? "lg:grid-cols-[260px_repeat(2,minmax(0,1fr))]"
    : cols.length === 1 ? "lg:grid-cols-[260px_1fr]"
    : "lg:grid-cols-1";

  return (
    <>
      {faqs && faqs.length > 0 && <FooterFaq faqs={faqs} />}
      <footer className="border-t border-border bg-background">

      {/* ── trust strip (4 perks in a grid) ── */}
      {c.showFeatures && c.features.length > 0 && (
        <div className="border-b border-border bg-muted/30">
          <div className="container-store grid grid-cols-2 gap-4 py-6 md:grid-cols-4 md:py-8">
            {c.features.map((f, i) => (
              <TrustFeature key={i} item={f} store={s} />
            ))}
          </div>
        </div>
      )}

      {/* ── main section ── */}
      <div className="container-store py-10 md:py-14">
        <div className={cn("grid gap-8 md:gap-10", gridCls)}>

          {/* brand + contact + social */}
          <div className="flex flex-col gap-4">
            <Link href="/" aria-label="MelaMart — homepage" className="w-fit">
              <MelaLogo className="h-11 w-auto" />
            </Link>

            {c.tagline && (
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {fillTokens(c.tagline, s)}
              </p>
            )}

            {s.supportEmail && (
              <a href={`mailto:${s.supportEmail}`}
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                <EmailIcon /> {s.supportEmail}
              </a>
            )}

            {wa.length >= 10 && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                <WaIcon /> {s.whatsapp}
              </a>
            )}

            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Social links">
                {socials.map((x) => (
                  <li key={x.label}>
                    <SocialBtn href={x.href} label={x.label}>{x.icon}</SocialBtn>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* link columns */}
          {cols.map((col, i) => (
            <nav key={i} aria-label={col.title}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground/80">
                {col.title}
              </h2>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <Link href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── policy links row ── */}
        <nav aria-label="Legal" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6">
          {POLICY_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── bottom bar ── */}
      <div className="border-t border-border bg-muted/20">
        <div className="container-store flex flex-col items-center justify-between gap-3 py-4 sm:flex-row">
          <p className="text-[11px] text-muted-foreground">
            {c.copyright || `© ${new Date().getFullYear()} ${s.storeName}. All rights reserved.`}
          </p>

          {c.showPayments && payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="Payment methods">
              {payments.map((p) => (
                <li key={p}
                  className="rounded border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </footer>
    </>
  );
}
