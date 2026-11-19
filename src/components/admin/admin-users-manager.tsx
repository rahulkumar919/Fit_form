"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface AdminUserRow { id: string; name: string; email: string; isActive: boolean; locked: boolean; lastLoginAt: string | null; isSelf: boolean }

type Draft = { mode: "create" | "password"; id?: string; name: string; email: string; password: string };

export function AdminUsersManager({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [busy, setBusy] = React.useState(false);

  const send = async (url: string, method: string, body: unknown, success: string) => {
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Request failed");
        return false;
      }
      toast.success(success);
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!draft) return;
    const ok = draft.mode === "create"
      ? await send("/api/admin/users", "POST", { name: draft.name, email: draft.email, password: draft.password }, "Admin added")
      : await send(`/api/admin/users/${draft.id}`, "PATCH", { password: draft.password }, "Password changed");
    if (ok) setDraft(null);
  };

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Admin users</h1>
          <p className="text-sm text-sky-950/70">People who can sign in to this panel with email and password.</p>
        </div>
        <Button className="btn-glass" onClick={() => setDraft({ mode: "create", name: "", email: "", password: "" })}><Plus /> Add admin</Button>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium text-sky-950">{u.name}{u.isSelf && <span className="ml-2 text-xs font-normal text-sky-950/65">(you)</span>}</p>
                    <p className="text-xs text-sky-950/70">{u.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-sky-950/80">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "Never"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={u.isActive ? "success" : "muted"} className="text-[10px]">{u.isActive ? "Active" : "Disabled"}</Badge>
                      {u.locked && <Badge variant="warning" className="text-[10px]">Locked (too many attempts)</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={u.isActive}
                        disabled={u.isSelf || busy}
                        aria-label={u.isActive ? `Disable ${u.email}` : `Enable ${u.email}`}
                        onCheckedChange={(v) => send(`/api/admin/users/${u.id}`, "PATCH", { isActive: v }, v ? "Admin enabled" : "Admin disabled")}
                      />
                      <Button size="sm" variant="outline" onClick={() => setDraft({ mode: "password", id: u.id, name: u.name, email: u.email, password: "" })}>
                        <KeyRound /> Password
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <p className="flex items-center gap-2 text-xs text-sky-950/70">
        <ShieldCheck className="size-4" /> Passwords are stored as bcrypt hashes. Changing a password also unlocks the account. You cannot disable yourself.
      </p>

      <Dialog open={!!draft} onOpenChange={(v) => !v && !busy && setDraft(null)}>
        {draft && (
          <DialogContent className="glass-dialog max-w-md">
            <DialogHeader>
              <DialogTitle>{draft.mode === "create" ? "Add admin" : `New password for ${draft.email}`}</DialogTitle>
              <DialogDescription>Use at least 12 characters. A long passphrase is best.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {draft.mode === "create" && (
                <>
                  <div><Label htmlFor="au-name" className="mb-1.5 block">Name</Label><Input id="au-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                  <div><Label htmlFor="au-email" className="mb-1.5 block">Email</Label><Input id="au-email" type="email" autoComplete="off" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                </>
              )}
              <div><Label htmlFor="au-pw" className="mb-1.5 block">Password</Label><Input id="au-pw" type="password" autoComplete="new-password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)} disabled={busy}>Cancel</Button>
              <Button className="btn-glass" onClick={submit} disabled={busy || draft.password.length < 12}>{busy ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
