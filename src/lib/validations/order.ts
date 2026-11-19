import { z } from "zod";

export const cartItemSchema = z.object({
  kind: z.enum(["product", "combo"]),
  refId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(10),
  size: z.string().optional(),
  color: z.string().optional(),
  selections: z.array(z.object({
    productId: z.string(),
    size: z.string(),
    color: z.string(),
  })).optional(),
  comboItems: z.array(z.object({
    name: z.string(),
    size: z.string(),
    color: z.string(),
  })).optional(),
});

export const createOrderSchema = z.object({
  // Address
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10).regex(/^[+]?[\d\s-]{10,15}$/),
  line1: z.string().min(5),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
  // Payment
  paymentMethod: z.enum(["razorpay", "cashfree", "partial_cod"]),
  razorpayOrderId: z.string().optional(),
  cashfreeOrderId: z.string().optional(),
  // Cart items — server re-validates prices
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  // Coupon code if applied
  couponCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["new", "pending_sourcing", "meesho_ordered", "processing", "shipped", "delivered", "cancelled", "returned"]),
  notes: z.string().optional(),
});

export const addFulfillmentSchema = z.object({
  sourceSupplier: z.string().min(1),
  meeshoOrderId: z.string().min(1),
  sourceCost: z.number().min(0),
  trackingId: z.string().optional(),
  carrier: z.string().optional(),
});
