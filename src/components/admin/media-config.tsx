"use client";

import * as React from "react";

export interface MediaConfig { defaultProvider: "server" | "cloudinary"; cloudinaryEnabled: boolean }

const Ctx = React.createContext<MediaConfig>({ defaultProvider: "server", cloudinaryEnabled: false });

export function MediaConfigProvider({ value, children }: { value: MediaConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMediaConfig = () => React.useContext(Ctx);
