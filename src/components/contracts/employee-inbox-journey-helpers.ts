import { type EmployeeContractsCopy } from "@/components/contracts/copy";
import {
  isDueSoonPendingDocument,
  isOverduePendingDocument,
  resolveDueSoonPendingDays,
  resolveOverduePendingDays
} from "@/components/contracts/employee-inbox-filter-helpers";
import { type EmployeeContractDocument } from "@/components/contracts/types";

type EmployeeContractsNextActionCopy = Pick<
  EmployeeContractsCopy,
  | "nextActionNoDocument"
  | "nextActionWaitAdminApproval"
  | "nextActionRespondPending"
  | "nextActionRespondDueSoon"
  | "nextActionRespondOverdue"
  | "nextActionReviewSigned"
  | "nextActionReviewRejected"
  | "nextActionRequestRenewal"
>;

type EmployeeContractsUrgencyCopy = Pick<
  EmployeeContractsCopy,
  "dueSoonBadgeLabel" | "overdueBadgeLabel"
>;

export function resolveEmployeeContractsNextActionHint(
  selected: EmployeeContractDocument | null,
  copy: EmployeeContractsNextActionCopy
) {
  if (!selected) return copy.nextActionNoDocument;
  if (selected.status === "DRAFT" || selected.status === "APPROVAL_REQUESTED") {
    return copy.nextActionWaitAdminApproval;
  }
  if (selected.status === "SENT") {
    if (isOverduePendingDocument(selected)) return copy.nextActionRespondOverdue;
    if (isDueSoonPendingDocument(selected)) return copy.nextActionRespondDueSoon;
    return copy.nextActionRespondPending;
  }
  if (selected.status === "SIGNED") return copy.nextActionReviewSigned;
  if (selected.status === "REJECTED") return copy.nextActionReviewRejected;
  if (selected.status === "EXPIRED" || selected.status === "RENEWED") {
    return copy.nextActionRequestRenewal;
  }
  return copy.nextActionNoDocument;
}

export function resolveEmployeeContractsUrgencyBadge(
  document: EmployeeContractDocument,
  copy: EmployeeContractsUrgencyCopy
) {
  const overdueDays = resolveOverduePendingDays(document);
  if (overdueDays !== null) {
    return `${copy.overdueBadgeLabel} (D+${overdueDays})`;
  }
  const dueSoonDays = resolveDueSoonPendingDays(document);
  if (dueSoonDays !== null) {
    return `${copy.dueSoonBadgeLabel} (D-${dueSoonDays})`;
  }
  return null;
}
