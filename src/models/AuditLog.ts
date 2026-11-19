import mongoose, { Schema, Document, Model } from "mongoose";

/** Append-only record of important admin actions (who did what, when). */
export interface IAuditLog extends Document {
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
