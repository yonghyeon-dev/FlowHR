import { z } from "zod";

export const upsertRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).nullable().optional(),
  permissions: z.array(z.string().min(1)).default([])
});

