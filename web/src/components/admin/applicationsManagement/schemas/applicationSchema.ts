import { z } from "zod";

export const applicationFormSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters"),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  version: z.string().trim().max(50, "Version must be at most 50 characters").optional().or(z.literal("")),
});