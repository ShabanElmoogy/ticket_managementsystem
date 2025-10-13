import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(150),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  applicationIds: z.array(z.string()).optional().default([]),
});

export type CustomerFormSchema = typeof customerFormSchema;
export type CustomerFormSchemaValues = z.infer<typeof customerFormSchema>;
