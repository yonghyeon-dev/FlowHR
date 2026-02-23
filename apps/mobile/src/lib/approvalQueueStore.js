import * as SecureStore from "expo-secure-store";

import { APPROVAL_QUEUE_SEED_ITEMS } from "./approvalQueue";

const APPROVAL_QUEUE_KEY = "flowhr.mobile.approval.queue.v1";
let inMemoryApprovalQueue = null;

function parseJson(raw, fallback) {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeQueueItems(items) {
  if (!Array.isArray(items)) {
    return APPROVAL_QUEUE_SEED_ITEMS;
  }
  return items.map((item, index) => ({
    id: String(item?.id ?? `approval-${index + 1}`),
    title: String(item?.title ?? "Untitled approval request"),
    requesterName: String(item?.requesterName ?? "Unknown requester"),
    domain: String(item?.domain ?? "general"),
    priority: item?.priority === "high" || item?.priority === "normal" || item?.priority === "low" ? item.priority : "normal",
    status: item?.status === "pending" || item?.status === "approved" || item?.status === "rejected" ? item.status : "pending",
    stalledHours: Number.isFinite(item?.stalledHours) ? Math.max(0, Number(item.stalledHours)) : 0,
    submittedAt: String(item?.submittedAt ?? new Date().toISOString()),
    decidedAt: item?.decidedAt ? String(item.decidedAt) : null
  }));
}

export async function loadApprovalQueueItems() {
  try {
    const raw = await SecureStore.getItemAsync(APPROVAL_QUEUE_KEY);
    const parsed = parseJson(raw, APPROVAL_QUEUE_SEED_ITEMS);
    const normalized = normalizeQueueItems(parsed);
    inMemoryApprovalQueue = normalized;
    return normalized;
  } catch {
    return normalizeQueueItems(inMemoryApprovalQueue ?? APPROVAL_QUEUE_SEED_ITEMS);
  }
}

export async function saveApprovalQueueItems(items) {
  const normalized = normalizeQueueItems(items);
  inMemoryApprovalQueue = normalized;
  try {
    await SecureStore.setItemAsync(APPROVAL_QUEUE_KEY, JSON.stringify(normalized));
  } catch {
    // fallback in unsupported environments
  }
  return normalized;
}

export async function resetApprovalQueueItems() {
  return saveApprovalQueueItems(APPROVAL_QUEUE_SEED_ITEMS);
}
