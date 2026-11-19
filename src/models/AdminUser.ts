/**
 * AdminUser — email + password accounts for the admin dashboard.
 * Kept separate from customer `users` so a customer can never be
 * promoted to admin through the Google/OAuth flow.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  failedAttempts: number;
  lockUntil?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const AdminUserModel: Model<IAdminUser> =
  mongoose.models.AdminUser ?? mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
