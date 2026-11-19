import type { Metadata } from "next";
import { PolicyPage, generatePolicyMetadata } from "@/components/policy/policy-page";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = generatePolicyMetadata(
  "Privacy Policy",
  "MelaMart's Privacy Policy explains how we collect, use and protect your personal data when you shop with us.",
  "/privacy",
);
export const revalidate = 3600;

export default async function PrivacyPage() {
  const { storeName, supportEmail, supportPhone } = await getSettings();
  const wa = supportPhone.replace(/\D/g, "");

  return (
    <PolicyPage title="Privacy Policy" lastUpdated="November 2026">
      <p>
        Your privacy matters to us. This Privacy Policy explains how {storeName} (<strong>melamart.in</strong>)
        collects, uses, stores and protects your personal information when you visit our website or place an order.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account &amp; order data:</strong> name, email address, phone number, delivery address.</li>
        <li><strong>Payment data:</strong> Online payments are processed by Cashfree Payments. We do not store your card number, UPI VPA or net-banking credentials.</li>
        <li><strong>Communications:</strong> messages you send us via email or WhatsApp.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Usage data:</strong> pages visited, products viewed, add-to-cart and purchase events.</li>
        <li><strong>Device data:</strong> browser type, operating system, IP address.</li>
        <li><strong>Cookies &amp; local storage:</strong> we use first-party cookies for your session, cart and attribution. No third-party advertising cookies are set.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Process and fulfil your orders.</li>
        <li>Send order confirmations and updates.</li>
        <li>Respond to your queries and support requests.</li>
        <li>Improve our website, products and services.</li>
        <li>Prevent fraud and maintain security.</li>
        <li>Send marketing emails (only if you have subscribed; you can unsubscribe at any time).</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal data. We share it only with service providers who help us operate our business:
      </p>
      <ul>
        <li><strong>Cashfree Payments</strong> — to process online transactions.</li>
        <li><strong>MongoDB Atlas</strong> — secure cloud database (AWS infrastructure).</li>
        <li><strong>Google (Firebase Analytics / GA4)</strong> — anonymised website analytics (optional).</li>
        <li><strong>Courier partners</strong> — name, phone and address to deliver your order.</li>
        <li><strong>WhatsApp / Meta</strong> — when you contact us via WhatsApp.</li>
      </ul>
      <p>All service providers are bound by data protection agreements and may not use your data for their own marketing.</p>

      <h2>4. Data Retention</h2>
      <p>
        We retain order data for a minimum of 3 years for accounting and legal purposes. Account data is retained
        until you request deletion. Analytics events are retained for up to 400 days.
      </p>

      <h2>5. Your Rights</h2>
      <p>Under applicable law you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account and data (subject to legal obligations).</li>
        <li>Withdraw consent for marketing communications at any time.</li>
      </ul>
      <p>To exercise these rights, contact us (details below).</p>

      <h2>6. Cookies</h2>
      <p>We use the following first-party cookies:</p>
      <ul>
        <li><strong>Session &amp; visitor ID</strong> — to link events in a single session.</li>
        <li><strong>Attribution</strong> — to record which link brought you to the site (30-day lifetime).</li>
        <li><strong>Auth session</strong> — to keep you signed in (7 days).</li>
      </ul>
      <p>
        You can clear cookies from your browser settings at any time. This will sign you out and reset your cart.
      </p>

      <h2>7. Security</h2>
      <p>
        We use HTTPS (TLS) for all data in transit, bcrypt for password hashing, and role-based access controls.
        Sensitive keys and secrets are never stored in source code.
      </p>

      <h2>8. Third-Party Links</h2>
      <p>
        Our website may link to Instagram, WhatsApp or other third-party platforms. We are not responsible for
        their privacy practices.
      </p>

      <h2>9. Children</h2>
      <p>
        Our website is not directed at children under 13. We do not knowingly collect personal data from children.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>We may update this policy periodically. The "Last updated" date at the top will reflect any changes.</p>

      <h2>11. Contact</h2>
      <p>
        Privacy queries:{" "}
        {supportEmail
          ? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          : wa.length >= 10
            ? <a href={`https://wa.me/${wa}`}>WhatsApp {supportPhone}</a>
            : "please reach out via our website"
        }.
      </p>
    </PolicyPage>
  );
}
