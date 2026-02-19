import { z } from "zod";

import { actorRoles } from "@/lib/actor";

const isoDateTime = z.string().datetime({ offset: true });
const actorRoleSchema = z.enum(actorRoles);

export const approvalDomainValues = ["ATTENDANCE", "LEAVE", "PAYROLL"] as const;
export const approvalDomainSchema = z.enum(approvalDomainValues);

export const readApprovalPolicyQuerySchema = z.object({
  organizationId: z.string().min(1).optional()
});

export const upsertApprovalPolicySchema = z.object({
  organizationId: z.string().min(1).optional(),
  attendanceApproverRole: actorRoleSchema,
  leaveApproverRole: actorRoleSchema,
  payrollApproverRole: actorRoleSchema
});

export const listApprovalDelegationsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  active: z.boolean().optional(),
  delegateActorId: z.string().min(1).optional()
});

export const createApprovalDelegationSchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema,
  delegatorRole: actorRoleSchema,
  delegateActorId: z.string().min(1),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  reason: z.string().max(1000).optional(),
  active: z.boolean().optional()
});

const approverRolesSchema = z
  .array(actorRoleSchema)
  .min(1)
  .max(5)
  .refine((value) => new Set(value).size === value.length, "approverRoles must not contain duplicates");

const payrollGrossPayBoundSchema = z.number().int().nonnegative();

export const listApprovalLineTemplatesQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  active: z.boolean().optional()
});

export const createApprovalLineTemplateSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    name: z.string().min(1).max(120),
    domain: approvalDomainSchema,
    approverRoles: approverRolesSchema,
    payrollGrossPayMinKrw: payrollGrossPayBoundSchema.nullable().optional(),
    payrollGrossPayMaxKrw: payrollGrossPayBoundSchema.nullable().optional(),
    active: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    const hasPayrollCondition =
      value.payrollGrossPayMinKrw !== undefined ||
      value.payrollGrossPayMaxKrw !== undefined;
    if (hasPayrollCondition && value.domain !== "PAYROLL") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "payrollGrossPayMinKrw/payrollGrossPayMaxKrw are only allowed for PAYROLL domain",
        path: ["domain"]
      });
    }
    if (
      value.payrollGrossPayMinKrw !== null &&
      value.payrollGrossPayMinKrw !== undefined &&
      value.payrollGrossPayMaxKrw !== null &&
      value.payrollGrossPayMaxKrw !== undefined &&
      value.payrollGrossPayMinKrw > value.payrollGrossPayMaxKrw
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "payrollGrossPayMaxKrw must be greater than or equal to payrollGrossPayMinKrw",
        path: ["payrollGrossPayMaxKrw"]
      });
    }
  });

export const expireApprovalDelegationsSchema = z.object({
  organizationId: z.string().min(1).optional(),
  expiresBeforeAt: isoDateTime.optional(),
  dryRun: z.boolean().default(false)
});

export const updateApprovalDelegationSchema = z.object({
  delegateActorId: z.string().min(1).optional(),
  startsAt: isoDateTime.optional(),
  endsAt: isoDateTime.optional(),
  reason: z.string().max(1000).nullable().optional(),
  active: z.boolean().optional()
});

export const updateApprovalLineTemplateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    domain: approvalDomainSchema.optional(),
    approverRoles: approverRolesSchema.optional(),
    payrollGrossPayMinKrw: payrollGrossPayBoundSchema.nullable().optional(),
    payrollGrossPayMaxKrw: payrollGrossPayBoundSchema.nullable().optional(),
    active: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (
      value.payrollGrossPayMinKrw !== null &&
      value.payrollGrossPayMinKrw !== undefined &&
      value.payrollGrossPayMaxKrw !== null &&
      value.payrollGrossPayMaxKrw !== undefined &&
      value.payrollGrossPayMinKrw > value.payrollGrossPayMaxKrw
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "payrollGrossPayMaxKrw must be greater than or equal to payrollGrossPayMinKrw",
        path: ["payrollGrossPayMaxKrw"]
      });
    }
  });
