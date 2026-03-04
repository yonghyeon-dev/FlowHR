import { z } from "zod";

const rolePermissionSchema = z.string().trim().min(1);

export const upsertRoleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  permissions: z.array(rolePermissionSchema).default([])
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().optional(),
  permissions: z.array(rolePermissionSchema).default([])
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    permissions: z.array(rolePermissionSchema).optional()
  })
  .refine(
    (value) => value.name !== undefined || value.description !== undefined || value.permissions !== undefined,
    {
      message: "at least one field is required"
    }
  );

export const assignRoleSchema = z.object({
  employeeId: z.string().trim().min(1),
  roleName: z.string().trim().min(1)
});

