import * as SecureStore from "expo-secure-store";

import { normalizeEmployeeRequestDraft } from "./employeeRequest";

const EMPLOYEE_REQUEST_KEY = "flowhr.mobile.employee.request.v1";
let inMemoryEmployeeRequests = null;

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

function normalizeRecord(item, index) {
  const draft = normalizeEmployeeRequestDraft(item);
  return {
    id: String(item?.id ?? `req-${index + 1}`),
    actorId: String(item?.actorId ?? ""),
    requestType: draft.requestType,
    requestDate: draft.requestDate,
    leaveEndDate: draft.requestType === "leaveRequest" ? draft.leaveEndDate : null,
    leaveUnit: draft.requestType === "leaveRequest" ? draft.leaveUnit : null,
    leaveHours: draft.requestType === "leaveRequest" ? draft.leaveHours : null,
    reason: draft.reason,
    note: draft.note,
    status: item?.status === "submitted" ? "submitted" : "submitted",
    createdAt: String(item?.createdAt ?? new Date().toISOString())
  };
}

function normalizeRecords(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => normalizeRecord(item, index));
}

export async function loadEmployeeRequests() {
  try {
    const raw = await SecureStore.getItemAsync(EMPLOYEE_REQUEST_KEY);
    const parsed = parseJson(raw, []);
    const normalized = normalizeRecords(parsed);
    inMemoryEmployeeRequests = normalized;
    return normalized;
  } catch {
    return normalizeRecords(inMemoryEmployeeRequests ?? []);
  }
}

export async function saveEmployeeRequests(items) {
  const normalized = normalizeRecords(items);
  inMemoryEmployeeRequests = normalized;
  try {
    await SecureStore.setItemAsync(EMPLOYEE_REQUEST_KEY, JSON.stringify(normalized));
  } catch {
    // fallback in unsupported environments
  }
  return normalized;
}
