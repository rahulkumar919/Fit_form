import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReelCampaign extends Document {
  name: string;
  reelUrl: string;
  shareLink: string;
  linkedType: "product" | "combo";
  linkedRef: string;
  clicks: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  status: "active" | "paused" | "ended";
  createdAt: Date;
  updatedAt: Date;
}

const ReelCampaignSchema = new Schema<IReelCampaign>(
  {
    name: { type: String, required: true },
    reelUrl: { type: String, default: "" },
    shareLink: { type: String, default: "" },
    linkedType: { type: String, enum: ["product", "combo"], required: true },
    linkedRef: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "paused", "ended"], default: "active" },
  },
  { timestamps: true },
);

export const ReelCampaignModel: Model<IReelCampaign> =
  mongoose.models.ReelCampaign ?? mongoose.model<IReelCampaign>("ReelCampaign", ReelCampaignSchema);
