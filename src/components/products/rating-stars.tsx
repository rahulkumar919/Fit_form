import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
  showCount?: boolean;
}

export function RatingStars({ rating, count, size = "sm", className, showCount = true }: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2;
  const px = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.floor(rounded);
          const half = rounded - i >= 0.5 && !filled;
          return (
            <Star
              key={i}
              className={cn(px, filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
              style={half ? { fill: "url(#half)", color: "#fbbf24" } : undefined}
            />
          );
        })}
      </div>
      <span className={cn("font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          ({count})
        </span>
      )}
    </div>
  );
}
