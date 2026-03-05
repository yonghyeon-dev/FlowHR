import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const contractTemplateCategoryValues = ["employment", "amendment", "nda", "policy"] as const;
export const contractTemplateCategorySchema = z.enum(contractTemplateCategoryValues);

export const contractTemplateStatusValues = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const contractTemplateStatusSchema = z.enum(contractTemplateStatusValues);

export const contractDocumentStatusValues = [
  "DRAFT",
  "APPROVAL_REQUESTED",
  "SENT",
  "SIGNED",
  "REJECTED",
  "EXPIRED",
  "RENEWED"
] as const;
export const contractDocumentStatusSchema = z.enum(contractDocumentStatusValues);

export const contractApprovalStatusValues = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const;
export const contractApprovalStatusSchema = z.enum(contractApprovalStatusValues);

export const listContractTemplatesQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  category: contractTemplateCategorySchema.optional(),
  status: contractTemplateStatusSchema.optional(),
  search: z.string().trim().min(1).max(120).optional()
});

export const createContractTemplateSchema = z.object({
  organizationId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  category: contractTemplateCategorySchema,
  body: z.string().trim().min(1).max(20_000),
  status: contractTemplateStatusSchema.optional()
});

export const updateContractTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  category: contractTemplateCategorySchema.optional(),
  body: z.string().trim().min(1).max(20_000).optional(),
  status: contractTemplateStatusSchema.optional()
});

export const contractTemplatePathSchema = z.object({
  templateId: z.string().trim().min(1)
});

export const contractTemplateVersionPathSchema = z.object({
  templateId: z.string().trim().min(1),
  version: z.coerce.number().int().min(1)
});

export const listContractDocumentsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  employeeId: z.string().min(1).optional(),
  templateId: z.string().min(1).optional(),
  status: contractDocumentStatusSchema.optional(),
  approvalStatus: contractApprovalStatusSchema.optional(),
  expiresWithinDays: z.number().int().min(0).max(365).optional()
});

export const createContractDocumentSchema = z.object({
  organizationId: z.string().min(1).optional(),
  templateId: z.string().trim().min(1),
  employeeId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160).optional(),
  expiresAt: isoDateTime.optional(),
  requiresApproval: z.boolean().optional()
});

export const contractApprovalActionValues = ["APPROVE", "REJECT"] as const;
export const contractApprovalActionSchema = z.enum(contractApprovalActionValues);

export const requestContractDocumentApprovalSchema = z.object({
  requestedAt: isoDateTime.optional()
});

export const decideContractDocumentApprovalSchema = z.object({
  action: contractApprovalActionSchema,
  decidedAt: isoDateTime.optional()
});

export const sendContractDocumentSchema = z.object({
  sentAt: isoDateTime.optional(),
  bypassApproval: z.boolean().optional()
});

export const contractEmployeeResponseActionValues = ["SIGN", "REJECT"] as const;
export const contractEmployeeResponseActionSchema = z.enum(contractEmployeeResponseActionValues);

export const respondContractDocumentSchema = z.object({
  action: contractEmployeeResponseActionSchema,
  comment: z.string().trim().max(2_000).optional(),
  signatureInput: z.string().trim().min(2).max(2_000).optional(),
  expectedDocumentHash: z.string().trim().length(64).optional(),
  respondedAt: isoDateTime.optional()
});

export const renewContractDocumentSchema = z.object({
  newExpiresAt: isoDateTime.optional(),
  copyRequiresApproval: z.boolean().optional()
});

export const expireContractDocumentSchema = z.object({
  reason: z.string().trim().max(2_000).optional(),
  expiredAt: isoDateTime.optional()
});

export const getContractDocumentSignatureEvidenceQuerySchema = z.object({
  format: z.enum(["json", "text"]).default("json")
});
