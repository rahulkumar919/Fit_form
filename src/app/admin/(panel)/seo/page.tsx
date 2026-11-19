import Link from "next/link";
import { getSeoStats } from "@/services/admin";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function ScoreRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-5xl font-bold tabular-nums ${color}`}>{pct}%</div>
      <p className="text-xs text-sky-950/60">SEO completeness</p>
      <p className="text-[10px] text-sky-950/40">(products with all SEO fields filled)</p>
    </div>
  );
}

function StatRow({ label, value, bad, link }: { label: string; value: number; bad?: boolean; link?: string }) {
  const content = (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-sky-950/80">{label}</span>
      <span className={`font-semibold tabular-nums ${bad && value > 0 ? "text-red-600" : "text-sky-950"}`}>
        {value}
        {bad && value > 0 && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">fix</span>
        )}
      </span>
    </div>
  );
  return link ? (
    <Link href={link} className="block hover:bg-sky-50/60 -mx-2 px-2 rounded-lg transition-colors">{content}</Link>
  ) : (
    <div className="-mx-2 px-2">{content}</div>
  );
}

export default async function SeoPage() {
  const stats = await getSeoStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sky-950">SEO Dashboard</h1>
        <p className="text-sm text-sky-950/70">
          Overview of product SEO completeness and technical SEO health.
          Scores reflect data completeness — not Google rankings.
        </p>
      </div>

      {/* Score + quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard className="flex items-center justify-center p-6">
          <ScoreRing pct={stats.completePct} />
        </AdminCard>

        <AdminCard className="p-5 sm:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-sky-950">Technical checks</h2>
          <div className="divide-y divide-sky-950/8">
            <StatRow label="Total active products" value={stats.totalActive} />
            <StatRow label="Missing SEO title" value={stats.missingSeotitle} bad link="/admin/products" />
            <StatRow label="Missing meta description" value={stats.missingSeoDescription} bad link="/admin/products" />
            <StatRow label="Missing product description" value={stats.missingDescription} bad link="/admin/products" />
            <StatRow label="Missing product images" value={stats.missingImages} bad link="/admin/products" />
            <StatRow label="Duplicate SEO titles" value={stats.duplicateSeoTitles} bad link="/admin/products" />
            <StatRow label="Duplicate meta descriptions" value={stats.duplicateSeoDescriptions} bad link="/admin/products" />
          </div>
        </AdminCard>
      </div>

      {/* Technical resources */}
      <AdminCard className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-sky-950">Technical resources</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Sitemap XML", href: siteUrl("/sitemap.xml"), hint: "Submit to Google & Bing" },
            { label: "Robots.txt", href: siteUrl("/robots.txt"), hint: "Crawler rules" },
            { label: "LLMs.txt", href: siteUrl("/llms.txt"), hint: "AI search guide" },
            { label: "Rich Results Test", href: "https://search.google.com/test/rich-results", hint: "Google tool" },
            { label: "Schema Validator", href: "https://validator.schema.org/", hint: "schema.org tool" },
            { label: "Google Search Console", href: "https://search.google.com/search-console", hint: "Submit sitemap" },
            { label: "Bing Webmaster Tools", href: "https://www.bing.com/webmasters", hint: "Submit sitemap" },
          ].map(({ label, href, hint }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-xl border border-border bg-white/60 px-4 py-3 text-sm transition hover:border-sky-400 hover:bg-sky-50/60"
            >
              <span className="font-medium text-sky-800">{label} ↗</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </a>
          ))}
        </div>
      </AdminCard>

      {/* Products needing SEO attention */}
      {stats.issues.length > 0 && (
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>Products needing SEO attention</AdminCardTitle>
            <p className="text-xs text-sky-950/60">{stats.issues.length} product{stats.issues.length !== 1 ? "s" : ""} with incomplete SEO fields</p>
          </AdminCardHeader>
          <AdminCardContent>
            <div className="divide-y divide-sky-950/8">
              {stats.issues.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-sky-800 underline-offset-2 hover:underline truncate block"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{p.issue}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100 transition-colors"
                    >
                      Fix SEO
                    </Link>
                    <a
                      href={siteUrl(`/product/${p.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border bg-white/70 px-3 py-1 text-xs text-sky-700 hover:bg-sky-50 transition-colors"
                    >
                      View ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* Setup instructions */}
      <AdminCard className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-sky-950">Setup instructions</h2>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white/60 p-4 space-y-2">
            <p className="font-semibold text-sky-900">Google Search Console</p>
            <ol className="list-decimal pl-4 space-y-1 text-sky-950/80 text-xs">
              <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">search.google.com/search-console</a></li>
              <li>Add property → Domain → Enter <code>melamart.in</code></li>
              <li>Verify via DNS TXT record (recommended) or HTML tag</li>
              <li>If using HTML tag: copy the content value and set <code>NEXT_PUBLIC_GSC_VERIFICATION=…</code> in <code>.env.local</code></li>
              <li>Submit sitemap: <code>{siteUrl("/sitemap.xml")}</code></li>
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-white/60 p-4 space-y-2">
            <p className="font-semibold text-sky-900">Bing Webmaster Tools</p>
            <ol className="list-decimal pl-4 space-y-1 text-sky-950/80 text-xs">
              <li>Go to <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">bing.com/webmasters</a></li>
              <li>Add site → Enter <code>https://melamart.in</code></li>
              <li>Verify via XML file or meta tag</li>
              <li>Submit sitemap: <code>{siteUrl("/sitemap.xml")}</code></li>
              <li>Use IndexNow when products are added/changed for instant indexing</li>
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-white/60 p-4 space-y-2">
            <p className="font-semibold text-sky-900">OG / Social preview image</p>
            <ol className="list-decimal pl-4 space-y-1 text-sky-950/80 text-xs">
              <li>Replace <code>/public/og-default.png</code> with a 1200×630px branded image</li>
              <li>It is used as the default OG image for social shares of pages without their own image</li>
              <li>Test with <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">Facebook Debugger</a> and <a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">Twitter Card Validator</a></li>
            </ol>
          </div>
          <div className="rounded-xl border border-border bg-white/60 p-4 space-y-2">
            <p className="font-semibold text-sky-900">Environment variables</p>
            <div className="text-xs text-sky-950/80 space-y-1 font-mono">
              <p><span className="text-sky-600">NEXT_PUBLIC_APP_URL</span>=https://melamart.in</p>
              <p><span className="text-sky-600">NEXT_PUBLIC_GSC_VERIFICATION</span>=&lt;google-site-verify-code&gt;</p>
            </div>
            <p className="text-xs text-sky-950/60">Set in <code>.env.local</code> and in your hosting provider environment.</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
