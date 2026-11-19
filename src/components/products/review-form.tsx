"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "blocked"; reason: string }
  | { status: "done" };

const REASONS: Record<string, React.ReactNode> = {
  not_signed_in: <>Bought this? <Link href="/login" className="font-medium underline">Sign in</Link> to review it.</>,
  not_purchased: "Only customers who have received this product can review it.",
  already_reviewed: "Thanks, you have already reviewed this product.",
};

export function ReviewForm({ productId }: { productId: string }) {
  const [state, setState] = React.useState<State>({ status: "loading" });
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/reviews/eligibility?productId=${productId}`)
      .then((r) => r.json())
      .then((j) => setState(j.data?.canReview ? { status: "ready" } : { status: "blocked", reason: j.data?.reason ?? "not_purchased" }))
      .catch(() => setState({ status: "blocked", reason: "not_purchased" }));
  }, [productId]);

  if (state.status === "loading") return null;
  if (state.status === "blocked") return <p className="text-sm text-muted-foreground">{REASONS[state.reason] ?? REASONS.not_purchased}</p>;
  if (state.status === "done") {
    return <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Thanks! Your review will appear after a quick check.</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error("Pick a star rating");
    if (body.trim().length < 10) return toast.error("Please write at least 10 characters");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not submit your review");
      setState({ status: "done" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold">Write a review</p>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star className={cn("size-7", (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="rv-title" className="mb-1.5 block">Title (optional)</Label>
        <Input id="rv-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="rv-body" className="mb-1.5 block">Your review</Label>
        <textarea
          id="rv-body"
          rows={4}
          maxLength={1500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Fit, fabric, size advice…"
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button>
    </form>
  );
}
