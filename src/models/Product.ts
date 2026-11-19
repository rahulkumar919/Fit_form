import mongoose, { Schema, Document, Model } from "mongoose";
import type { ProductCategorySlug, ProductStatus } from "@/types";

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: ProductCategorySlug;
  categoryLabel: string;
  description: string;
  highlights: string[];
  material: string;
  care: string;
  price: number;
  compareAtPrice?: number;
  currency: "INR";
  images: string[];
  variants: {
    color: string;
    colorHex: string;
    images: string[];
    sizes: { size: string; inStock: boolean; available: number }[];
  }[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  /** Admin-set manual social-proof overrides shown when real data is 0 */
  manualRating?: number;
  manualReviewCount?: number;
  manualSoldCount?: number;
  status: ProductStatus;
  isNewArrival: boolean;     // renamed from isNew (conflicts with Mongoose built-in)
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedOffer: boolean;
  sourceRef?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SizeStockSchema = new Schema(
  { size: String, inStock: { type: Boolean, default: true }, available: { type: Number, default: 0 } },
  { _id: false },
);

const ColorSchema = new Schema({ name: String, hex: String }, { _id: false });

const VariantSchema = new Schema(
  {
    color: { type: String, required: true },
    colorHex: { type: String, default: "#000000" },
    images: [String],
    sizes: [SizeStockSchema],
  },
  { _id: true },
);

// Use Schema.Types definition cast to avoid strict property conflicts
const ProductSchema = new Schema<IProduct>(
  {
    name:          { type: String, required: true },
    slug:          { type: String, required: true, unique: true, lowercase: true },
    category:      { type: String, required: true },
    categoryLabel: { type: String, required: true },
    description:   { type: String, default: "" },
    highlights:    [String],
    material:      { type: String, default: "" },
    care:          { type: String, default: "" },
    price:         { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    currency:      { type: String, default: "INR" },
    images:        [String],
    variants:      [VariantSchema],
    sizes:         [String],
    colors:        [ColorSchema],
    rating:        { type: Number, default: 0 },
    reviewCount:   { type: Number, default: 0 },
    manualRating:      { type: Number, default: 0 },
    manualReviewCount: { type: Number, default: 0 },
    manualSoldCount:   { type: Number, default: 0 },
    status:        { type: String, enum: ["active", "draft", "archived"], default: "draft" },
    isNewArrival:  { type: Boolean, default: false },
    isBestSeller:  { type: Boolean, default: false },
    isTrending:    { type: Boolean, default: false },
    isLimitedOffer:{ type: Boolean, default: false },
    sourceRef:     String,
    tags:          [String],
    seoTitle:      String,
    seoDescription:String,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note on the cast below
  } as any, // cast needed because Mongoose v8 strict typing conflicts with 'isNew' built-in
  { timestamps: true },
);

ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ status: 1, isBestSeller: 1 });
ProductSchema.index({ status: 1, isNewArrival: 1 });
ProductSchema.index({ status: 1, isTrending: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: "text", description: "text" });

export const ProductModel: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
