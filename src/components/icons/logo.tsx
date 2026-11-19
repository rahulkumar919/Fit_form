
import * as React from "react";

interface MelaLogoProps {
  className?: string;
}

export function MelaLogo({
  className = "h-14 w-auto",
}: MelaLogoProps) {
  return (
    <img
      src="/melamart.in.png"
      alt="MelaMart"
      className={`${className} object-contain`}
    />
  );
}
