import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100)
});

export const createEmployeeSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional()
});

export const updateEmployeeSchema = z
  .object({
    organizationId: z.string().min(1).nullable().optional(),
    name: z.string().min(1).max(100).nullable().optional(),
    email: z.string().email().nullable().optional(),
    active: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.organizationId !== undefined ||
      value.name !== undefined ||
      value.email !== undefined ||
      value.active !== undefined,
    { message: "at least one field is required" }
  );

const queryBoolean = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const listEmployeesQuerySchema = z.object({
  active: queryBoolean.optional(),
  organizationId: z.string().min(1).optional()
});

