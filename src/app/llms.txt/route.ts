/**
 * GET /llms.txt
 *
 * An informational plain-text resource for AI assistants describing
 * MelaMart's public content and structure.
 *
 * This is NOT a ranking factor or guarantee of indexing — it is a
 * voluntary, human-readable guide for AI tools that may read it.
 */

import { siteUrl } from "@/lib/seo";

export const revalidate = 86400; // 24 hours

export async function GET() {
  const base = siteUrl();
  const content = `# MelaMart — Men's Fashion E-Commerce

> MelaMart (melamart.in) sells complete men's outfit combos and individual fashion items — jeans, shirts, t-shirts, sneakers, shoes and accessories — across India.

## About

MelaMart curates head-to-toe outfit combos for men at affordable prices. Every combo is styled and priced to give a complete look at better value than buying pieces separately. Free shipping on orders above ₹1,999, easy returns.

## Main sections

- Homepage: ${base}/
- Outfit Combos: ${base}/combos
- Jeans: ${base}/shop/jeans
- Shirts: ${base}/shop/shirts
- T-Shirts: ${base}/shop/t-shirts
- Shoes: ${base}/shop/shoes
- Sneakers: ${base}/shop/sneakers
- Accessories: ${base}/shop/accessories
- All Products: ${base}/shop/all-products

## Policies

- Shipping Policy: ${base}/shipping-policy
- Refund & Return Policy: ${base}/refund-policy
- Privacy Policy: ${base}/privacy
- Terms & Conditions: ${base}/terms

## Contact

- Website: ${base}/contact-us
- Instagram: https://www.instagram.com/melamart.in/

## Technical

- Sitemap: ${base}/sitemap.xml
- Robots: ${base}/robots.txt
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
