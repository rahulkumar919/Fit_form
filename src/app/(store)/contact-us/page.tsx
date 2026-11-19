import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock, Package, ChevronRight } from "lucide-react";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Contact Us | MelaMart",
  description: "Get in touch with MelaMart. We're here to help with your orders, returns and any questions.",
  alternates: { canonical: "/contact-us" },
};
export const revalidate = 3600;

export default async function ContactPage() {
  const { storeName, supportPhone } = await getSettings();
  const wa = supportPhone.replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hi ${storeName}, I need help with my order.`);

  return (
    <div className="container-store max-w-3xl py-10 sm:py-14">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Contact Us</span>
      </nav>

      <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        We&apos;re here to help. Reach out via email or WhatsApp and we&apos;ll get back to you as quickly as we can.
      </p>

      {/* contact cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* email */}
        <a
          href="mailto:support@melamart.in"
          className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:border-foreground hover:shadow-sm"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-muted transition group-hover:bg-foreground/5">
            <Mail className="size-5 text-foreground" aria-hidden />
          </span>
          <div>
            <p className="font-semibold text-foreground">Email</p>
            <p className="mt-0.5 text-sm text-muted-foreground">For orders, returns and general queries.</p>
          </div>
          <p className="mt-auto text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
            support@melamart.in
          </p>
        </a>

        {/* whatsapp */}
        {wa.length >= 10 && (
          <a
            href={`https://wa.me/${wa}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:border-emerald-500 hover:shadow-sm"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 transition group-hover:bg-emerald-100">
              <MessageCircle className="size-5 text-emerald-600" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-foreground">WhatsApp</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Quick replies Mon–Sat, 10 am–6 pm IST.</p>
            </div>
            <p className="mt-auto text-sm font-medium text-emerald-700">{supportPhone}</p>
          </a>
        )}
      </div>

      {/* response time note */}
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/50 p-4">
        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          We usually respond to emails within <strong className="text-foreground">24 hours</strong> on business days.
          For faster help, WhatsApp is the quickest option.
        </p>
      </div>

      {/* order help shortcut */}
      <div className="mt-8">
        <h2 className="font-serif text-xl font-bold">Need help with an order?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most order-related issues (tracking, cancellations, returns) can be handled directly from your account.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/orders"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <Package className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">Track or manage my order</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/refund-policy"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-4 place-items-center text-muted-foreground" aria-hidden>↩</span>
              <span className="text-sm font-medium">Refund &amp; return policy</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-bold">Common questions</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {[
            {
              q: "Where is my order?",
              a: "You'll receive a tracking number by email/WhatsApp once your order ships (1–3 days after placing). You can also track it from My Orders.",
            },
            {
              q: "Can I cancel my order?",
              a: "Yes, before it's dispatched. Go to My Orders and tap Cancel. Once dispatched, please initiate a return after delivery.",
            },
            {
              q: "How do I return an item?",
              a: "Contact us within 7 days of delivery with your order number and photos of the issue. We'll guide you through the return process.",
            },
            {
              q: "How long does delivery take?",
              a: "Metro cities: 4–6 days. Other cities: 5–8 days. Remote areas: 8–12 days after dispatch.",
            },
            {
              q: "Is Cash on Delivery available?",
              a: "Yes, COD is available for most orders across India. No extra charge.",
            },
          ].map((faq) => (
            <details key={faq.q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
