"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Info, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LinkRow } from "@/services/analytics";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CHANNELS, LINK_CHANNELS } from "@/lib/tracking/source";
import { formatINR, slugify } from "@/lib/utils";

export interface DestinationOption { label: string; path: string }

interface Draft {
  id?: string;
  code: string;
  name: string;
  channel: string;
  campaign: string;
  destination: string;
  isActive: boolean;
}

const EMPTY: Draft = { code: "", name: "", channel: "instagram_reel", campaign: "", destination: "/", isActive: true };

export function LinksManager({ links, destinations, origin }: { links: LinkRow[]; destinations: DestinationOption[]; origin: string }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [codeTouched, setCodeTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<LinkRow | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const url = (code: string) => `${origin}/l/${code}`;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(url(code));
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(draft.id ? `/api/admin/links/${draft.id}` : "/api/admin/links", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: draft.code, name: draft.name, channel: draft.channel, campaign: draft.campaign, destination: draft.destination, isActive: draft.isActive }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not save the link");
      toast.success(draft.id ? "Link updated" : "Link created. Copy it into your reel, DM or WhatsApp message.");
      setDraft(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (l: LinkRow) => {
    const res = await fetch(`/api/admin/links/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: l.code, name: l.name, channel: l.channel, campaign: l.campaign, destination: l.destination, isActive: !l.isActive }),
    });
    if (!res.ok) return toast.error("Could not update the link");
    router.refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    const res = await fetch(`/api/admin/links/${toDelete.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete the link");
      throw new Error("delete failed");
    }
    toast.success("Link deleted");
    router.refresh();
  };

  const totals = links.reduce((a, l) => ({ clicks: a.clicks + l.clicks, orders: a.orders + l.orders, revenue: a.revenue + l.revenue }), { clicks: 0, orders: 0, revenue: 0 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Tracked links</h1>
          <p className="text-sm text-sky-950/70">
            One link per reel, DM reply, bio or WhatsApp message. {totals.clicks} clicks · {totals.orders} orders · {formatINR(totals.revenue)} so far.
          </p>
        </div>
        <Button className="btn-glass" onClick={() => { setDraft({ ...EMPTY }); setCodeTouched(false); }}>
          <Plus /> New link
        </Button>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Bag</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-sm text-sky-950/70">
                    No links yet. Create one for your next reel and paste it in the caption, bio or auto-DM reply.
                  </TableCell>
                </TableRow>
              )}
              {links.map((l) => (
                <TableRow key={l.id} className={l.isActive ? "" : "opacity-60"}>
                  <TableCell className="min-w-56">
                    <p className="font-medium text-sky-950">{l.name}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <code className="truncate text-xs text-sky-800">/l/{l.code}</code>
                      <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => copy(l.code)} aria-label={`Copy link ${l.code}`}>
                        {copied === l.code ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm" className="size-7" aria-label={`Share ${l.code} on WhatsApp`}>
                        <a href={`https://wa.me/?text=${encodeURIComponent(url(l.code))}`} target="_blank" rel="noopener noreferrer"><Share2 className="size-3.5" /></a>
                      </Button>
                    </div>
                    <p className="truncate text-[11px] text-sky-950/65">→ {l.destination}{l.campaign ? ` · ${l.campaign}` : ""}</p>
                  </TableCell>
                  <TableCell><Badge variant="admin" className="whitespace-nowrap text-[11px]">{l.channelLabel}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{l.clicks}</TableCell>
                  <TableCell className="text-right">{l.sessions}</TableCell>
                  <TableCell className="text-right">{l.addToCart}</TableCell>
                  <TableCell className="text-right font-semibold">{l.orders}</TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(l.revenue)}</TableCell>
                  <TableCell className="text-right">{l.conversion}%</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Switch checked={l.isActive} onCheckedChange={() => toggle(l)} aria-label={l.isActive ? `Pause ${l.code}` : `Activate ${l.code}`} />
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${l.code}`} onClick={() => { setDraft({ id: l.id, code: l.code, name: l.name, channel: l.channel, campaign: l.campaign, destination: l.destination, isActive: l.isActive }); setCodeTouched(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-700" aria-label={`Delete ${l.code}`} onClick={() => setToDelete(l)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle className="flex items-center gap-2"><Info className="size-4" /> Sending links automatically in Instagram DMs</AdminCardTitle></AdminCardHeader>
        <AdminCardContent className="space-y-2 text-sm text-sky-950/85">
          <p>
            Automatic “comment → DM the link” replies must go through Meta&apos;s official Instagram messaging API. The easiest way is an
            approved Meta partner such as ManyChat: connect your Instagram professional account there, create a “comment keyword” automation
            for the reel, and paste the tracked link from this page as the DM reply.
          </p>
          <p>Every person who taps that link is counted here and any order they place is credited to the reel.</p>
          <p className="text-xs text-sky-950/65">This site does not log in to Instagram or send DMs itself; unofficial DM bots break Instagram&apos;s terms and get accounts restricted.</p>
        </AdminCardContent>
      </AdminCard>

      <Dialog open={!!draft} onOpenChange={(v) => !v && !saving && setDraft(null)}>
        {draft && (
          <DialogContent className="glass-dialog max-w-lg">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit link" : "New tracked link"}</DialogTitle>
              <DialogDescription>Short link that records every click and the orders it brings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="ln-name" className="mb-1.5 block">Name</Label>
                <Input id="ln-name" value={draft.name} maxLength={80} placeholder="Denim reel – 12 Nov"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value, code: codeTouched ? draft.code : slugify(e.target.value).slice(0, 40) })} />
              </div>
              <div>
                <Label htmlFor="ln-code" className="mb-1.5 block">Short code</Label>
                <Input id="ln-code" value={draft.code} disabled={!!draft.id}
                  onChange={(e) => { setCodeTouched(true); setDraft({ ...draft, code: slugify(e.target.value).slice(0, 40) }); }} />
                <p className="mt-1 break-all text-xs text-sky-950/65">{url(draft.code || "…")}{draft.id ? " (cannot change once shared)" : ""}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ln-channel" className="mb-1.5 block">Where will you post it?</Label>
                  <Select value={draft.channel} onValueChange={(v) => setDraft({ ...draft, channel: v })}>
                    <SelectTrigger id="ln-channel"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LINK_CHANNELS.map((c) => <SelectItem key={c} value={c}>{CHANNELS[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ln-camp" className="mb-1.5 block">Campaign (optional)</Label>
                  <Input id="ln-camp" value={draft.campaign} placeholder="winter-drop" onChange={(e) => setDraft({ ...draft, campaign: slugify(e.target.value).slice(0, 60) })} />
                </div>
              </div>
              <div>
                <Label htmlFor="ln-dest" className="mb-1.5 block">Opens</Label>
                <Select value={destinations.some((d) => d.path === draft.destination) ? draft.destination : "__custom"} onValueChange={(v) => v !== "__custom" && setDraft({ ...draft, destination: v })}>
                  <SelectTrigger id="ln-dest"><SelectValue placeholder="Pick a page" /></SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => <SelectItem key={d.path} value={d.path}>{d.label}</SelectItem>)}
                    <SelectItem value="__custom">Custom path…</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="mt-2" aria-label="Destination path" value={draft.destination} onChange={(e) => setDraft({ ...draft, destination: e.target.value })} placeholder="/combo/night-out-combo" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ln-active" className="font-normal">Active</Label>
                <Switch id="ln-active" checked={draft.isActive} onCheckedChange={(v) => setDraft({ ...draft, isActive: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
              <Button className="btn-glass" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save link"}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this link?"
        description={<>Anyone who opens <code>/l/{toDelete?.code}</code> will land on the homepage instead. Past clicks and orders stay in analytics. Pausing is usually better.</>}
        onConfirm={remove}
      />
    </div>
  );
}
