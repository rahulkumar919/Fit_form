import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Limit to common breakpoints — fewer variants = faster first load
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
    // Cache optimised images for 30 days (default is 60s on some hosts)
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  // Empty turbopack config silences the "webpack config but no turbopack config" error.
  // Node.js built-ins (fs, path, crypto …) are handled natively by Turbopack on the
  // server; server-only imports on the client are caught at build time by the
  // `import "server-only"` guards added to lib/storage and services/settings.
  turbopack: {},
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // never cache admin or personal pages in shared caches
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      // Static files — cache aggressively in browsers (hashed filenames ensure freshness)
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Public images, icons, manifests
      {
        source: "/:path(.*\\.(?:png|jpg|jpeg|webp|avif|ico|svg|woff2|woff))",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
