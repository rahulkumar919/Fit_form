"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, ChevronLeft, ChevronRight, EyeOff, ImagePlus, Loader2, Pencil,
  Plus, Search, Star, Store, ThumbsUp, Trash2, User, X, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminReviewRow } from "@/services/admin";
import type { ReviewAnalytics } from "@/services/reviews";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ─── types ─── */

type AnalyticsData = ReviewAnalytics;

interface PickerProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  categoryLabel: string;
  sku: string;
}

/* ─── stat card ─── */

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <AdminCard className="flex flex-col gap-1 p-4">
      <span className="text-xs font-medium text-sky-950/60">{label}</span>
      <span className="text-2xl font-bold text-sky-950">{value}</span>
      {sub && <span className="text-xs text-sky-950/50">{sub}</span>}
    </AdminCard>
  );
}

/* ─── star picker ─── */

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Star className={cn("size-6", (hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-sky-950/20")} />
        </button>
      ))}
    </div>
  );
}

/* ─── Product picker with inline search ─── */

function ProductPicker({
  value, onChange, products, loading,
}: {
  value: string;
  onChange: (id: string) => void;
  products: PickerProduct[];
  loading: boolean;
}) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selected = products.find((p) => p.id === value);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.categoryLabel.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)),
    );
  }, [products, search]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition",
          "hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          open ? "border-ring/60" : "border-input",
        )}
      >
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : selected ? (
          <>
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image} alt={selected.name} className="size-7 shrink-0 rounded object-cover" />
            ) : (
              <div className="size-7 shrink-0 rounded bg-muted" />
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-foreground">{selected.name}</p>
              {selected.sku && <p className="truncate text-[10px] text-muted-foreground">SKU: {selected.sku}</p>}
            </div>
          </>
        ) : (
          <span className="text-muted-foreground">Select a product…</span>
        )}
        <svg className="ml-auto size-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category or SKU…"
                className="w-full rounded-md border-0 bg-muted/50 py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading products…
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {search ? "No products match your search." : "No products available."}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onChange(p.id); setOpen(false); setSearch(""); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-muted/60",
                    value === p.id && "bg-sky-50",
                  )}
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="size-9 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="size-9 shrink-0 rounded bg-muted flex items-center justify-center">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.categoryLabel}
                      {p.sku ? <span className="ml-1.5 font-mono opacity-70">SKU: {p.sku}</span> : null}
                    </p>
                  </div>
                  {value === p.id && <Check className="size-3.5 shrink-0 text-sky-700" />}
                </button>
              ))
            )}
          </div>
          {filtered.length > 0 && (
            <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Customer photo uploader ─────────────────────────────────────────────
   Uploads up to 3 photos the customer took of the product they received.
   Uses POST /api/admin/media (multipart). Uploaded URLs go into review.images[].
────────────────────────────────────────────────────────────────────────── */

const MAX_PHOTOS = 3;

function PhotoUploader({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - images.length;
    if (remaining <= 0) return toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);

    setUploading(true);
    const urls: string[] = [];
    try {
      for (let i = 0; i < Math.min(files.length, remaining); i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);
        fd.append("provider", "server");
        fd.append("alt", "Customer product photo");
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          toast.error(json.message ?? `Could not upload ${file.name}`);
          break;
        }
        urls.push(json.data.url as string);
      }
      if (urls.length > 0) {
        onChange([...images, ...urls]);
        toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded`);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${idx + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                title="Remove photo"
              >
                <X className="size-5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {images.length < MAX_PHOTOS && (
        <label className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm transition",
          "hover:border-sky-400 hover:bg-sky-50/50",
          uploading && "pointer-events-none opacity-60",
        )}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => upload(e.target.files)}
            disabled={uploading}
          />
          {uploading
            ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            : <ImagePlus className="size-4 shrink-0 text-sky-700" />}
          <span className="text-muted-foreground">
            {uploading
              ? "Uploading…"
              : images.length === 0
                ? "Add customer product photos (up to 3)"
                : `Add more (${MAX_PHOTOS - images.length} remaining)`}
          </span>
        </label>
      )}
    </div>
  );
}

/* ─── Add / Edit modal ─── */

interface ReviewFormState {
  productId: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  source: "customer" | "store_testimonial";
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  reviewDate: string;
}

const EMPTY_FORM: ReviewFormState = {
  productId: "",
  customerName: "",
  rating: 5,
  title: "",
  body: "",
  images: [],
  source: "store_testimonial",
  status: "approved",
  featured: false,
  reviewDate: "",
};

function ReviewModal({
  open, onClose, editing, products, productsLoading, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: AdminReviewRow | null;
  products: PickerProduct[];
  productsLoading: boolean;
  onSaved: () => void;
}) {
  return (
    <ReviewModalInner
      key={editing ? editing.id : "new"}
      open={open} onClose={onClose} editing={editing}
      products={products} productsLoading={productsLoading} onSaved={onSaved}
    />
  );
}

function ReviewModalInner({
  open, onClose, editing, products, productsLoading, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: AdminReviewRow | null;
  products: PickerProduct[];
  productsLoading: boolean;
  onSaved: () => void;
}) {
  const initialForm: ReviewFormState = editing
    ? {
        productId: editing.productId,
        customerName: editing.author,
        rating: editing.rating,
        title: editing.title,
        body: editing.body,
        images: editing.images ?? [],
        source: editing.source,
        status: editing.status,
        featured: editing.featured,
        reviewDate: editing.createdAt.slice(0, 10),
      }
    : EMPTY_FORM;

  const [form, setForm] = React.useState<ReviewFormState>(initialForm);
  const [busy, setBusy] = React.useState(false);

  const set = <K extends keyof ReviewFormState>(key: K, val: ReviewFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) return toast.error("Select a product");
    if (!form.customerName.trim()) return toast.error("Customer name is required");
    if (form.rating < 1) return toast.error("Select a star rating");
    if (!form.body.trim()) return toast.error("Review description is required");

    setBusy(true);
    try {
      const url = editing ? `/api/admin/reviews/${editing.id}` : "/api/admin/reviews";
      const method = editing ? "PATCH" : "POST";
      const payload = editing
        ? {
            status: form.status,
            author: form.customerName,
            customerImage: "",
            rating: form.rating,
            title: form.title,
            body: form.body,
            images: form.images,
            source: form.source,
            featured: form.featured,
          }
        : {
            productId: form.productId,
            customerName: form.customerName,
            customerImage: "",
            rating: form.rating,
            title: form.title,
            body: form.body,
            images: form.images,
            source: form.source,
            status: form.status,
            featured: form.featured,
            reviewDate: form.reviewDate || undefined,
          };

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not save review");
      toast.success(editing ? "Review updated" : "Review created");
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit review" : "Add review / testimonial"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="flex flex-col gap-4 py-2">

          {/* Product picker — create only */}
          {!editing && (
            <div>
              <Label className="mb-1.5 block">Product *</Label>
              <ProductPicker
                value={form.productId}
                onChange={(id) => set("productId", id)}
                products={products}
                loading={productsLoading}
              />
            </div>
          )}

          {/* Customer name */}
          <div>
            <Label className="mb-1.5 block">Customer name *</Label>
            <Input
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              maxLength={80}
              placeholder="e.g. Priya Sharma"
            />
          </div>

          {/* Rating */}
          <div>
            <Label className="mb-1.5 block">Rating *</Label>
            <StarPicker value={form.rating} onChange={(n) => set("rating", n)} />
          </div>

          {/* Title */}
          <div>
            <Label className="mb-1.5 block">Review title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={80} placeholder="e.g. Great quality!" />
          </div>

          {/* Body */}
          <div>
            <Label className="mb-1.5 block">Review description *</Label>
            <textarea
              rows={4}
              maxLength={1500}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Describe the product experience…"
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          {/* Customer product photos */}
          <div>
            <Label className="mb-1.5 block">Customer product photos</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Photos the customer took of the product they received — shown alongside the review.
            </p>
            <PhotoUploader images={form.images} onChange={(urls) => set("images", urls)} />
          </div>

          {/* Source / Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Source</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v as typeof form.source)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="glass-dialog">
                  <SelectItem value="customer">Customer Review</SelectItem>
                  <SelectItem value="store_testimonial">Store Testimonial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="glass-dialog">
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date (create only) + Featured */}
          <div className="grid grid-cols-2 gap-3">
            {!editing && (
              <div>
                <Label className="mb-1.5 block">Review date</Label>
                <Input type="date" value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)} />
              </div>
            )}
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="size-4 rounded border-input accent-sky-700"
                />
                Featured review
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" className="btn-glass" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── View details modal ─── */

function ViewModal({ review, onClose }: { review: AdminReviewRow | null; onClose: () => void }) {
  if (!review) return null;
  return (
    <Dialog open={!!review} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog max-w-lg">
        <DialogHeader><DialogTitle>Review details</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          {/* Customer */}
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-sky-100 text-sky-700">
              <User className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{review.author}</p>
              <p className="text-sky-950/60">
                {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex" aria-label={`${review.rating} stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < review.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-sky-950/20"} />
              ))}
            </div>
            <StatusBadge status={review.status} />
            <SourceBadge source={review.source} />
            {review.featured && <Badge variant="secondary" className="text-[10px]">★ Featured</Badge>}
            {review.verified && <Badge variant="success" className="text-[10px]">Verified Purchase</Badge>}
          </div>

          {/* Product with image */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            {review.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.productImage} alt={review.productName} className="size-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="size-12 shrink-0 rounded-lg bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-sky-950/60">Product</p>
              {review.productSlug ? (
                <Link href={`/product/${review.productSlug}`} target="_blank"
                  className="font-medium underline underline-offset-2 truncate block">
                  {review.productName}
                </Link>
              ) : (
                <span className="font-medium">{review.productName}</span>
              )}
              {review.productSku && <p className="text-[11px] font-mono text-sky-950/50">SKU: {review.productSku}</p>}
            </div>
          </div>

          {review.title && <p className="font-semibold">{review.title}</p>}
          <p className="whitespace-pre-line text-sky-950/80">{review.body}</p>

          {/* Customer product photos */}
          {review.images.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-sky-950/60">Customer photos</p>
              <div className="flex flex-wrap gap-2">
                {review.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt={`Customer photo ${i + 1}`} className="size-20 rounded-lg object-cover border border-border" />
                ))}
              </div>
            </div>
          )}

          <p className="flex items-center gap-1 text-sky-950/50">
            <ThumbsUp className="size-3.5" /> {review.helpfulCount} found helpful
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── small helpers ─── */

function StatusBadge({ status }: { status: string }) {
  const map = { approved: "success" as const, pending: "warning" as const, rejected: "danger" as const };
  return (
    <Badge variant={map[status as keyof typeof map] ?? "secondary"} className="text-[10px] capitalize">{status}</Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  return source === "store_testimonial" ? (
    <Badge variant="admin" className="text-[10px]"><Store className="mr-0.5 size-2.5" />Testimonial</Badge>
  ) : (
    <Badge variant="muted" className="text-[10px]"><User className="mr-0.5 size-2.5" />Customer</Badge>
  );
}

function StarsDisplay({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", i < n ? "fill-amber-400 text-amber-400" : "text-sky-950/15")} />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export function ReviewsManager({
  reviews: initialReviews,
  initialAnalytics = null,
}: {
  reviews: AdminReviewRow[];
  initialAnalytics?: AnalyticsData | null;
}) {
  const router = useRouter();

  const [reviews, setReviews] = React.useState<AdminReviewRow[]>(initialReviews);
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(initialAnalytics ?? null);
  const [products, setProducts] = React.useState<PickerProduct[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [ratingFilter, setRatingFilter] = React.useState("0");
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminReviewRow | null>(null);
  const [viewing, setViewing] = React.useState<AdminReviewRow | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminReviewRow | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  /* load on mount */
  React.useEffect(() => {
    if (!analytics) {
      fetch("/api/admin/reviews/analytics")
        .then((r) => r.json())
        .then((j) => j.success && setAnalytics(j.data))
        .catch(() => null);
    }
    fetch("/api/admin/reviews?limit=500")
      .then((r) => r.json())
      .then((j) => { if (j.success) setReviews(j.data.reviews); })
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* load product picker when modal opens */
  React.useEffect(() => {
    if ((addOpen || editing) && products.length === 0) {
      setProductsLoading(true);
      fetch("/api/admin/reviews/products")
        .then((r) => r.json())
        .then((j) => { if (j.success) setProducts(j.data.products ?? []); })
        .catch(() => null)
        .finally(() => setProductsLoading(false));
    }
  }, [addOpen, editing, products.length]);

  /* client-side filter */
  const term = q.trim().toLowerCase();
  const filtered = reviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (ratingFilter !== "0" && r.rating !== parseInt(ratingFilter, 10)) return false;
    if (term && !r.author.toLowerCase().includes(term) && !r.productName.toLowerCase().includes(term)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = () => setPage(1);

  /* actions */
  const setStatus = async (r: AdminReviewRow, status: "approved" | "rejected" | "pending") => {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not update review");
      toast.success({ approved: "Review published", rejected: "Review rejected", pending: "Review set to pending" }[status]);
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, status, isApproved: status === "approved" } : x));
      refreshAnalytics();
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const res = await fetch(`/api/admin/reviews/${toDelete.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) { toast.error(json.message ?? "Could not delete review"); throw new Error("delete failed"); }
    toast.success("Review deleted");
    setReviews((prev) => prev.filter((x) => x.id !== toDelete.id));
    refreshAnalytics();
  };

  const refreshAnalytics = () => {
    fetch("/api/admin/reviews/analytics")
      .then((r) => r.json())
      .then((j) => j.success && setAnalytics(j.data))
      .catch(() => null);
  };

  const onModalSaved = () => {
    fetch("/api/admin/reviews?limit=500")
      .then((r) => r.json())
      .then((j) => { if (j.success) setReviews(j.data.reviews); })
      .catch(() => null);
    refreshAnalytics();
    router.refresh();
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Reviews &amp; Ratings</h1>
          <p className="text-sm text-sky-950/70">
            Manage customer reviews and store testimonials.
            {pendingCount > 0 && <span className="ml-1 font-medium text-amber-700">{pendingCount} pending.</span>}
          </p>
        </div>
        <Button className="btn-glass" onClick={() => setAddOpen(true)}><Plus /> Add review</Button>
      </div>

      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total" value={analytics.total} />
          <StatCard label="Approved" value={analytics.approved} />
          <StatCard label="Pending" value={analytics.pending} />
          <StatCard label="Rejected" value={analytics.rejected} />
          <StatCard label="Avg rating" value={`${analytics.averageRating.toFixed(1)} ★`} />
          <StatCard label="Verified" value={analytics.verifiedCount} sub="purchase" />
          <StatCard label="Testimonials" value={analytics.testimonialCount} sub="store-created" />
        </div>
      )}

      {/* Rating distribution */}
      {analytics && analytics.total > 0 && (
        <AdminCard className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-950/60">Rating distribution (approved)</p>
          <div className="space-y-2">
            {analytics.distribution.map((d) => {
              const total = analytics.distribution.reduce((s, x) => s + x.count, 0);
              const pct = total ? Math.round((d.count / total) * 100) : 0;
              return (
                <div key={d.star} className="flex items-center gap-3 text-xs">
                  <span className="w-10 shrink-0 text-sky-950/70">{d.star} star</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky-950/10">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-sky-950/60">{d.count}</span>
                  <span className="w-8 text-right tabular-nums text-sky-950/40">{pct}%</span>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}

      {/* Filters */}
      <AdminCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-950/50" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder="Search customer or product…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="glass-dialog">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); resetPage(); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent className="glass-dialog">
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="store_testimonial">Testimonial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); resetPage(); }}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent className="glass-dialog">
              <SelectItem value="0">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}
            </SelectContent>
          </Select>
          {(q || statusFilter !== "all" || sourceFilter !== "all" || ratingFilter !== "0") && (
            <Button variant="ghost" size="sm" className="text-sky-950/60"
              onClick={() => { setQ(""); setStatusFilter("all"); setSourceFilter("all"); setRatingFilter("0"); resetPage(); }}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
      </AdminCard>

      {/* Table */}
      <AdminCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-sm text-sky-950/60">
                  {reviews.length === 0
                    ? "No reviews yet."
                    : "No reviews match your filters."}
                </TableCell>
              </TableRow>
            )}
            {paginated.map((r) => (
              <TableRow key={r.id} className="group">
                {/* Customer */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
                      <User className="size-3.5" />
                    </div>
                    <span className="max-w-[120px] truncate text-sm font-medium">{r.author}</span>
                  </div>
                </TableCell>

                {/* Product — image + name + SKU */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {r.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.productImage} alt={r.productName} className="size-9 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="size-9 shrink-0 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0">
                      {r.productSlug ? (
                        <Link href={`/product/${r.productSlug}`} target="_blank"
                          className="block max-w-[130px] truncate text-sm underline-offset-2 hover:underline">
                          {r.productName}
                        </Link>
                      ) : (
                        <span className="block max-w-[130px] truncate text-sm text-sky-950/60">{r.productName}</span>
                      )}
                      {r.productSku && <p className="text-[10px] font-mono text-sky-950/40 truncate max-w-[130px]">{r.productSku}</p>}
                    </div>
                  </div>
                </TableCell>

                {/* Rating */}
                <TableCell><StarsDisplay n={r.rating} /></TableCell>

                {/* Review snippet + photo count */}
                <TableCell>
                  <div className="max-w-[200px]">
                    <p className="truncate text-sm text-sky-950/70">
                      {r.title ? <b className="text-sky-950">{r.title}: </b> : ""}
                      {r.body}
                    </p>
                    {r.images.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] text-sky-700">
                        <ImagePlus className="size-2.5" /> {r.images.length} photo{r.images.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Source */}
                <TableCell><SourceBadge source={r.source} /></TableCell>

                {/* Date */}
                <TableCell>
                  <span className="whitespace-nowrap text-xs text-sky-950/60">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell><StatusBadge status={r.status} /></TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => setViewing(r)}
                      className="grid size-7 place-items-center rounded-lg text-sky-950/50 hover:bg-sky-100 hover:text-sky-900" title="View">
                      <Search className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditing(r)}
                      className="grid size-7 place-items-center rounded-lg text-sky-950/50 hover:bg-sky-100 hover:text-sky-900" title="Edit">
                      <Pencil className="size-3.5" />
                    </button>
                    {r.status !== "approved" && (
                      <button type="button" disabled={busy === r.id} onClick={() => setStatus(r, "approved")}
                        className="grid size-7 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-50" title="Approve">
                        <Check className="size-3.5" />
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button type="button" disabled={busy === r.id} onClick={() => setStatus(r, "rejected")}
                        className="grid size-7 place-items-center rounded-lg text-red-500 hover:bg-red-50" title="Reject">
                        <XCircle className="size-3.5" />
                      </button>
                    )}
                    {r.status === "approved" && (
                      <button type="button" disabled={busy === r.id} onClick={() => setStatus(r, "pending")}
                        className="grid size-7 place-items-center rounded-lg text-amber-600 hover:bg-amber-50" title="Hide (set pending)">
                        <EyeOff className="size-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => setToDelete(r)}
                      className="grid size-7 place-items-center rounded-lg text-red-500/70 hover:bg-red-50 hover:text-red-700" title="Delete">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-sky-950/10 px-5 py-3 text-sm text-sky-950/70">
            <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2">{page} / {totalPages}</span>
              <Button variant="ghost" size="icon-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* Modals */}
      <ReviewModal
        open={addOpen || !!editing}
        onClose={() => { setAddOpen(false); setEditing(null); }}
        editing={editing}
        products={products}
        productsLoading={productsLoading}
        onSaved={onModalSaved}
      />
      <ViewModal review={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this review?"
        description="The review will be permanently removed and the product rating will be recalculated. This cannot be undone."
        onConfirm={remove}
      />
    </div>
  );
}
