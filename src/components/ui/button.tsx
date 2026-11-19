import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        accent: "bg-foreground text-background hover:bg-foreground/90 shadow-sm",
        outline: "border border-border bg-background hover:bg-muted text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        sale: "bg-sale text-sale-foreground hover:bg-sale/90 shadow-sm",
        adminAccent: "bg-admin-accent text-admin-sidebar hover:bg-admin-accent-strong shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
