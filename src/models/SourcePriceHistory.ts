import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISourcePriceHistory extends Document {
  supplierProductId: Types.ObjectId | string;
  date: Date;
  sourcePrice: number;
  note: string;
}

const SourcePriceHistorySchema = new Schema<ISourcePriceHistory>(
  {
    supplierProductId: { type: Schema.Types.ObjectId, ref: "SupplierProduct", required: true },
    date: { type: Date, default: () => new Date() },
    sourcePrice: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: false },
);

SourcePriceHistorySchema.index({ supplierProductId: 1, date: -1 });

export const SourcePriceHistoryModel: Model<ISourcePriceHistory> =
  mongoose.models.SourcePriceHistory ??
  mongoose.model<ISourcePriceHistory>("SourcePriceHistory", SourcePriceHistorySchema);
