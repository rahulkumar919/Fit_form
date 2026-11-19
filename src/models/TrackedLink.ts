import mongoose, { Schema, Document, Model } from "mongoose";

/** A short, trackable link (e.g. /l/reel-denim) used in reels, DMs, bio, WhatsApp. */
export interface ITrackedLink extends Document {
  code: string;
  name: string;
  channel: string;
  campaign: string;
  destination: string;
  clicks: number;
  isActive: boolean;
  lastClickAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TrackedLinkSchema = new Schema<ITrackedLink>(
  {
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    channel: { type: String, required: true },
    campaign: { type: String, default: "" },
    destination: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastClickAt: { type: Date, default: null },
  },
  { timestamps: true },
);

TrackedLinkSchema.index({ createdAt: -1 });

export const TrackedLinkModel: Model<ITrackedLink> =
  mongoose.models.TrackedLink ?? mongoose.model<ITrackedLink>("TrackedLink", TrackedLinkSchema);
