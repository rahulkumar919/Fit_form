import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/auth/login-client";
import { isGoogleConfigured } from "@/lib/auth/google";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to MelaMart with Google.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient googleEnabled={isGoogleConfigured()} />
    </Suspense>
  );
}
