"use client";

import * as React from "react";
import { useOrigin } from "@/lib/use-origin";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { wide, PHOTO } from "@/lib/data/images";
import { safeRedirectPath } from "@/lib/auth/redirect";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access was denied. Please try again.",
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method.",
  Configuration: "Sign-in is not configured correctly. Please contact support.",
};

export function LoginClient({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = React.useState(false);
  const origin = useOrigin();
  const callbackUrl = safeRedirectPath(params.get("callbackUrl"), "/account", origin);
  const errorCode = params.get("error");
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? "Sign-in failed. Please try again.") : null;

  // Redirect if already logged in
  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <Image src={wide(PHOTO.man5, 1500, 1000)} alt="" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur sm:p-10">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Fit<span className="text-sale">And</span>Form
          </Link>
          <h1 className="mt-5 font-serif text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to track orders, save your wishlist and check out faster.
          </p>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}
          {!googleEnabled && (
            <p role="note" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Google sign-in is not configured yet. Add <code>AUTH_GOOGLE_ID</code> and <code>AUTH_GOOGLE_SECRET</code> to enable it.
            </p>
          )}

          <Button onClick={handleGoogle} disabled={loading || !googleEnabled} variant="outline" size="lg" className="mt-6 w-full bg-white">
            {loading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />SECURE SIGN-IN<div className="h-px flex-1 bg-border" />
          </div>

          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-foreground" /> We only use Google to verify your identity.</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-foreground" /> No password to remember — just one tap.</li>
          </ul>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
