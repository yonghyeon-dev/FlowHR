import { z } from "zod";

const benefitCatalogStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const benefitRequestStatusSchema = z.enum(["SUBMITTED", "APPROVED", "REJECTED"]);

export const listBenefitCatalogQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  status: benefitCatalogStatusSchema.or(z.literal("all")).optional()
});

export const createBenefitCatalogSchema = z.object({
  organizationId: z.string().trim().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(4).max(1000),
  annualLimitKrw: z.number().int().nonnegative(),
  status: benefitCatalogStatusSchema.optional()
});

export const listBenefitRequestsQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
  status: benefitRequestStatusSchema.or(z.literal("all")).optional()
});

export const createBenefitRequestSchema = z.object({
  organizationId: z.string().trim().optional(),
  benefitId: z.string().trim().min(1),
  employeeId: z.string().trim().min(1),
  amountKrw: z.number().int().nonnegative(),
  reason: z.string().trim().min(2).max(1000)
});

export const decideBenefitRequestSchema = z.object({
  requestId: z.string().trim().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(1000).optional()
});
