import type { Metadata } from "next";
import { PolicyPage, generatePolicyMetadata } from "@/components/policy/policy-page";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = generatePolicyMetadata(
  "Terms & Conditions",
  "Read the Terms and Conditions for shopping on MelaMart — men's fashion combos and clothing delivered across India.",
  "/terms",
);
export const revalidate = 3600;

export default async function TermsPage() {
  const { storeName, supportEmail, supportPhone } = await getSettings();
  const wa = supportPhone.replace(/\D/g, "");
  const contact = supportEmail || (wa.length >= 10 ? `wa.me/${wa}` : null);

  return (
    <PolicyPage title="Terms &amp; Conditions" lastUpdated="November 2026">
      <p>
        Welcome to {storeName} (<strong>melamart.in</strong>). By browsing or placing an order on our website,
        you agree to be bound by the following terms and conditions. Please read them carefully before purchasing.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li><strong>"{storeName}"</strong> or <strong>"we"</strong> refers to the owner and operator of melamart.in.</li>
        <li><strong>"You"</strong> or <strong>"Customer"</strong> refers to any person who accesses or purchases from our website.</li>
        <li><strong>"Products"</strong> refers to the clothing, footwear, accessories and outfit combos listed on our platform.</li>
      </ul>

      <h2>2. Acceptance of Terms</h2>
      <p>
        By using this website you confirm that you are at least 18 years of age and are legally capable of entering
        into a binding contract. If you are placing an order on behalf of someone else, you warrant that you have
        the authority to do so.
      </p>

      <h2>3. Products &amp; Availability</h2>
      <p>
        All products are subject to availability. We source items to order, and availability is confirmed before dispatch.
        In rare cases where an item becomes unavailable after your order, we will notify you within 48 hours and offer
        a full refund or an alternative.
      </p>
      <p>
        Product images are for illustrative purposes. Actual colour may vary slightly due to photography, screen
        calibration and print-run variations.
      </p>

      <h2>4. Pricing</h2>
      <p>
        All prices are in Indian Rupees (₹) and are inclusive of applicable GST. Prices may change without notice,
        but the price at the time of placing your order is the price you will be charged. Shipping charges (if any)
        are shown separately at checkout.
      </p>

      <h2>5. Orders &amp; Payment</h2>
      <ul>
        <li>An order is accepted when you receive an order confirmation from us.</li>
        <li>We accept Cash on Delivery (COD) and online payments via Cashfree (UPI, debit/credit cards, net banking, wallets).</li>
        <li>For COD orders, payment is collected at the time of delivery. Refusal to accept the package may result in a
          cancellation fee to cover return shipping.</li>
        <li>We reserve the right to cancel any order for fraud prevention, pricing errors or supply issues. A full refund will be issued in such cases.</li>
      </ul>

      <h2>6. Cancellations</h2>
      <p>
        You may cancel your order before it is dispatched from the My Orders page. Once dispatched, cancellation
        is not possible; however, you may request a return after delivery as per our{" "}
        <a href="/refund-policy">Refund &amp; Return Policy</a>.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        All content on this website — including text, images, logos, product descriptions and graphics — is the
        property of {storeName} or its content suppliers and is protected by applicable intellectual property laws.
        You may not reproduce, distribute or commercially exploit any content without our express written consent.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        {storeName} shall not be liable for any indirect, incidental or consequential damages arising from the use
        of our website or products. Our liability is limited to the purchase price of the product(s) in question.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction
        of the courts in Haryana, India.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the website after changes are posted constitutes
        your acceptance of the updated terms.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        For any queries regarding these terms, please contact us
        {contact ? <> at <a href={supportEmail ? `mailto:${supportEmail}` : `https://wa.me/${wa}`}>{supportEmail || `WhatsApp ${supportPhone}`}</a></> : " through our website"}.
      </p>
    </PolicyPage>
  );
}
