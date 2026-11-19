import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWishlist extends Document {
  userId: Types.ObjectId | string;
  productIds: string[];
  comboIds: string[];
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: [String],
    comboIds: [String],
  },
  { timestamps: true },
);


export const WishlistModel: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>("Wishlist", WishlistSchema);
