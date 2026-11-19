import mongoose, { Schema, Model } from "mongoose";

/** Homepage hero slide. Managed in Admin → Homepage. */
export interface IBanner {
  title: string;
  subtitle: string;
  eyebrow: string;
  /** Desktop image (wide). Required. */
  image: string;
  /** Optional portrait image for phones; falls back to `image`. */
  mobileImage: string;
  alt: string;
  ctaLabel: string;
  /** Internal path, e.g. /combos or /shop/jeans or /l/abc123. */
  ctaHref: string;
  /** Up to 3 short trust points shown under the text (e.g. "Cash on Delivery"). */
  highlights: string[];
  /** Text colour: "dark" for light images, "light" for dark images. */
  theme: "dark" | "light";
  /** Soft gradient behind the text for readability. */
  overlay: boolean;
  order: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, default: "", maxlength: 80 },
    subtitle: { type: String, default: "", maxlength: 160 },
    eyebrow: { type: String, default: "", maxlength: 40 },
    image: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    alt: { type: String, default: "", maxlength: 160 },
    ctaLabel: { type: String, default: "", maxlength: 30 },
    ctaHref: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    overlay: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);
BannerSchema.index({ isActive: 1, order: 1 });

export const BannerModel: Model<IBanner> =
  (mongoose.models.Banner as Model<IBanner>) ?? mongoose.model<IBanner>("Banner", BannerSchema);
