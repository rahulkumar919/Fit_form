import mongoose, { Schema, Model } from "mongoose";

/** Newsletter opt-in. Stores only what's needed: the email, consent time and where they signed up. */
export interface ISubscriber {
  email: string;
  source: string;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    source: { type: String, default: "homepage", maxlength: 40 },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
  },
  { timestamps: true },
);

export const SubscriberModel: Model<ISubscriber> =
  (mongoose.models.Subscriber as Model<ISubscriber>) ?? mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);
