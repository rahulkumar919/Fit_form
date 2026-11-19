"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toast host (light theme).
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      // On phones, sit above the sticky buy bar used on product/combo pages.
      mobileOffset={{ bottom: 84 }}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border bg-card text-card-foreground shadow-lg",
        },
      }}
      {...props}
    />
  );
}
