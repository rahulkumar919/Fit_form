import { z } from "zod";
import { LINK_CHANNELS } from "@/lib/tracking/source";

/** On-site path only: tracked links can never redirect to another domain. */
const destination = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\"), "Destination must be a path on this site, e.g. /combo/night-out-combo")
  .refine((v) => !/^\/(admin|api|l)(\/|$|\?)/.test(v), "Destination cannot be an admin, API or short-link URL");

export const linkInputSchema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Code: lowercase letters, numbers and single hyphens").min(2).max(40),
  name: z.string().trim().min(2, "Give the link a name").max(80),
  channel: z.enum(LINK_CHANNELS as [string, ...string[]]),
  campaign: z.string().trim().toLowerCase().max(60).regex(/^[a-z0-9_-]*$/, "Campaign: letters, numbers, _ and -"),
  destination,
  isActive: z.boolean(),
});

export type LinkInput = z.infer<typeof linkInputSchema>;
