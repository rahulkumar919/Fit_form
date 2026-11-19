/**
 * Pure types and default values for store settings.
 * This file has ZERO Node.js / server-only dependencies so it is safe
 * to import from both server and client components.
 */

export type StorageProvider = "server" | "cloudinary";

export interface PartialCodSettings {
  enabled: boolean;
  /** "percentage" = advance is a % of order total; "fixed" = advance is a flat rupee amount */
  advanceType: "percentage" | "fixed";
  /** Percentage (1-100) or flat amount in rupees depending on advanceType */
  advanceValue: number;
  /** Minimum order total (₹) for Partial COD to be shown */
  minOrderAmount: number;
  /** Maximum order total (₹); 0 = no limit */
  maxOrderAmount: number;
  /** Minimum advance amount in rupees — if calculated advance is below this, use this floor */
  minAdvanceAmount: number;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  whatsappButton: boolean;
  codEnabled: boolean;
  activeGateway: "cashfree" | "razorpay" | "none";
  freeShippingThreshold: number;
  flatShipping: number;
  defaultStorage: StorageProvider;
  partialCod: PartialCodSettings;
}

export const DEFAULT_PARTIAL_COD: PartialCodSettings = {
  enabled: false,
  advanceType: "percentage",
  advanceValue: 15,
  minOrderAmount: 500,
  maxOrderAmount: 0,
  minAdvanceAmount: 99,
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "MelaMart",
  supportEmail: "",
  supportPhone: "",
  whatsappButton: false,
  codEnabled: true,
  activeGateway: "cashfree" as const,
  freeShippingThreshold: 1999,
  flatShipping: 49,
  defaultStorage: "server",
  partialCod: DEFAULT_PARTIAL_COD,
};
