import type { Metadata } from "next";
import { PolicyPage, generatePolicyMetadata } from "@/components/policy/policy-page";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = generatePolicyMetadata(
  "Shipping Policy",
  "MelaMart shipping policy — delivery timelines, charges and tracking for men's fashion orders across India.",
  "/shipping-policy",
);
export const revalidate = 3600;

export default async function ShippingPolicyPage() {
  const { storeName, freeShippingThreshold, flatShipping, codEnabled } = await getSettings();
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <PolicyPage title="Shipping Policy" lastUpdated="November 2026">
      <p>
        {storeName} delivers across India. Here is everything you need to know about our shipping process.
      </p>

      <h2>1. Processing Time</h2>
      <p>
        Because we source items after you order (to keep prices low and reduce waste), orders are processed
        within <strong>1–3 business days</strong>. You will receive a dispatch notification once your order ships.
      </p>

      <h2>2. Delivery Timeline</h2>
      <ul>
        <li><strong>Metro cities</strong> (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata): 4–6 business days after dispatch.</li>
        <li><strong>Tier 2 &amp; Tier 3 cities:</strong> 5–8 business days after dispatch.</li>
        <li><strong>Remote areas / North-East / J&amp;K / Andaman:</strong> 8–12 business days after dispatch.</li>
      </ul>
      <p>
        These are estimates. Actual delivery times may vary due to courier delays, holidays or weather events.
      </p>

      <h2>3. Shipping Charges</h2>
      {freeShippingThreshold > 0 ? (
        <>
          <ul>
            <li><strong>Orders above {inr(freeShippingThreshold)}:</strong> FREE delivery.</li>
            <li><strong>Orders below {inr(freeShippingThreshold)}:</strong> {inr(flatShipping)} flat shipping charge.</li>
          </ul>
          <p>The applicable shipping charge is shown at checkout before you place the order.</p>
        </>
      ) : (
        <p>We offer <strong>free shipping</strong> on all orders.</p>
      )}

      <h2>4. Cash on Delivery (COD)</h2>
      {codEnabled ? (
        <p>
          COD is available on most orders across India. The delivery person will collect payment at the time of delivery.
          Please keep the exact amount ready. COD is not available on some remote pin codes.
        </p>
      ) : (
        <p>Cash on Delivery is currently unavailable. We accept online payments via Cashfree (UPI, cards, wallets).</p>
      )}

      <h2>5. Order Tracking</h2>
      <p>
        Once your order is shipped, you will receive a tracking number via your registered email or WhatsApp.
        You can also track your order from the <strong>My Orders</strong> page on our website.
      </p>

      <h2>6. Undeliverable Shipments</h2>
      <p>
        If a delivery attempt fails (incorrect address, recipient unavailable, or refused delivery), the courier
        will attempt delivery once more. If the package is returned to us undelivered:
      </p>
      <ul>
        <li>For prepaid orders: a full refund minus the return shipping cost (₹150) will be issued.</li>
        <li>For COD orders: no refund is issued as the order was never paid for. You may re-order at your convenience.</li>
      </ul>

      <h2>7. Damaged or Lost Shipments</h2>
      <p>
        If you receive a damaged package, please photograph the outer packaging before opening and contact us
        within 24 hours. We will file a claim with the courier and arrange a replacement or refund.
      </p>
      <p>
        If a shipment appears lost (no movement for 7+ business days), contact us and we will investigate with
        the courier. If confirmed lost, a replacement or full refund will be issued within 10 business days.
      </p>

      <h2>8. International Shipping</h2>
      <p>We currently ship only within India.</p>

      <h2>9. Contact</h2>
      <p>
        Shipping queries? See our <a href="/refund-policy">Refund &amp; Return Policy</a> or reach out via My Orders.
      </p>
    </PolicyPage>
  );
}
