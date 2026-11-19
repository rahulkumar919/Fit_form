/**
 * Order confirmation email — Nodemailer + Hostinger SMTP.
 *
 * Required env vars (set in .env.local):
 *   SMTP_HOST          smtp.hostinger.com
 *   SMTP_PORT          465
 *   SMTP_USER          no-reply@melamart.in
 *   SMTP_PASS          your-hostinger-email-password
 *   ORDER_EMAIL_FROM   FitAndForm <no-reply@melamart.in>   (optional)
 *   ORDER_EMAIL_REPLY  support@melamart.in                 (optional reply-to)
 *
 * Emails are fire-and-forget: a failure logs an error but never throws,
 * so a broken SMTP config can never cancel an already-confirmed order.
 *
 * Idempotency is enforced by the caller: check order.emailSentAt before calling.
 */

import nodemailer from "nodemailer";
import { formatINR } from "@/lib/utils";

/* ─── transporter (lazy singleton) ─── */

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST?.trim() || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,   // true for 465 (SSL), false for 587 (STARTTLS)
      auth: { user, pass },
    });
  }
  return _transporter;
}

function emailConfigured(): boolean {
  return !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

/* ─── types ─── */

export interface OrderEmailData {
  orderNumber: string;
  orderDate: string;          // ISO or formatted string
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentStatus: string;
  /** Partial COD: advance paid online (₹). Undefined for other payment methods. */
  advanceAmount?: number;
  /** Partial COD: remaining to pay at delivery (₹). Undefined for other payment methods. */
  remainingAmount?: number;
  items: {
    name: string;
    image: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    kind: "product" | "combo";
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingUrl: string;        // /orders  or  /track-order?token=xxx
  isGuest: boolean;
}

/* ─── HTML template ─── */

function buildEmailHtml(d: OrderEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fitandform.in";
  const logoUrl = `${appUrl}/icon-192.png`;

  const paymentLabel: Record<string, string> = {
    cod: "Cash on Delivery",
    razorpay: "Online (Razorpay)",
    cashfree: "Online (Cashfree)",
    partial_cod: "Partial COD (advance online + rest at delivery)",
  };
  const statusLabel: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    partially_paid: "Advance Paid",
  };

  const orderDateFmt = (() => {
    try { return new Date(d.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d.orderDate; }
  })();

  const itemsHtml = d.items.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:60px;vertical-align:top;padding-right:12px;">
              <img src="${item.image}" alt="${item.name}"
                width="56" height="56"
                style="border-radius:8px;object-fit:cover;display:block;border:1px solid #eee;" />
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#111;">${item.name}</p>
              ${item.kind === "product"
      ? `<p style="margin:4px 0 0;font-size:12px;color:#666;">${[item.size, item.color].filter(Boolean).join(" · ")} · Qty ${item.quantity}</p>`
      : `<p style="margin:4px 0 0;font-size:12px;color:#666;">Combo · Qty ${item.quantity}</p>`}
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111;">${formatINR(item.unitPrice * item.quantity)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  const addressLine = [
    d.address.line1,
    d.address.line2,
    d.address.city,
    d.address.state,
    d.address.pincode,
  ].filter(Boolean).join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Order Confirmed – FitAndForm</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="FitAndForm" width="48" height="48"
                style="border-radius:12px;display:inline-block;vertical-align:middle;margin-right:12px;" />
              <span style="font-size:22px;font-weight:700;color:#ffffff;vertical-align:middle;letter-spacing:-0.5px;">
                Fit<span style="color:#f59e0b;">And</span>Form
              </span>
            </td>
          </tr>

          <!-- ORDER CONFIRMED BANNER -->
          <tr>
            <td style="background:#ecfdf5;padding:20px 32px;text-align:center;border-bottom:1px solid #d1fae5;">
              <p style="margin:0;font-size:13px;color:#065f46;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                ✓ &nbsp;Order Confirmed
              </p>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:28px 32px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111;">
                Hello, ${d.customerName.split(" ")[0]}!
              </h1>
              <p style="margin:8px 0 0;font-size:15px;color:#555;line-height:1.6;">
                Your order has been successfully placed. We'll prepare it and keep you updated!
              </p>
            </td>
          </tr>

          <!-- ORDER DETAILS CARD -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:12px;color:#888;padding-bottom:4px;">Order ID</td>
                        <td style="font-size:12px;color:#888;padding-bottom:4px;text-align:right;">Date</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px;font-weight:700;color:#111;">#${d.orderNumber}</td>
                        <td style="font-size:14px;color:#333;text-align:right;">${orderDateFmt}</td>
                      </tr>
                      <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #e2e8f0;"></td></tr>
                      <tr>
                        <td style="font-size:12px;color:#888;padding-top:8px;">Payment</td>
                        <td style="font-size:12px;color:#888;padding-top:8px;text-align:right;">Status</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#333;">${paymentLabel[d.paymentMethod] ?? d.paymentMethod}</td>
                        <td style="text-align:right;">
                          <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;
                            background:${d.paymentStatus === "paid" ? "#ecfdf5" : "#fffbeb"};
                            color:${d.paymentStatus === "paid" ? "#065f46" : "#92400e"};">
                            ${statusLabel[d.paymentStatus] ?? d.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS -->
          <tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111;">Your items</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- PRICE SUMMARY -->
          <tr>
            <td style="padding:16px 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:13px;color:#555;padding:3px 0;">Subtotal</td>
                        <td style="font-size:13px;color:#333;text-align:right;padding:3px 0;">${formatINR(d.subtotal)}</td>
                      </tr>
                      ${d.discount > 0 ? `<tr>
                        <td style="font-size:13px;color:#059669;padding:3px 0;">Discount</td>
                        <td style="font-size:13px;color:#059669;text-align:right;padding:3px 0;">−${formatINR(d.discount)}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="font-size:13px;color:#555;padding:3px 0;">Shipping</td>
                        <td style="font-size:13px;color:#333;text-align:right;padding:3px 0;">${d.shipping === 0 ? "Free" : formatINR(d.shipping)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:8px;border-top:1px solid #e2e8f0;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:16px;font-weight:700;color:#111;padding-top:4px;">Total</td>
                        <td style="font-size:16px;font-weight:700;color:#111;text-align:right;padding-top:4px;">${formatINR(d.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DELIVERY ADDRESS -->
          <tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#111;">Delivery address</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;font-size:13px;color:#333;line-height:1.7;">
                    <strong style="color:#111;">${d.address.fullName}</strong><br/>
                    ${d.address.phone}<br/>
                    ${addressLine}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <a href="${appUrl}${d.trackingUrl}"
                style="display:inline-block;padding:14px 36px;background:#0f172a;color:#ffffff;
                  font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;
                  letter-spacing:0.2px;">
                Track your order →
              </a>
            </td>
          </tr>

          <!-- COD NOTE -->
          ${d.paymentMethod === "cod" ? `
          <tr>
            <td style="padding:16px 32px 0;">
              <p style="margin:0;font-size:12px;color:#888;text-align:center;background:#fffbeb;border-radius:8px;padding:10px 16px;border:1px solid #fde68a;">
                💳 You selected Cash on Delivery — please keep the exact amount ready when your order arrives.
              </p>
            </td>
          </tr>` : ""}

          <!-- PARTIAL COD BREAKDOWN -->
          ${d.paymentMethod === "partial_cod" && d.advanceAmount && d.remainingAmount ? `
          <tr>
            <td style="padding:16px 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#92400e;">
                      💳 Partial COD — payment summary
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:13px;color:#78350f;padding:3px 0;">Advance paid online ✓</td>
                        <td style="font-size:13px;font-weight:700;color:#065f46;text-align:right;padding:3px 0;">${formatINR(d.advanceAmount)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#78350f;padding:3px 0;">Pay at delivery</td>
                        <td style="font-size:13px;font-weight:700;color:#92400e;text-align:right;padding:3px 0;">${formatINR(d.remainingAmount)}</td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0;font-size:12px;color:#92400e;">
                      Please keep <strong>${formatINR(d.remainingAmount)}</strong> ready for the delivery person.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 32px 32px;border-top:1px solid #f0f0f0;margin-top:24px;">
              <p style="margin:0;font-size:13px;color:#888;text-align:center;line-height:1.7;">
                Thank you for shopping with <strong style="color:#0f172a;">FitAndForm</strong>!<br/>
                Need help? Email us at
                <a href="mailto:support@melamart.in" style="color:#2563eb;text-decoration:none;">support@melamart.in</a>
                or visit <a href="${appUrl}/contact-us" style="color:#2563eb;text-decoration:none;">our support page</a>.<br/><br/>
                <span style="font-size:11px;color:#aaa;">
                  You received this because you placed an order at fitandform.in.
                </span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── public API ─── */

/**
 * Send the order confirmation email.
 * Never throws — logs failures silently so a broken SMTP config
 * never invalidates an already-confirmed order.
 * Returns true if the email was sent, false otherwise.
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  if (!emailConfigured()) {
    console.info("[email] SMTP_USER / SMTP_PASS not configured — skipping confirmation email");
    return false;
  }
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = process.env.ORDER_EMAIL_FROM?.trim()
    ?? `FitAndForm <${process.env.SMTP_USER}>`;
  const replyTo = process.env.ORDER_EMAIL_REPLY?.trim()
    ?? process.env.SMTP_USER;

  const paymentVerb = data.paymentMethod === "cod" ? "COD" : "online";
  const subject = `Your FitAndForm Order is Confirmed! #${data.orderNumber}`;

  try {
    await transporter.sendMail({
      from,
      replyTo,
      to: data.customerEmail,
      subject,
      html: buildEmailHtml(data),
    });
    console.info(`[email] Confirmation sent to ${data.customerEmail} for order ${data.orderNumber} (${paymentVerb})`);
    return true;
  } catch (err) {
    console.error(`[email] Failed to send confirmation for ${data.orderNumber}:`, (err as Error).message);
    return false;
  }
}

/** Build the OrderEmailData from a Mongoose order document (lean or hydrated). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function orderToEmailData(order: any, isGuest: boolean): OrderEmailData {
  type Item = { name?: string; image?: string; size?: string; color?: string; quantity?: number; unitPrice?: number; kind?: string };
  type Addr = { fullName?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  const trackingUrl = isGuest && order.guestTrackingToken
    ? `/track-order?token=${order.guestTrackingToken as string}`
    : "/orders";

  return {
    orderNumber: order.orderNumber as string,
    orderDate: order.createdAt ? new Date(order.createdAt as string).toISOString() : new Date().toISOString(),
    customerName: order.customerName as string,
    customerEmail: order.customerEmail as string,
    paymentMethod: order.paymentMethod as string,
    paymentStatus: order.paymentStatus as string,
    items: ((order.items ?? []) as Item[]).map((i) => ({
      name: i.name ?? "",
      image: i.image ?? "",
      size: i.size ?? "",
      color: i.color ?? "",
      quantity: i.quantity ?? 1,
      unitPrice: i.unitPrice ?? 0,
      kind: (i.kind ?? "product") as "product" | "combo",
    })),
    subtotal: order.subtotal as number,
    discount: (order.discount as number) ?? 0,
    shipping: (order.shipping as number) ?? 0,
    total: order.total as number,
    address: {
      fullName: (order.address as Addr)?.fullName ?? (order.customerName as string),
      phone: (order.address as Addr)?.phone ?? "",
      line1: (order.address as Addr)?.line1 ?? "",
      line2: (order.address as Addr)?.line2 ?? "",
      city: (order.address as Addr)?.city ?? "",
      state: (order.address as Addr)?.state ?? "",
      pincode: (order.address as Addr)?.pincode ?? "",
    },
    trackingUrl,
    isGuest,
    advanceAmount: (order.advanceAmount as number | undefined) || undefined,
    remainingAmount: (order.remainingAmount as number | undefined) || undefined,
  };
}
