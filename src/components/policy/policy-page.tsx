import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Shared wrapper for all legal / policy pages. */
export function PolicyPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-store max-w-3xl py-10 sm:py-14">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{title}</span>
      </nav>

      <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="prose prose-sm mt-8 max-w-none text-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:font-semibold [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mt-1.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5">
        {children}
      </div>

      {/* links to other policies */}
      <div className="mt-12 border-t border-border pt-8">
        <p className="text-sm text-muted-foreground">Related policies:</p>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {[
            { label: "Contact Us", href: "/contact-us" },
    { label: "Privacy Policy", href: "/privacy" },
            { label: "Refund & Return Policy", href: "/refund-policy" },
            { label: "Shipping Policy", href: "/shipping-policy" },
            { label: "Terms & Conditions", href: "/terms" },
          ].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-full border border-border px-3 py-1.5 text-muted-foreground transition hover:border-foreground hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function generatePolicyMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: `${title} | MelaMart`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | MelaMart`, description },
    robots: { index: true, follow: true },
  };
}
