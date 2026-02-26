import { canEmployeeRespondToContractDocument } from "@/components/contracts/document-action-policy";
import { type EmployeeContractDocument } from "@/components/contracts/types";

export type EmployeeInboxStatusFilter = "all" | "pending_response" | "responded" | "expired";
export type EmployeeInboxDeadlineFilter = "all" | "due_soon" | "overdue";

const DUE_SOON_WINDOW_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseExpiresAtMillis(document: EmployeeContractDocument) {
  if (!document.expiresAt) {
    return null;
  }
  const parsed = Date.parse(document.expiresAt);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isPendingResponseStatus(document: EmployeeContractDocument) {
  return canEmployeeRespondToContractDocument(document.status);
}

export function applyInboxStatusFilter(
  documents: EmployeeContractDocument[],
  statusFilter: EmployeeInboxStatusFilter
) {
  if (statusFilter === "pending_response") {
    return documents.filter((document) => isPendingResponseStatus(document));
  }
  if (statusFilter === "responded") {
    return documents.filter((document) => document.status === "SIGNED" || document.status === "REJECTED");
  }
  if (statusFilter === "expired") {
    return documents.filter((document) => document.status === "EXPIRED");
  }
  return documents;
}

export function applyInboxDeadlineFilter(
  documents: EmployeeContractDocument[],
  deadlineFilter: EmployeeInboxDeadlineFilter,
  nowMs: number = Date.now()
) {
  if (deadlineFilter === "all") {
    return documents;
  }
  return documents.filter((document) => {
    if (!isPendingResponseStatus(document)) {
      return false;
    }
    const expiresAtMs = parseExpiresAtMillis(document);
    if (expiresAtMs === null) {
      return false;
    }
    if (deadlineFilter === "overdue") {
      return expiresAtMs < nowMs;
    }
    return expiresAtMs >= nowMs && expiresAtMs - nowMs <= DUE_SOON_WINDOW_DAYS * DAY_MS;
  });
}

export function countPendingResponse(documents: EmployeeContractDocument[]) {
  return documents.filter((document) => isPendingResponseStatus(document)).length;
}

export function countDueSoonPending(documents: EmployeeContractDocument[], nowMs: number = Date.now()) {
  return applyInboxDeadlineFilter(documents, "due_soon", nowMs).length;
}

export function countOverduePending(documents: EmployeeContractDocument[], nowMs: number = Date.now()) {
  return applyInboxDeadlineFilter(documents, "overdue", nowMs).length;
}
