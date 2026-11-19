"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Cloud, HardDrive, Save, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { StoreSettings } from "@/services/settings-types";
import { DEFAULT_PARTIAL_COD } from "@/services/settings-types";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface IntegrationStatus { name: string; ok: boolean; hint: string }

export function SettingsForm({ initial, integrations, cloudinaryEnabled }: { initial: StoreSettings; integrations: IntegrationStatus[]; cloudinaryEnabled: boolean }) {
  const router = useRouter();
  const [s, setS] = React.useState<StoreSettings>({
    ...initial,
    partialCod: { ...DEFAULT_PARTIAL_COD, ...(initial.partialCod ?? {}) },
  });
  const [saving, setSaving] = React.useState(false);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setPC = <K extends keyof StoreSettings["partialCod"]>(k: K, v: StoreSettings["partialCod"][K]) =>
    setS((p) => ({ ...p, partialCod: { ...p.partialCod, [k]: v } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not save settings");
      toast.success("Settings saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Settings</h1>
          <p className="text-sm text-sky-950/70">Store details, delivery charges, image storage and integrations.</p>
        </div>
        <Button type="submit" className="btn-glass" disabled={saving}><Save /> {saving ? "Saving…" : "Save settings"}</Button>
      </div>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Store</AdminCardTitle></AdminCardHeader>
        <AdminCardContent className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="st-name" className="mb-1.5 block">Store name</Label><Input id="st-name" value={s.storeName} onChange={(e) => set("storeName", e.target.value)} /></div>
          <div><Label htmlFor="st-email" className="mb-1.5 block">Support email</Label><Input id="st-email" type="email" value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></div>
          <div><Label htmlFor="st-phone" className="mb-1.5 block">WhatsApp / phone</Label><Input id="st-phone" value={s.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} placeholder="+91 98765 43210" /></div>
          <p className="text-xs text-sky-950/65 sm:col-span-3">The WhatsApp number is used for the floating chat button and footer. Turn the button on in Admin → Homepage → Social &amp; buttons.</p>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Checkout &amp; delivery</AdminCardTitle></AdminCardHeader>
        <AdminCardContent className="grid gap-4 sm:grid-cols-3">
          {/* ── Payment gateway ── */}
          <div className="sm:col-span-3">
            <p className="mb-2 text-sm font-semibold text-sky-950">Online payment gateway</p>
            <div role="radiogroup" aria-label="Payment gateway" className="grid gap-3 sm:grid-cols-3">
              {([
                { key: "cashfree", label: "Cashfree", desc: "UPI, cards, wallets via Cashfree" },
                { key: "razorpay", label: "Razorpay", desc: "UPI, cards, net banking via Razorpay" },
                { key: "none", label: "Disabled", desc: "Show only COD (no online payments)" },
              ] as const).map((o) => (
                <button key={o.key} type="button" role="radio"
                  aria-checked={(s.activeGateway ?? "cashfree") === o.key}
                  onClick={() => set("activeGateway", o.key)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition",
                    (s.activeGateway ?? "cashfree") === o.key
                      ? "border-sky-600 bg-sky-50"
                      : "border-sky-900/10 bg-white/50 hover:border-sky-300",
                  )}>
                  <span className="text-sm font-semibold text-sky-950">{o.label}</span>
                  <span className="text-[11px] text-sky-950/65">{o.desc}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-sky-950/60">
              Only the selected gateway&apos;s button appears at checkout.
              Switching does not affect past orders.
            </p>
          </div>

          {/* ── COD ── */}
          <div className="flex items-center justify-between gap-3 sm:col-span-3">
            <div>
              <Label htmlFor="st-cod">Cash on Delivery</Label>
              <p className="text-xs text-sky-950/65">Off = COD option disappears completely from checkout.</p>
            </div>
            <Switch id="st-cod" checked={s.codEnabled} onCheckedChange={(v) => set("codEnabled", v)} />
          </div>
          <div><Label htmlFor="st-free" className="mb-1.5 block">Free shipping from (₹)</Label><Input id="st-free" type="number" min={0} value={s.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} /></div>
          <div><Label htmlFor="st-flat" className="mb-1.5 block">Shipping charge below that (₹)</Label><Input id="st-flat" type="number" min={0} value={s.flatShipping} onChange={(e) => set("flatShipping", Number(e.target.value))} /></div>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Default image storage</AdminCardTitle></AdminCardHeader>
        <AdminCardContent>
          <div role="radiogroup" aria-label="Default image storage" className="grid gap-3 sm:grid-cols-2">
            {([
              { key: "server", label: "Server storage", desc: "Files on this server (needs a persistent disk in production)", icon: HardDrive, disabled: false },
              { key: "cloudinary", label: "Cloudinary", desc: cloudinaryEnabled ? "CDN delivery, recommended for Vercel" : "Add CLOUDINARY_* keys to enable", icon: Cloud, disabled: !cloudinaryEnabled },
            ] as const).map((o) => (
              <button key={o.key} type="button" role="radio" aria-checked={s.defaultStorage === o.key} disabled={o.disabled}
                onClick={() => set("defaultStorage", o.key)}
                className={cn("flex items-start gap-3 rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                  s.defaultStorage === o.key ? "border-sky-600 bg-white/70" : "border-white/60 hover:border-sky-300")}>
                <o.icon className="mt-0.5 size-5 text-sky-700" />
                <span><span className="block text-sm font-semibold text-sky-950">{o.label}</span><span className="text-xs text-sky-950/65">{o.desc}</span></span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-sky-950/65">You are still asked on every upload; this only pre-selects the option.</p>
        </AdminCardContent>
      </AdminCard>

      {/* ── Partial COD ── */}
      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Partial COD (advance payment)</AdminCardTitle></AdminCardHeader>
        <AdminCardContent className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="pc-enabled">Enable Partial COD</Label>
              <p className="text-xs text-sky-950/65">
                Customers pay a small advance online and the rest at delivery.
                Requires Razorpay to be configured and active.
              </p>
            </div>
            <Switch id="pc-enabled" checked={s.partialCod.enabled} onCheckedChange={(v) => setPC("enabled", v)} />
          </div>

          {s.partialCod.enabled && (
            <>
              {/* Advance type + value */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">Advance type</Label>
                  <Select
                    value={s.partialCod.advanceType}
                    onValueChange={(v) => setPC("advanceType", v as "percentage" | "fixed")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-dialog">
                      <SelectItem value="percentage">Percentage of order total</SelectItem>
                      <SelectItem value="fixed">Fixed amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pc-value" className="mb-1.5 block">
                    {s.partialCod.advanceType === "percentage" ? "Advance %" : "Advance amount (₹)"}
                  </Label>
                  <Input
                    id="pc-value"
                    type="number"
                    min={1}
                    max={s.partialCod.advanceType === "percentage" ? 100 : 100000}
                    value={s.partialCod.advanceValue}
                    onChange={(e) => setPC("advanceValue", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-sky-950/60">
                    {s.partialCod.advanceType === "percentage"
                      ? `Example: ₹1,999 order → ₹${Math.ceil(1999 * s.partialCod.advanceValue / 100)} advance`
                      : `Customer pays ₹${s.partialCod.advanceValue} now, rest at delivery`}
                  </p>
                </div>
              </div>

              {/* Order amount limits */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="pc-min-order" className="mb-1.5 block">Min order amount (₹)</Label>
                  <Input
                    id="pc-min-order"
                    type="number"
                    min={0}
                    value={s.partialCod.minOrderAmount}
                    onChange={(e) => setPC("minOrderAmount", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-sky-950/60">Orders below this hide Partial COD</p>
                </div>
                <div>
                  <Label htmlFor="pc-max-order" className="mb-1.5 block">Max order amount (₹)</Label>
                  <Input
                    id="pc-max-order"
                    type="number"
                    min={0}
                    value={s.partialCod.maxOrderAmount}
                    onChange={(e) => setPC("maxOrderAmount", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-sky-950/60">0 = no upper limit</p>
                </div>
                <div>
                  <Label htmlFor="pc-min-adv" className="mb-1.5 block">Min advance amount (₹)</Label>
                  <Input
                    id="pc-min-adv"
                    type="number"
                    min={0}
                    value={s.partialCod.minAdvanceAmount}
                    onChange={(e) => setPC("minAdvanceAmount", Number(e.target.value))}
                  />
                  <p className="mt-1 text-[11px] text-sky-950/60">Floor if calculated advance is too low</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <strong>Note:</strong> Partial COD uses Razorpay for the advance payment.
                Make sure Razorpay is selected as the active gateway and keys are configured.
              </div>
            </>
          )}
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Integrations</AdminCardTitle></AdminCardHeader>        <AdminCardContent>
          <ul className="divide-y divide-sky-950/10">
            {integrations.map((i) => (
              <li key={i.name} className="flex items-start gap-3 py-2.5">
                {i.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />}
                <div>
                  <p className="text-sm font-medium text-sky-950">{i.name} <span className="font-normal text-sky-950/65">· {i.ok ? "connected" : "not configured"}</span></p>
                  {!i.ok && <p className="text-xs text-sky-950/65">{i.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-sky-950/65">Secret keys are never entered here. Set them as environment variables on your server and restart.</p>
        </AdminCardContent>
      </AdminCard>
    </form>
  );
}
