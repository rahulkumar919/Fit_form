import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MelaMart — Men's Fashion Combos",
    short_name: "MelaMart",
    description: "Complete outfit combos for men — jeans, shirts, sneakers & more. Cash on Delivery, free shipping above ₹1,999.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3730a3",
    orientation: "portrait",
    lang: "en-IN",
    categories: ["shopping", "fashion"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/melamart.in.png", sizes: "1600x800", type: "image/png", label: "MelaMart homepage" },
    ],
  };
}
