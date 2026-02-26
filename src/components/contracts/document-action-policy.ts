import type { ContractApprovalStatus, ContractDocumentStatus } from "@/components/contracts/copy";
import type { ContractDocumentAction } from "@/components/contracts/types";

type AdminContractDocumentLike = {
  status: ContractDocumentStatus;
  approvalStatus: ContractApprovalStatus;
  requiresApproval: boolean;
};

export type ContractDocumentNextStepKey =
  | "REQUEST_APPROVAL"
  | "APPROVE_OR_REJECT"
  | "SEND_DOCUMENT"
  | "WAIT_EMPLOYEE_RESPONSE"
  | "RENEW_DOCUMENT"
  | "NO_ACTION";

export function resolveAdminContractDocumentNextStep(
  document: AdminContractDocumentLike
): ContractDocumentNextStepKey {
  if (document.status === "APPROVAL_REQUESTED") {
    return "APPROVE_OR_REJECT";
  }
  if (document.status === "SENT") {
    return "WAIT_EMPLOYEE_RESPONSE";
  }
  if (
    document.status === "SIGNED" ||
    document.status === "REJECTED" ||
    document.status === "EXPIRED"
  ) {
    return "RENEW_DOCUMENT";
  }
  if (document.status === "DRAFT") {
    const requiresApproval = document.requiresApproval;
    const isApproved = document.approvalStatus === "APPROVED";
    if (requiresApproval && !isApproved) {
      return "REQUEST_APPROVAL";
    }
    return "SEND_DOCUMENT";
  }
  return "NO_ACTION";
}

export function resolveAllowedContractDocumentActions(
  document: AdminContractDocumentLike
): ContractDocumentAction[] {
  const nextStep = resolveAdminContractDocumentNextStep(document);
  if (nextStep === "REQUEST_APPROVAL") {
    return ["request"];
  }
  if (nextStep === "APPROVE_OR_REJECT") {
    return ["approve", "reject"];
  }
  if (nextStep === "SEND_DOCUMENT") {
    return ["send"];
  }
  if (nextStep === "WAIT_EMPLOYEE_RESPONSE") {
    return ["expire"];
  }
  if (nextStep === "RENEW_DOCUMENT") {
    return ["renew"];
  }
  return [];
}

export function canEmployeeRespondToContractDocument(status: ContractDocumentStatus) {
  return status === "SENT";
}
