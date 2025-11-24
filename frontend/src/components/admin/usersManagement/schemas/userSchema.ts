import { z } from "zod";

export const userFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .max(150, "Email must be at most 150 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .optional()
    .or(z.literal(""))
    .refine((val) => val === undefined || val === "" || (val.replace(/\D/g, "").length >= 11), {
      message: "Phone must be at least 11 digits",
    }),
  whatsappNotifications: z.boolean().optional(),
});

export type UserFormSchema = typeof userFormSchema;
export type UserFormSchemaValues = z.infer<typeof userFormSchema>;