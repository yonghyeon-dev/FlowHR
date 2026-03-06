import { z } from "zod";

import { actorRoles } from "@/lib/actor";

const isoDateTime = z.string().datetime({ offset: true });
const actorRoleSchema = z.enum(actorRoles);

export const approvalDomainValues = ["ATTENDANCE", "LEAVE", "PAYROLL"] as const;
export const approvalDomainSchema = z.enum(approvalDomainValues);

export const approvalStageResolutionValues = [
  "EXPECTED_ROLE",
  "ACTIVE_DELEGATION",
  "PRIVILEGED_BYPASS",
  "DENIED"
] as const;
export const approvalStageResolutionSchema = z.enum(approvalStageResolutionValues);

export const approvalExecutionStateValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export const approvalExecutionStateSchema = z.enum(approvalExecutionStateValues);
export const approvalExecutionSortValues = ["updated_desc", "priority_desc"] as const;
export const approvalExecutionSortSchema = z.enum(approvalExecutionSortValues);

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

const approvalTemplateStageSchema = z.object({
  stageIndex: z.number().int().min(1).max(5),
  label: z.string().min(1).max(80).optional(),
  approverRoles: approverRolesSchema,
  minApprovals: z.number().int().min(1).max(5).optional()
});

const payrollGrossPayBoundSchema = z.number().int().nonnegative();

export const listApprovalLineTemplatesQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  active: z.boolean().optional()
});

export const listApprovalStageHistoryQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  targetEntityType: z.string().min(1).optional(),
  targetEntityId: z.string().min(1).optional(),
  allowed: z.boolean().optional(),
  resolution: approvalStageResolutionSchema.optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  limit: z.number().int().min(1).max(500).optional()
});

export const listApprovalExecutionsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  targetEntityType: z.string().min(1).optional(),
  targetEntityId: z.string().min(1).optional(),
  state: approvalExecutionStateSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
  sort: approvalExecutionSortSchema.optional(),
  stalledHoursMin: z.number().int().min(0).optional(),
  asOf: isoDateTime.optional()
});

export const triggerApprovalExecutionEscalationSchema = z.object({
  organizationId: z.string().min(1).optional(),
  domain: approvalDomainSchema.optional(),
  stalledHoursMin: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(500).optional(),
  asOf: isoDateTime.optional(),
  dryRun: z.boolean().optional(),
  notificationChannel: z.string().trim().min(1).max(100).optional()
});

export const applyApprovalExecutionActionSchema = z.object({
  organizationId: z.string().min(1),
  domain: approvalDomainSchema,
  targetEntityType: z.string().trim().min(1),
  targetEntityId: z.string().trim().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().trim().max(1000).optional()
});

export const previewApprovalPolicyGateSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    domain: approvalDomainSchema,
    actorRole: actorRoleSchema.optional(),
    actorId: z.string().min(1).optional(),
    payrollGrossPayKrw: z.number().int().nonnegative().nullable().optional(),
    effectiveAt: isoDateTime.optional()
  })
  .superRefine((value, ctx) => {
    if (value.domain !== "PAYROLL" && value.payrollGrossPayKrw !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "payrollGrossPayKrw is only allowed when domain=PAYROLL",
        path: ["payrollGrossPayKrw"]
      });
    }
  });

export const createApprovalLineTemplateSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    name: z.string().min(1).max(120),
    domain: approvalDomainSchema,
    approverRoles: approverRolesSchema.optional(),
    approvalStages: z.array(approvalTemplateStageSchema).min(1).max(5).optional(),
    payrollGrossPayMinKrw: payrollGrossPayBoundSchema.nullable().optional(),
    payrollGrossPayMaxKrw: payrollGrossPayBoundSchema.nullable().optional(),
    active: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.approverRoles && !value.approvalStages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "either approverRoles or approvalStages is required",
        path: ["approverRoles"]
      });
    }
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
    if (value.approvalStages) {
      const indexSet = new Set<number>();
      for (const stage of value.approvalStages) {
        if (indexSet.has(stage.stageIndex)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "approval stage index must be unique",
            path: ["approvalStages"]
          });
          break;
        }
        indexSet.add(stage.stageIndex);
        if (stage.minApprovals !== undefined && stage.minApprovals > stage.approverRoles.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "approval stage minApprovals must be less than or equal to approverRoles length",
            path: ["approvalStages"]
          });
          break;
        }
      }
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
    approvalStages: z.array(approvalTemplateStageSchema).min(1).max(5).optional(),
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
    if (value.approvalStages) {
      const indexSet = new Set<number>();
      for (const stage of value.approvalStages) {
        if (indexSet.has(stage.stageIndex)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "approval stage index must be unique",
            path: ["approvalStages"]
          });
          break;
        }
        indexSet.add(stage.stageIndex);
        if (stage.minApprovals !== undefined && stage.minApprovals > stage.approverRoles.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "approval stage minApprovals must be less than or equal to approverRoles length",
            path: ["approvalStages"]
          });
          break;
        }
      }
    }
  });
