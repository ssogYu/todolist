import { z } from "zod";

export const authSchema = z.object({
  username: z.string().trim().min(3).max(24),
  password: z.string().min(6).max(64),
});

export const todoCreateSchema = z.object({
  content: z.string().trim().min(1).max(140),
  note: z.string().trim().max(500).optional(),
  category: z.enum(["WORK", "PERSONAL"]).default("WORK"),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const todoPatchSchema = z
  .object({
    content: z.string().trim().min(1).max(140).optional(),
    note: z.string().trim().max(500).optional(),
    category: z.enum(["WORK", "PERSONAL"]).optional(),
    isDone: z.boolean().optional(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "缺少更新字段",
  });

export const expiredTodoActionSchema = z.object({
  action: z.enum(["moveToToday", "delete"]),
  todoIds: z.array(z.string().trim().min(1)).min(1),
});

export const groupSchema = z.object({
  name: z.string().trim().min(2).max(32),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().trim().min(6).max(12),
});
