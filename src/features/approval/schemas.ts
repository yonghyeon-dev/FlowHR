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
