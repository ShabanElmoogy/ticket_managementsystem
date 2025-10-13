import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().trim().min(3, "Description must be at least 3 characters").max(2000, "Description must be at most 2000 characters"),
  boardId: z.string().min(1, "Board is required"),
  columnId: z.string().min(1, "Column is required"),
  assigneeId: z.string().optional().or(z.literal("")),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const),
  dueDate: z.date().nullable().optional(),
});

export type TaskFormSchema = typeof taskFormSchema;
export type TaskFormSchemaValues = z.infer<typeof taskFormSchema>;