"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const thumbCount = Array.isArray(props.value) ? props.value.length : Array.isArray(props.defaultValue) ? props.defaultValue.length : 1;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-foreground" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4 rounded-full border border-foreground bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 hover:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";

export { Slider };
