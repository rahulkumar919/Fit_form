"use client";

import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MousePointerClick, ShoppingBag, TrendingUp, Users, Wallet, Eye } from "lucide-react";
import type { AnalyticsData } from "@/services/analytics";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatINR } from "@/lib/utils";

const RANGES = [7, 30, 90];

function Stat({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-sky-950/70">
        <Icon className="size-4" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-sky-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-sky-950/65">{hint}</p>}
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
      <div className={cn("h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-700", className)} style={{ width: `${w}%` }} />
    </div>
  );
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const t = data.totals;
  const empty = t.sessions === 0 && t.orders === 0 && t.clicks === 0;
  const funnelTop = data.funnel[0]?.sessions ?? 0;
  const maxLanding = Math.max(0, ...data.landing.map((l) => l.sessions));
  const maxViewed = Math.max(0, ...data.topViewed.map((l) => l.views));
  const deviceTotal = data.devices.reduce((a, d) => a + d.sessions, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Traffic &amp; sales analytics</h1>
          <p className="text-sm text-sky-950/70">Where visitors come from and which sources turn into orders.</p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Date range">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              aria-current={data.days === d ? "true" : undefined}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium", data.days === d ? "glass-pill-active" : "glass-icon text-sky-950/75")}
            >
              {d} days
            </Link>
          ))}
        </div>
      </div>

      {empty && (
        <div className="glass rounded-2xl p-5 text-sm text-sky-950/80">
          No traffic recorded in this period yet. Visits are counted automatically once people open the store.
          Create a <Link href="/admin/links" className="font-semibold underline">tracked link</Link> for each reel, DM or WhatsApp message to see exactly which ones sell.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat icon={Users} label="Sessions" value={t.sessions.toLocaleString("en-IN")} />
        <Stat icon={Eye} label="Visitors" value={t.visitors.toLocaleString("en-IN")} hint="unique devices" />
        <Stat icon={MousePointerClick} label="Link clicks" value={t.clicks.toLocaleString("en-IN")} hint="tracked links" />
        <Stat icon={ShoppingBag} label="Orders" value={t.orders.toLocaleString("en-IN")} />
        <Stat icon={Wallet} label="Revenue" value={formatINR(t.revenue)} hint={t.orders ? `AOV ${formatINR(t.aov)}` : undefined} />
        <Stat icon={TrendingUp} label="Conversion" value={`${t.conversion}%`} hint="orders ÷ sessions" />
      </div>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Sessions &amp; orders per day</AdminCardTitle></AdminCardHeader>
        <AdminCardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(3,105,161,0.12)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#075985" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#075985" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.92)" }} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#0284c7" strokeWidth={2} fill="url(#sess)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#0e7490" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Traffic sources</AdminCardTitle></AdminCardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Added to bag</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bySource.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-sky-950/65">No traffic yet.</TableCell></TableRow>
              )}
              {data.bySource.map((r) => (
                <TableRow key={r.source}>
                  <TableCell className="font-medium text-sky-950">{r.label}</TableCell>
                  <TableCell className="text-right">{r.sessions}</TableCell>
                  <TableCell className="text-right">{r.visitors}</TableCell>
                  <TableCell className="text-right">{r.addToCart}</TableCell>
                  <TableCell className="text-right font-semibold">{r.orders}</TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(r.revenue)}</TableCell>
                  <TableCell className="text-right">{r.conversion}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="px-5 pb-4 text-xs text-sky-950/65">
          Orders are credited to the last non-direct source within 30 days (e.g. a reel link clicked on Monday still gets credit for a Wednesday order).
        </p>
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <AdminCardHeader><AdminCardTitle>Shopping funnel</AdminCardTitle></AdminCardHeader>
          <AdminCardContent className="space-y-3">
            {data.funnel.map((s, i) => (
              <div key={s.step}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-sky-950">{s.step}</span>
                  <span className="font-semibold text-sky-950">
                    {s.sessions}
                    {i > 0 && funnelTop > 0 && <span className="ml-2 text-xs font-normal text-sky-950/65">{Math.round((s.sessions / funnelTop) * 100)}%</span>}
                  </span>
                </div>
                <Bar value={s.sessions} max={funnelTop} />
              </div>
            ))}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader><AdminCardTitle>Campaigns</AdminCardTitle></AdminCardHeader>
          <AdminCardContent>
            {data.campaigns.length === 0 ? (
              <p className="text-sm text-sky-950/65">No campaign traffic yet. Give your tracked links a campaign name (e.g. “diwali-sale”) to group them.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.campaigns.map((c) => (
                  <li key={c.campaign} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-sky-950">{c.campaign}</span>
                    <span className="shrink-0 text-sky-950/75">{c.sessions} sessions · {c.orders} orders · <b>{formatINR(c.revenue)}</b></span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader><AdminCardTitle>Top landing pages</AdminCardTitle></AdminCardHeader>
          <AdminCardContent className="space-y-3">
            {data.landing.length === 0 && <p className="text-sm text-sky-950/65">No data yet.</p>}
            {data.landing.map((l) => (
              <div key={l.path}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate font-mono text-xs text-sky-950">{l.path}</span>
                  <span className="font-semibold">{l.sessions}</span>
                </div>
                <Bar value={l.sessions} max={maxLanding} />
              </div>
            ))}
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader><AdminCardTitle>Most viewed</AdminCardTitle></AdminCardHeader>
          <AdminCardContent className="space-y-3">
            {data.topViewed.length === 0 && <p className="text-sm text-sky-950/65">No product views yet.</p>}
            {data.topViewed.map((v) => (
              <div key={v.name + v.kind}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate text-sky-950">{v.name} <span className="text-xs text-sky-950/60">{v.kind}</span></span>
                  <span className="font-semibold">{v.views}</span>
                </div>
                <Bar value={v.views} max={maxViewed} />
              </div>
            ))}
            {deviceTotal > 0 && (
              <div className="border-t border-sky-950/10 pt-3 text-sm text-sky-950/80">
                Devices:{" "}
                {data.devices.map((d) => `${d.device} ${Math.round((d.sessions / deviceTotal) * 100)}%`).join(" · ")}
              </div>
            )}
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  );
}
