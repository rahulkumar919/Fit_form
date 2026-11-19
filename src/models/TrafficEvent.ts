import mongoose, { Schema, Document, Model } from "mongoose";

export const EVENT_TYPES = [
  "link_click", "session_start", "page_view", "product_view", "combo_view",
  "add_to_cart", "begin_checkout", "purchase",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** One analytics event. Anonymous: random ids only, no IP or personal data. Auto-expires after 400 days. */
export interface ITrafficEvent extends Document {
  type: EventType;
  vid: string;
  sid: string;
  path: string;
  source: string;
  medium: string;
  campaign: string;
  linkCode: string;
  device: string;
  refId: string;
  value: number;
  orderId: string;
  createdAt: Date;
}

const TrafficEventSchema = new Schema<ITrafficEvent>(
  {
    type: { type: String, enum: EVENT_TYPES, required: true },
    vid: { type: String, default: "" },
    sid: { type: String, default: "" },
    path: { type: String, default: "" },
    source: { type: String, default: "direct" },
    medium: { type: String, default: "" },
    campaign: { type: String, default: "" },
    linkCode: { type: String, default: "" },
    device: { type: String, default: "desktop" },
    refId: { type: String, default: "" },
    value: { type: Number, default: 0 },
    orderId: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TrafficEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });
TrafficEventSchema.index({ type: 1, createdAt: -1 });
TrafficEventSchema.index({ linkCode: 1, type: 1 });

export const TrafficEventModel: Model<ITrafficEvent> =
  mongoose.models.TrafficEvent ?? mongoose.model<ITrafficEvent>("TrafficEvent", TrafficEventSchema);
