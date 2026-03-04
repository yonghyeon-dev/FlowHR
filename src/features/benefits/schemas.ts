import { z } from "zod";

const benefitCatalogStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const benefitRequestStatusSchema = z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELED"]);
const benefitRequestSortSchema = z.enum(["updated_desc", "pending_priority"]);
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
    message: "invalid ISO date"
  });

export const listBenefitCatalogQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  status: benefitCatalogStatusSchema.or(z.literal("all")).optional()
});

export const createBenefitCatalogSchema = z.object({
  organizationId: z.string().trim().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(4).max(1000),
  annualLimitKrw: z.number().int().nonnegative(),
  status: benefitCatalogStatusSchema.optional(),
  enrollmentStartDate: isoDateSchema.optional(),
  enrollmentEndDate: isoDateSchema.optional()
}).refine(
  (value) =>
    !value.enrollmentStartDate ||
    !value.enrollmentEndDate ||
    value.enrollmentStartDate <= value.enrollmentEndDate,
  {
    message: "enrollmentStartDate must be on or before enrollmentEndDate",
    path: ["enrollmentEndDate"]
  }
);

export const updateBenefitCatalogStatusSchema = z.object({
  benefitId: z.string().trim().min(1),
  status: benefitCatalogStatusSchema
});

export const listBenefitRequestsQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  employeeId: z.string().trim().optional(),
  status: benefitRequestStatusSchema.or(z.literal("all")).optional(),
  sort: benefitRequestSortSchema.optional()
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

export const cancelBenefitRequestSchema = z.object({
  requestId: z.string().trim().min(1),
  cancelNote: z.string().trim().max(1000).optional()
});
