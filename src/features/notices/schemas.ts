import { z } from "zod";

const noticeAudienceSchema = z.enum(["all", "employees", "admins"]);
const noticeStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]);

export const listNoticesQuerySchema = z.object({
  organizationId: z.string().trim().optional(),
  audience: noticeAudienceSchema.or(z.literal("all")).optional(),
  status: noticeStatusSchema.or(z.literal("all")).optional(),
  publishedOnly: z
    .enum(["true", "false"]) 
    .transform((value) => value === "true")
    .optional()
});

export const createNoticeSchema = z.object({
  organizationId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(4).max(2000),
  audience: noticeAudienceSchema,
  targetDepartmentIds: z.array(z.string().trim().min(1)).max(200).optional(),
  publishAt: z.string().datetime().optional()
});

export const publishNoticeSchema = z.object({
  noticeId: z.string().trim().min(1)
});

export const updateNoticeSchema = z.object({
  noticeId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(120).optional(),
  body: z.string().trim().min(4).max(2000).optional(),
  audience: noticeAudienceSchema.optional(),
  targetDepartmentIds: z.array(z.string().trim().min(1)).max(200).optional(),
  publishAt: z.string().datetime().nullable().optional()
}).refine((payload) => {
  return (
    payload.title !== undefined ||
    payload.body !== undefined ||
    payload.audience !== undefined ||
    payload.targetDepartmentIds !== undefined ||
    payload.publishAt !== undefined
  );
}, {
  message: "at least one field is required"
});

export const deleteNoticeSchema = z.object({
  noticeId: z.string().trim().min(1)
});

export const readNoticeSchema = z.object({
  noticeId: z.string().trim().min(1),
  organizationId: z.string().trim().min(1).optional()
});

export const readAllNoticesSchema = z.object({
  organizationId: z.string().trim().min(1).optional(),
  noticeIds: z.array(z.string().trim().min(1)).max(500).optional()
});
