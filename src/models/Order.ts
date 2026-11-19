import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export interface IOrder extends Document {
  orderNumber: string;
  /** null for guest orders */
  userId: Types.ObjectId | string | null;
  /** Set only for guest orders — a random token used in the public tracking URL */
  guestTrackingToken?: string;
  /** ISO timestamp written once when the confirmation email is successfully sent.
   *  Used as an idempotency guard: never send twice. */
  emailSentAt?: Date | null;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** For partial_cod: advance charged via Razorpay (rupees, 2 decimal precision) */
  advanceAmount?: number;
  /** For partial_cod: amount still owed at delivery (rupees) */
  remainingAmount?: number;
  /** Set by admin when they collect the remaining COD amount at delivery */
  codCollectedAt?: Date | null;
  codCollectedBy?: string;    // admin email who marked it collected
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  items: {
    refId: string;
    kind: "product" | "combo";
    name: string;
    image: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;         // price at order-time (snapshot, never trust client)
    selections?: { productId: string; size: string; color: string }[];
  }[];
  address: {
    label: string;
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  couponCode?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  fulfillments: {
    sourceSupplier: string;
    meeshoOrderId: string;
    status: "pending" | "ordered" | "shipped" | "delivered";
    trackingId?: string;
    carrier?: string;
    sourceCost: number;
    placedAt: Date;
  }[];
  estimatedProfit: number;
  attribution?: {
    source: string;
    medium: string;
    campaign: string;
    linkCode: string;
    landingPath: string;
    visitorId: string;
    sessionId: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    refId: { type: String, required: true },
    kind: { type: String, enum: ["product", "combo"], required: true },
    name: String,
    image: String,
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    selections: [{ productId: String, size: String, color: String }],
  },
  { _id: false },
);

const FulfillmentSchema = new Schema(
  {
    sourceSupplier: String,
    meeshoOrderId: { type: String, default: "" },
    status: { type: String, enum: ["pending", "ordered", "shipped", "delivered"], default: "pending" },
    trackingId: String,
    carrier: String,
    sourceCost: { type: Number, default: 0 },
    placedAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const AddressSnapshotSchema = new Schema(
  {
    label: String,
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestTrackingToken: { type: String, sparse: true, index: true },
    emailSentAt: { type: Date, default: null },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: ["new", "pending_sourcing", "meesho_ordered", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "new",
    },
    paymentMethod: { type: String, enum: ["cod", "razorpay", "cashfree", "partial_cod"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded", "partially_paid"], default: "pending" },
    advanceAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    codCollectedAt: { type: Date, default: null },
    codCollectedBy: { type: String, default: "" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    cashfreeOrderId: String,
    cashfreePaymentId: String,
    items: [OrderItemSchema],
    address: { type: AddressSnapshotSchema, required: true },
    couponCode: String,
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    fulfillments: [FulfillmentSchema],
    estimatedProfit: { type: Number, default: 0 },
    attribution: {
      source: { type: String, default: "direct" },
      medium: { type: String, default: "" },
      campaign: { type: String, default: "" },
      linkCode: { type: String, default: "" },
      landingPath: { type: String, default: "" },
      visitorId: { type: String, default: "" },
      sessionId: { type: String, default: "" },
    },
    notes: String,
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ cashfreeOrderId: 1 });
OrderSchema.index({ "attribution.source": 1, createdAt: -1 });
OrderSchema.index({ "attribution.linkCode": 1 });

export const OrderModel: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

/** Generate FF-XXXXX order number */
export function generateOrderNumber(): string {
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `FF-${rand}`;
}
