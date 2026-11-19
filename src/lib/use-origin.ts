"use client";

import * as React from "react";

const subscribe = () => () => {};

/**
 * window.location.origin on the client, "" during SSR and hydration.
 * useSyncExternalStore keeps server and client markup identical without a setState-in-effect.
 */
export function useOrigin(): string {
  return React.useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
