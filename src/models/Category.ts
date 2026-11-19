import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  showInNav: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    productCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: true },
    showInNav: { type: Boolean, default: true },
  },
  { timestamps: true },
);


export const CategoryModel: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);
