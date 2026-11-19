import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMediaAsset extends Document {
  name: string;
  url: string;
  provider: "server" | "cloudinary";
  storageKey: string;
  renditions: { name: string; url: string; width: number; height: number; bytes: number }[];
  width: number;
  height: number;
  sizeKb: number;
  originalSizeKb: number;
  mime: string;
  alt: string;
  blurDataURL: string;
  uploadedBy: string;
  createdAt: Date;
}

const RenditionSchema = new Schema(
  { name: String, url: String, width: Number, height: Number, bytes: Number },
  { _id: false },
);

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    provider: { type: String, enum: ["server", "cloudinary"], required: true },
    storageKey: { type: String, required: true },
    renditions: [RenditionSchema],
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    sizeKb: { type: Number, default: 0 },
    originalSizeKb: { type: Number, default: 0 },
    mime: { type: String, default: "image/webp" },
    alt: { type: String, default: "" },
    blurDataURL: { type: String, default: "" },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MediaAssetSchema.index({ createdAt: -1 });
MediaAssetSchema.index({ url: 1 });

export const MediaAssetModel: Model<IMediaAsset> =
  mongoose.models.MediaAsset ?? mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
