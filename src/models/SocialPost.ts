import mongoose, { Schema, Model, Types } from "mongoose";

/**
 * An Instagram reel or post featured on the storefront ("Shop the Reel" + "Follow the looks").
 * Each item links to ITS OWN Instagram URL and can link to a combo/product to shop the look.
 */
export interface ISocialPost {
  kind: "reel" | "post";
  /** Canonical https://www.instagram.com/(reel|p)/<code>/ */
  instagramUrl: string;
  /** Cover image (thumbnail / video poster). */
  image: string;
  /** Optional uploaded MP4/WebM of the reel for inline playback. Without it the official Instagram embed is used. */
  video: string;
  caption: string;
  linkType: "none" | "combo" | "product";
  linkId?: Types.ObjectId | null;
  showInReels: boolean;
  showInGallery: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>(
  {
    kind: { type: String, enum: ["reel", "post"], default: "reel" },
    instagramUrl: { type: String, required: true },
    image: { type: String, required: true },
    video: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 120 },
    linkType: { type: String, enum: ["none", "combo", "product"], default: "none" },
    linkId: { type: Schema.Types.ObjectId, default: null },
    showInReels: { type: Boolean, default: true },
    showInGallery: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
SocialPostSchema.index({ isActive: 1, order: 1 });

export const SocialPostModel: Model<ISocialPost> =
  (mongoose.models.SocialPost as Model<ISocialPost>) ?? mongoose.model<ISocialPost>("SocialPost", SocialPostSchema);
