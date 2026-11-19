/**
 * Cashfree Payments (server only).
 * API version: 2022-09-01
 *
 * Test keys  → sandbox.cashfree.com  (App ID starts with "TEST")
 * Live keys  → api.cashfree.com
 *
 * return_url note: only {order_id} is a valid template variable.
 * {order_token} was removed. Our MongoDB _id is a static query param.
 */
import crypto from "node:crypto";

/* ── helpers ──────────────────────────────────────────────── */

/** Detect test vs live from the App ID prefix. */
function isTestMode(): boolean {
  return (process.env.CASHFREE_APP_ID?.trim() ?? "").toUpperCase().startsWith("TEST");
}

function cfBaseUrl(): string {
  return isTestMode()
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";
}

function cfHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": "2022-09-01",
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
  };
}

/* ── public API ───────────────────────────────────────────── */

/** True when valid Cashfree credentials are set (test or live). */
export function cashfreeConfigured(): boolean {
  const appId = (process.env.CASHFREE_APP_ID ?? "").trim();
  const secret = (process.env.CASHFREE_SECRET_KEY ?? "").trim();
  if (!appId || !secret) return false;
  if (appId === "PASTE_NEW_APP_ID_HERE" || appId.toLowerCase().includes("your")) return false;
  // Both "cfsk_ma_test_…" and "cfsk_ma_prod_…" are valid.
  return secret.startsWith("cfsk_") && appId.length >= 20;
}

export interface CfOrder {
  /** Cashfree's cf_order_id (= our order number used as Cashfree's order_id). */
  cfOrderId: string;
  /** Payment session id — passed to the JS SDK. */
  paymentSessionId: string;
  orderAmount: number;
  /** Whether this was created against the sandbox. */
  sandbox: boolean;
}

export async function createCashfreeOrder(params: {
  mongoOrderId: string;  // our MongoDB _id (24-char hex)
  orderNumber: string;   // human order number, used as Cashfree's order_id
  amountRupees: number;
  customerPhone: string;
  customerEmail: string;
  customerName: string;
}): Promise<CfOrder> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const returnUrl = `${appUrl}/checkout/return?orderId=${params.mongoOrderId}&cf_order_id={order_id}`;

  const body = {
    order_id: params.orderNumber.slice(0, 50),
    order_amount: Math.round(params.amountRupees * 100) / 100,
    order_currency: "INR",
    customer_details: {
      customer_id: params.mongoOrderId,
      customer_phone: params.customerPhone.replace(/\D/g, "").slice(-10),
      customer_email: params.customerEmail,
      customer_name: params.customerName.slice(0, 100),
    },
    order_meta: { return_url: returnUrl },
    order_note: "MelaMart order",
  };

  const res = await fetch(`${cfBaseUrl()}/orders`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`Cashfree order creation failed: ${String(err?.message ?? res.status)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  return {
    cfOrderId: String(data.cf_order_id ?? params.orderNumber),
    paymentSessionId: String(data.payment_session_id),
    orderAmount: params.amountRupees,
    sandbox: isTestMode(),
  };
}

/** Fetch order status from Cashfree (orderId = our orderNumber = Cashfree's order_id). */
export async function getCashfreeOrder(orderId: string): Promise<{
  status: string;
  cf_order_id: string;
  order_amount: number;
}> {
  const res = await fetch(`${cfBaseUrl()}/orders/${orderId}`, { headers: cfHeaders() });
  if (!res.ok) throw new Error(`Cashfree order fetch failed: ${res.status}`);
  return res.json();
}

/** Verify a Cashfree webhook HMAC-SHA256 signature. */
export function verifyCashfreeWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY ?? "";
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
