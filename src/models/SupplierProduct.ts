import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISupplierProduct extends Document {
  productId: Types.ObjectId | string;
  productName: string;
  meeshoUrl: string;
  meeshoRef: string;
  supplier: string;
  sourcePrice: number;
  sellingPrice: number;
  handlingCost: number;
  deliveryCost: number;
  otherCost: number;
  estimatedProfit: number;
  lastPriceChecked: Date;
  lastAvailabilityChecked: Date;
  available: boolean;
  notes: string;
  status: "linked" | "unlinked" | "price_changed" | "out_of_stock";
  createdAt: Date;
  updatedAt: Date;
}

const SupplierProductSchema = new Schema<ISupplierProduct>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    productName: { type: String, required: true },
    meeshoUrl: { type: String, required: true },
    meeshoRef: { type: String, default: "" },
    supplier: { type: String, default: "" },
    sourcePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    handlingCost: { type: Number, default: 0 },
    deliveryCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    estimatedProfit: { type: Number, default: 0 },
    lastPriceChecked: { type: Date, default: () => new Date() },
    lastAvailabilityChecked: { type: Date, default: () => new Date() },
    available: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["linked", "unlinked", "price_changed", "out_of_stock"],
      default: "linked",
    },
  },
  { timestamps: true },
);

SupplierProductSchema.index({ status: 1 });

export const SupplierProductModel: Model<ISupplierProduct> =
  mongoose.models.SupplierProduct ?? mongoose.model<ISupplierProduct>("SupplierProduct", SupplierProductSchema);
