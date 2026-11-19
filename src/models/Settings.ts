import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const SettingsModel: Model<ISettings> =
  mongoose.models.Settings ?? mongoose.model<ISettings>("Settings", SettingsSchema);
