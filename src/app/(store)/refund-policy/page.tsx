import type { Metadata } from "next";
import { PolicyPage, generatePolicyMetadata } from "@/components/policy/policy-page";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = generatePolicyMetadata(
  "Refund & Return Policy",
  "MelaMart's hassle-free 7-day return and refund policy for men's fashion orders.",
  "/refund-policy",
);
export const revalidate = 3600;

export default async function RefundPolicyPage() {
  const { storeName, supportEmail, supportPhone, freeShippingThreshold } = await getSettings();
  const wa = supportPhone.replace(/\D/g, "");
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <PolicyPage title="Refund &amp; Return Policy" lastUpdated="November 2026">
      <p>
        At {storeName}, we want you to love what you ordered. If something is wrong, we will make it right.
        This policy explains your rights and how to initiate a return.
      </p>

      <h2>1. Return Window</h2>
      <p>
        You may request a return within <strong>7 days</strong> of the delivery date. After 7 days, returns are
        not accepted except for items with manufacturing defects.
      </p>

      <h2>2. Eligible Returns</h2>
      <p>Returns are accepted for the following reasons:</p>
      <ul>
        <li>Wrong item delivered (different product, colour or size from what you ordered).</li>
        <li>Item is defective, damaged or has a manufacturing fault.</li>
        <li>Item is not as described in the product listing.</li>
        <li>Size doesn't fit (exchange for a different size, subject to availability).</li>
      </ul>
      <h3>Non-returnable items</h3>
      <ul>
        <li>Items that have been worn, washed or altered.</li>
        <li>Items without original tags and packaging.</li>
        <li>Accessories (socks, belts, hats) for hygiene reasons.</li>
        <li>Sale items marked as "Final Sale".</li>
      </ul>

      <h2>3. How to Initiate a Return</h2>
      <ol>
        <li>Contact us within 7 days of delivery via
          {wa.length >= 10
            ? <> WhatsApp at <a href={`https://wa.me/${wa}`}>{supportPhone}</a></>
            : supportEmail
              ? <> email at <a href={`mailto:${supportEmail}`}>{supportEmail}</a></>
              : " our website"
          }.
        </li>
        <li>Provide your order number, item name, reason for return and 2–3 photographs of the issue.</li>
        <li>Our team will review your request within <strong>2 business days</strong> and share return instructions.</li>
        <li>Pack the item securely in its original packaging with all tags attached.</li>
        <li>Ship the item to the address we provide. Retain the courier receipt.</li>
      </ol>

      <h2>4. Pickup vs Self-Ship</h2>
      <ul>
        <li><strong>Defective / wrong item:</strong> We arrange a reverse pickup at no cost to you.</li>
        <li><strong>Size exchange or buyer's remorse:</strong> You bear the return shipping cost. We recommend using a tracked courier.</li>
      </ul>

      <h2>5. Refund Process</h2>
      <p>Once we receive and inspect the returned item:</p>
      <ul>
        <li><strong>Prepaid orders:</strong> Refund is processed to the original payment method within 5–7 business days.</li>
        <li><strong>COD orders:</strong> Refund is issued as a bank transfer (NEFT/IMPS). You will need to share your bank account details.</li>
        <li>In both cases you will receive a confirmation email/message when the refund is processed.</li>
      </ul>
      <p>Refunds do not include the shipping charge (₹49 or as applicable), unless the return is due to our error.</p>

      <h2>6. Exchange</h2>
      <p>
        We offer size exchanges (same style, different size) subject to availability. If the required size is
        unavailable, a full refund will be issued. Exchanges are processed once we receive the original item.
      </p>

      <h2>7. Cancellations</h2>
      <p>
        Orders can be cancelled for free before dispatch from the My Orders page. Once dispatched, the order
        cannot be cancelled — please initiate a return after delivery.
      </p>
      <p>
        For COD orders, refusing to accept a delivery without prior communication may result in a charge of ₹150
        to cover return-shipping costs.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about a return?{" "}
        {wa.length >= 10
          ? <a href={`https://wa.me/${wa}?text=Hi%20${storeName}%2C%20I%20want%20to%20return%20my%20order`}>WhatsApp us at {supportPhone}</a>
          : supportEmail
            ? <a href={`mailto:${supportEmail}`}>Email us at {supportEmail}</a>
            : "reach out via our website"
        }.
        We are available Monday–Saturday, 10 am–6 pm IST.
      </p>
    </PolicyPage>
  );
}
