import type {
  ContractApprovalStatus,
  ContractCategory,
  ContractDocumentStatus
} from "@/components/contracts/copy";

export type ContractTemplate = {
  id: string;
  organizationId: string;
  name: string;
  category: ContractCategory;
  body: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminContractDocument = {
  id: string;
  organizationId: string;
  templateId: string;
  templateVersion: number;
  title: string;
  employeeId: string;
  status: ContractDocumentStatus;
  approvalStatus: ContractApprovalStatus;
  approvalExecutionId: string | null;
  requiresApproval: boolean;
  documentHash: string;
  expiresAt: string | null;
  updatedAt: string;
};

export type EmployeeContractDocument = {
  id: string;
  title: string;
  employeeId: string;
  status: ContractDocumentStatus;
  approvalStatus: ContractApprovalStatus;
  documentHash: string;
  respondedAt: string | null;
  signatureHash: string | null;
  signatureEvidenceHash: string | null;
  expiresAt: string | null;
  updatedAt: string;
  responseComment: string | null;
};

export type ContractSignatureEvidenceResponse = {
  evidence: {
    documentId: string;
    employeeId: string;
    status: "SIGNED";
    respondedAt: string;
    signatureHash: string;
    signatureEvidenceHash: string;
    documentHash: string;
    format: "json" | "text";
    fileName: string;
    contentType: string;
    contentSha256: string;
    generatedAt: string;
    content: string;
  };
};

export type ContractDocumentAction = "request" | "approve" | "reject" | "send" | "expire" | "renew";
