import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Customer review. Only customers with a delivered order for the product can
 * write one (`verified`), and it shows on the store only after admin approval.
 * Admin-created store testimonials have no userId/orderId.
 */
export interface IReview extends Document {
  productId: Types.ObjectId | string;
  userId: Types.ObjectId | string | null;
  orderId: Types.ObjectId | string | null;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  isApproved: boolean;
  source: "customer" | "store_testimonial";
  status: "pending" | "approved" | "rejected";
  images: string[];
  customerImage: string;
  helpfulCount: number;
  helpfulVoters: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true },
    body: { type: String, default: "", trim: true },
    verified: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    source: { type: String, enum: ["customer", "store_testimonial"], default: "customer" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    images: [String],
    customerImage: { type: String, default: "" },
    helpfulCount: { type: Number, default: 0 },
    helpfulVoters: [String],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Sync isApproved with status for backward compat
ReviewSchema.pre("save", function (next) {
  if (this.isModified("status") || this.isNew) {
    this.isApproved = this.status === "approved";
  } else if (this.isModified("isApproved")) {
    this.status = this.isApproved ? "approved" : "pending";
  }
  next();
});

// Partial unique index: one review per (productId, userId) for real customers only.
// userId: null (admin-created reviews) is excluded from this constraint so admins
// can add multiple reviews / testimonials for the same product.
ReviewSchema.index(
  { productId: 1, userId: 1 },
  {
    unique: true,
    sparse: false,
    partialFilterExpression: { userId: { $type: "objectId" } },
    name: "productId_1_userId_1_customers_only",
  },
);
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
// Legacy index kept for compat (non-unique version replaces the old unique one)
ReviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export const ReviewModel: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", ReviewSchema);
