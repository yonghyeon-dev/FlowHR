import { z } from "zod";

const openingStatusSchema = z.enum(["OPEN", "CLOSED"]);
const referralStageSchema = z.enum([
  "SUBMITTED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN"
]);

export const listRecruitmentOpeningsQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  status: openingStatusSchema.or(z.literal("all")).optional()
});

export const createRecruitmentOpeningSchema = z.object({
  organizationId: z.string().trim().optional(),
  title: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  employmentType: z.string().trim().min(2).max(60),
  status: openingStatusSchema.optional()
});

export const listRecruitmentReferralsQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  referrerEmployeeId: z.string().trim().optional(),
  stage: referralStageSchema.or(z.literal("all")).optional()
});

export const createRecruitmentReferralSchema = z.object({
  organizationId: z.string().trim().optional(),
  openingId: z.string().trim().min(1),
  candidateName: z.string().trim().min(2).max(120),
  candidateEmail: z.string().trim().email(),
  referrerEmployeeId: z.string().trim().min(1),
  note: z.string().trim().min(2).max(1000)
});

export const updateRecruitmentReferralStageSchema = z.object({
  referralId: z.string().trim().min(1),
  stage: referralStageSchema
});

export const withdrawRecruitmentReferralSchema = z.object({
  referralId: z.string().trim().min(1)
});
