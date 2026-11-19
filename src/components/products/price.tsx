import { formatINR, discountPercent, cn } from "@/lib/utils";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  className?: string;
  priceClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function Price({ price, compareAtPrice, className, priceClassName, size = "md" }: PriceProps) {
  const hasDiscount = !!compareAtPrice && compareAtPrice > price;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" } as const;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-foreground", sizes[size], priceClassName)}>
        {formatINR(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-sm" : "text-xs")}>
            {formatINR(compareAtPrice)}
          </span>
          <span className="text-xs font-semibold text-sale">
            {discountPercent(compareAtPrice, price)}% off
          </span>
        </>
      )}
    </div>
  );
}
