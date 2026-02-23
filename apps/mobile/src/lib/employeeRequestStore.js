import * as SecureStore from "expo-secure-store";

import { normalizeEmployeeRequestRecord } from "./employeeRequest";

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

function normalizeRecords(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => normalizeEmployeeRequestRecord(item, index));
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
