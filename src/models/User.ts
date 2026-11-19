import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAddress {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: "customer" | "admin";
  phone?: string;
  emailVerified?: Date | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    label:     { type: String, default: "Home" },
    fullName:  { type: String, required: true },
    phone:     { type: String, required: true },
    line1:     { type: String, required: true },
    line2:     String,
    city:      { type: String, required: true },
    state:     { type: String, required: true },
    pincode:   { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const UserSchema = new Schema<IUser>(
  {
    name:          { type: String, required: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    image:         String,
    role:          { type: String, enum: ["customer", "admin"], default: "customer" },
    phone:         String,
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true },
);

// Add addresses as a separate path to avoid TypeScript conflict
UserSchema.add({ addresses: { type: [AddressSchema], default: [] } });


export const UserModel: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
