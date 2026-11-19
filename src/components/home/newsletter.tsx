"use client";
import { useState } from "react";
import { Mail, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WelcomeCoupon { code: string; description: string; firstOrderOnly: boolean; maxDiscount: number | null }

export function Newsletter({ title = "Get 10% off your first order", subtitle = "Join the list for new drops, styling tips and exclusive combo offers.", preview = false }: { title?: string; subtitle?: string; preview?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ coupon: WelcomeCoupon | null } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy || preview) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.message ?? "Could not subscribe. Please try again.");
        return;
      }
      setDone({ coupon: json.data.coupon });
      setEmail("");
    } catch {
      setError("You seem to be offline. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy the code");
    }
  };

  return (
    <section className="container-store py-16 md:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center text-background md:px-12">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 size-48 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="relative mx-auto max-w-xl">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-background/10">
            <Mail className="size-6 text-amber-300" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-background/70">{subtitle}</p>}
          {done ? (
            <div role="status" className="mt-6 flex flex-col items-center gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
                <Check className="size-4" /> You&apos;re subscribed.
              </p>
              {done.coupon && (
                <>
                  <button
                    type="button"
                    onClick={() => copy(done.coupon!.code)}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed border-amber-300/70 px-4 py-2 font-mono text-lg font-semibold tracking-widest text-amber-300 transition hover:bg-amber-300/10"
                    aria-label={`Copy coupon code ${done.coupon.code}`}
                  >
                    {done.coupon.code} <Copy className="size-4" />
                  </button>
                  <p className="text-xs text-background/60">
                    {done.coupon.description}
                    {done.coupon.maxDiscount ? ` (up to ₹${done.coupon.maxDiscount.toLocaleString("en-IN")})` : ""}. Apply it at checkout.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <Input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-invalid={!!error}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="border-background/20 bg-background/10 text-background placeholder:text-background/50 focus-visible:border-amber-300"
              />
              <Button type="submit" disabled={busy} className="bg-amber-300 text-foreground hover:bg-amber-200 sm:shrink-0">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
              </Button>
            </form>
          )}
          {error && <p id="newsletter-error" role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
          <p className="mt-3 text-xs text-background/50">No spam. Unsubscribe anytime by replying to any of our emails.</p>
        </div>
      </div>
    </section>
  );
}
