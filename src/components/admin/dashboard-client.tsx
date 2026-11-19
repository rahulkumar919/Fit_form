"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MoreHorizontal, Plus, ArrowRight, ChevronDown, ShoppingBag, CreditCard,
  Undo2, TrendingUp, TrendingDown, Package,
} from "lucide-react";
import type { DashboardData } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { formatINR, cn } from "@/lib/utils";

type Period = "Daily" | "Weekly" | "Monthly";

function DCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass rounded-2xl", className)}>{children}</div>
  );
}

function WCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass-strong rounded-2xl", className)}>{children}</div>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#082f49] px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-sky-950">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: {p.dataKey === "sales" ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function DashboardClient({ data, adminName }: { data: DashboardData; adminName: string }) {
  const [period, setPeriod] = React.useState<Period>("Weekly");
  const [query, setQuery] = React.useState("");

  const chartData =
    period === "Daily" ? data.series.day : period === "Weekly" ? data.series.week : data.series.month;
  const chartHasData = chartData.some((p) => p.sales > 0 || p.orders > 0);

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const rows = data.products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-sky-950">Hello {adminName.split(" ")[0]}!</h1>
          <p className="text-sm text-sky-950/70">
            Live data as of <span className="font-semibold text-sky-950/80">{monthLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["Daily", "Weekly", "Monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                period === p ? "glass-pill-active" : "text-sky-950/70 hover:bg-white/40 hover:text-sky-950",
              )}
            >
              {p}
            </button>
          ))}
          <Button asChild size="sm" className="btn-glass ml-2 h-8 gap-1.5 text-xs">
            <Link href="/admin/products/new"><Plus className="size-3.5" /> Add Product</Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.kpis.map((k) => {
          const up = k.trend === "up";
          const down = k.trend === "down";
          return (
            <DCard key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-medium uppercase tracking-widest text-sky-950/70">{k.label}</p>
                <MoreHorizontal className="size-4 text-sky-950/65" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-sky-950">{k.value}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {(up || down) && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      up ? "bg-emerald-600/15 text-sky-800" : "bg-red-600/15 text-red-700",
                    )}
                  >
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {up ? "+" : ""}{k.delta}%
                  </span>
                )}
                <span className="text-[10px] uppercase text-sky-950/65">{k.hint}</span>
              </div>
            </DCard>
          );
        })}
      </div>

      {/* Chart + products */}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <WCard className="flex flex-col">
          <div className="flex items-center justify-between border-b border-sky-950/10 px-5 py-4">
            <p className="text-sm font-semibold text-sky-950">Quick Analytics</p>
            <span className="flex items-center gap-1.5 rounded-lg border border-sky-950/15 bg-white/40 px-3 py-1.5 text-xs font-medium text-sky-950/70">
              Total Sales <ChevronDown className="size-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-sky-950/10 border-b border-sky-950/10">
            {[
              { label: "Average Order Value", value: formatINR(data.avgOrderValue) },
              { label: "Previous Week Sales", value: formatINR(data.lastPeriodSales) },
              { label: "Low Stock Products", value: `${data.lowStockCount} Items` },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-sky-950/65">{s.label}</p>
                <p className="mt-1 text-base font-bold text-sky-950">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="relative flex-1 px-2 pb-2 pt-4">
            {!chartHasData && (
              <div className="absolute inset-0 z-10 grid place-items-center">
                <p className="rounded-lg bg-white/90 px-3 py-2 text-sm text-sky-950/70">
                  {data.hasOrders ? "No orders in this period." : "No orders yet. Sales will appear here."}
                </p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(3,105,161,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#075985" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="sales" tick={{ fontSize: 10, fill: "#075985" }} axisLine={false} tickLine={false} width={44}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fontSize: 10, fill: "#075985" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Line yAxisId="sales" type="monotone" dataKey="sales" name="Revenue" stroke="#0369a1" strokeWidth={2}
                  dot={{ r: 3, fill: "#fff", stroke: "#0369a1", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#06b6d4" strokeWidth={2}
                  dot={{ r: 3, fill: "#fff", stroke: "#06b6d4", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="divide-y divide-sky-950/10 border-t border-sky-950/10">
            {[
              { icon: ShoppingBag, text: "orders to fulfil", count: data.ordersToFulfil, href: "/admin/orders" },
              { icon: CreditCard, text: "online payments pending", count: data.paymentsToCapture, href: "/admin/orders" },
              { icon: Undo2, text: "returns to review", count: data.returnsToReview, href: "/admin/orders" },
            ].map((item) => (
              <Link key={item.text} href={item.href} className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/50">
                <span className="grid size-7 place-items-center rounded-lg bg-white/60">
                  <item.icon className="size-3.5 text-sky-950/70" />
                </span>
                <span className="flex-1 text-sm text-sky-950/80">
                  <span className="font-semibold text-sky-950">{item.count} </span>
                  {item.text}
                </span>
                <ArrowRight className="size-4 text-sky-950/65" />
              </Link>
            ))}
          </div>
        </WCard>

        <WCard className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-sky-950/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-sky-950">Products</p>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-sky-950/70">{data.productTotal}</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="w-32 rounded-lg border border-sky-950/15 bg-white/50 px-3 py-1.5 text-xs text-sky-950 outline-none placeholder:text-sky-950/65 focus:border-sky-700"
            />
          </div>

          <div className="grid grid-cols-[1.8fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-sky-950/10 px-5 py-2">
            {["Name", "Price", "Stock", "Sold"].map((h) => (
              <span key={h} className="text-[11px] font-semibold uppercase tracking-wide text-sky-950/65">{h}</span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {rows.length === 0 ? (
              <div className="grid place-items-center gap-2 px-5 py-14 text-center">
                <Package className="size-8 text-sky-950/65" />
                <p className="text-sm text-sky-950/70">
                  {data.productTotal === 0 ? "No products yet." : "No products match your search."}
                </p>
              </div>
            ) : (
              rows.map((p) => (
                <Link
                  key={p.id}
                  href="/admin/products"
                  className="grid grid-cols-[1.8fr_0.8fr_0.6fr_0.6fr] items-center gap-2 border-b border-sky-950/5 px-5 py-3 transition hover:bg-white/50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-white/60">
                      {p.image && <Image src={p.image} alt={p.name} fill sizes="32px" className="object-cover" />}
                    </div>
                    <span className="truncate text-sm font-medium text-sky-950">{p.name}</span>
                  </div>
                  <span className="text-sm text-sky-950/80">{formatINR(p.price)}</span>
                  <span className={cn("text-sm", p.stock < 20 ? "font-semibold text-amber-600" : "text-sky-950/80")}>{p.stock}</span>
                  <span className="text-sm text-sky-950/80">{p.units}</span>
                </Link>
              ))
            )}
          </div>
        </WCard>
      </div>
    </div>
  );
}
