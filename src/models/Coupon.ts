import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  description: string;
  type: "percentage" | "flat";
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  /** Only redeemable by customers with no previous (non-cancelled) order. */
  firstOrderOnly: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0 },
    maxDiscount: Number,
    isActive: { type: Boolean, default: true },
    usageLimit: Number,
    usageCount: { type: Number, default: 0 },
    firstOrderOnly: { type: Boolean, default: false },
    expiresAt: Date,
  },
  { timestamps: true },
);


export const CouponModel: Model<ICoupon> =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>("Coupon", CouponSchema);
