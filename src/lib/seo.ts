/** Small SEO helpers shared by pages. */

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** Serialize JSON-LD safely for a <script> tag (no closing-tag injection). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}

/** Real values only: treat the .env placeholders as "not configured". */
export function configured(value: string | undefined, placeholder: RegExp): string | null {
  if (!value || placeholder.test(value)) return null;
  return value;
}
