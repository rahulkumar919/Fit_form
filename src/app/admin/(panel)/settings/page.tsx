import { getSettings } from "@/services/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { cloudinaryConfigured } from "@/lib/storage";
import { isGoogleConfigured } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

const real = (v: string | undefined, bad: RegExp) => !!v && !bad.test(v);

export default async function SettingsPage() {
  const settings = await getSettings();
  const integrations = [
    { name: "MongoDB", ok: real(process.env.MONGODB_URI, /^$/) && process.env.USE_REAL_DB === "true", hint: "Set MONGODB_URI and USE_REAL_DB=true." },
    { name: "Google sign-in (customers)", ok: isGoogleConfigured(), hint: "Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from Google Cloud Console." },
    { name: "Cashfree (online payments)", ok: real(process.env.CASHFREE_APP_ID, /PASTE|your/i) && real(process.env.CASHFREE_SECRET_KEY, /PASTE|your/i), hint: "Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY from Cashfree Dashboard → Settings → API Keys." },
    { name: "Razorpay (online payments)", ok: real(process.env.RAZORPAY_KEY_ID, /PASTE|your|x{4,}/i) && real(process.env.RAZORPAY_KEY_SECRET, /PASTE|your/i), hint: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from Razorpay Dashboard → Settings → API Keys." },
    { name: "Cloudinary (image CDN)", ok: cloudinaryConfigured(), hint: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." },
    { name: "Redis cache", ok: real(process.env.UPSTASH_REDIS_REST_URL, /your-url/) && real(process.env.UPSTASH_REDIS_REST_TOKEN, /^your-/), hint: "Optional. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." },
    { name: "Google Analytics 4", ok: real(process.env.NEXT_PUBLIC_GA4_ID, /X{4,}/), hint: "Optional. Set NEXT_PUBLIC_GA4_ID (G-…)." },
    { name: "Google Search Console", ok: real(process.env.NEXT_PUBLIC_GSC_VERIFICATION, /^$/), hint: "Optional. Set NEXT_PUBLIC_GSC_VERIFICATION to the HTML-tag code." },
  ];
  return <SettingsForm initial={settings} integrations={integrations} cloudinaryEnabled={cloudinaryConfigured()} />;
}
