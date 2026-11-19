import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .regex(/^[+]?[\d\s-]{10,15}$/, "Enter a valid phone number"),
  line1: z.string().min(5, "Enter your address"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Select your state"),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  paymentMethod: z.enum(["cashfree", "razorpay", "partial_cod"]),
  saveAddress: z.boolean().optional(),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
