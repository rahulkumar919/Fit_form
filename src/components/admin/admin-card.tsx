import * as React from "react";
import { cn } from "@/lib/utils";

/** Glass surface for admin content blocks and tables. */
export function AdminCard({ className, children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("glass-strong overflow-hidden rounded-2xl text-sky-950", className)} {...props}>
      {children}
    </div>
  );
}

export function AdminCardHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex items-center justify-between border-b border-sky-950/10 px-5 py-4", className)} {...props} />
  );
}

export function AdminCardTitle({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("text-sm font-semibold text-sky-950", className)} {...props} />;
}

export function AdminCardContent({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-5 pt-4", className)} {...props} />;
}
