import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer:   { type: String, required: true, trim: true, maxlength: 2000 },
    order:    { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FaqSchema.index({ order: 1, createdAt: 1 });

export const FaqModel: Model<IFaq> =
  mongoose.models.Faq ?? mongoose.model<IFaq>("Faq", FaqSchema);
