import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICombo extends Document {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  images: string[];
  video?: string;
  items: {
    productId: Types.ObjectId | string;
    name: string;
    slug: string;
    image: string;
    price: number;
    category: string;
    categoryLabel: string;
    description: string;
    sizes: string[];
    colors: { name: string; hex: string }[];
  }[];
  combinedPrice: number;
  comboPrice: number;
  availableSizes: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  isTrending: boolean;
  isBestSeller: boolean;
  reelRef?: string;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ColorSchema = new Schema({ name: String, hex: String }, { _id: false });

const ComboItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    slug: String,
    image: String,
    price: Number,
    category: String,
    categoryLabel: String,
    description: String,
    sizes: [String],
    colors: [ColorSchema],
  },
  { _id: false },
);

const ComboSchema = new Schema<ICombo>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [String],
    video: String,
    items: [ComboItemSchema],
    combinedPrice: { type: Number, required: true },
    comboPrice: { type: Number, required: true },
    availableSizes: [String],
    tags: [String],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    reelRef: String,
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true },
);

ComboSchema.index({ isActive: 1, isTrending: 1 });

export const ComboModel: Model<ICombo> =
  mongoose.models.Combo ?? mongoose.model<ICombo>("Combo", ComboSchema);
