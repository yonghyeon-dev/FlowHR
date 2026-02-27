import type {
  ContractApprovalStatus,
  ContractDocumentStatus
} from "@/components/contracts/copy";

export function resolveContractDocumentStatusLabel(
  status: ContractDocumentStatus,
  labels: Record<ContractDocumentStatus, string>,
  isKoLocale: boolean
) {
  return labels[status] ?? (isKoLocale ? "알 수 없는 상태" : status);
}

export function resolveContractApprovalStatusLabel(
  status: ContractApprovalStatus,
  labels: Record<ContractApprovalStatus, string>,
  isKoLocale: boolean
) {
  return labels[status] ?? (isKoLocale ? "알 수 없는 승인 상태" : status);
}
