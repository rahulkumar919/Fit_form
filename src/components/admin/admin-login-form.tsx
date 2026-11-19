"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaterBackdrop } from "@/components/admin/water-backdrop";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

/** Only allow redirects back into the admin area (prevents open redirects). */
function safeCallback(raw: string | null): string {
  if (raw && raw.startsWith("/admin") && !raw.startsWith("//") && !raw.startsWith("/admin/login")) return raw;
  return "/admin";
}

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const res = await signIn("admin-credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (!res || res.error) {
      // One generic message on purpose: never reveal whether the email exists.
      setError("Invalid email or password, or the account is temporarily locked.");
      return;
    }
    router.replace(safeCallback(params.get("callbackUrl")));
    router.refresh();
  };

  return (
    <div className="admin-canvas flex min-h-screen items-center justify-center overflow-hidden px-4 text-sky-950">
      <WaterBackdrop />
      <div className="glass relative w-full max-w-md rounded-3xl p-8">
        <div className="flex items-center gap-2">
          <span className="btn-glass grid size-9 place-items-center rounded-xl">
            <Store className="size-5" />
          </span>
          <span className="font-serif text-xl font-bold text-sky-950">
            Fit<span className="text-sky-700">And</span>Form
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-sky-950">Admin sign in</h1>
        <p className="mt-1 text-sm text-sky-950/70">Authorised staff only.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sky-950">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@yourdomain.com"
              aria-invalid={!!errors.email}
              className="border-sky-950/15 bg-white/60 text-sky-950 placeholder:text-sky-950/65"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sky-950">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="border-sky-950/15 bg-white/60 pr-10 text-sky-950 placeholder:text-sky-950/65"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-sky-950/70 hover:text-sky-950"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-700">{errors.password.message}</p>}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-100/80 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-glass w-full"
          >
            <Lock className="size-4" /> {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
