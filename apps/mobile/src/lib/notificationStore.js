import * as SecureStore from "expo-secure-store";

const PREF_KEY = "flowhr.mobile.notification.preference.v1";
const INBOX_KEY = "flowhr.mobile.notification.inbox.v1";
let inMemoryPreference = null;
let inMemoryInbox = null;

export const defaultNotificationPreference = {
  approvalRequest: true,
  approvalResult: true,
  payslipReady: true
};

const seedInbox = [
  {
    id: "seed-approval-request",
    title: "승인 요청 도착",
    body: "결재 대기 2건이 있습니다.",
    category: "approvalRequest",
    createdAt: "2026-02-23T06:00:00.000Z",
    read: false
  },
  {
    id: "seed-approval-result",
    title: "요청 처리 완료",
    body: "휴가 요청이 승인되었습니다.",
    category: "approvalResult",
    createdAt: "2026-02-23T05:30:00.000Z",
    read: false
  },
  {
    id: "seed-payslip",
    title: "급여 명세서 발행",
    body: "이번 달 확정 명세서가 도착했습니다.",
    category: "payslipReady",
    createdAt: "2026-02-22T23:50:00.000Z",
    read: true
  }
];

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

export async function loadNotificationPreference() {
  try {
    const raw = await SecureStore.getItemAsync(PREF_KEY);
    const parsed = parseJson(raw, {});
    inMemoryPreference = parsed;
    return {
      ...defaultNotificationPreference,
      ...parsed
    };
  } catch {
    return {
      ...defaultNotificationPreference,
      ...(inMemoryPreference ?? {})
    };
  }
}

export async function saveNotificationPreference(preference) {
  const merged = { ...defaultNotificationPreference, ...preference };
  inMemoryPreference = merged;
  try {
    await SecureStore.setItemAsync(PREF_KEY, JSON.stringify(merged));
  } catch {
    // fallback in unsupported environments
  }
  return merged;
}

export async function loadNotificationInbox() {
  try {
    const raw = await SecureStore.getItemAsync(INBOX_KEY);
    const parsed = parseJson(raw, seedInbox);
    inMemoryInbox = parsed;
    return parsed;
  } catch {
    return inMemoryInbox ?? seedInbox;
  }
}

export async function saveNotificationInbox(items) {
  inMemoryInbox = items;
  try {
    await SecureStore.setItemAsync(INBOX_KEY, JSON.stringify(items));
  } catch {
    // fallback in unsupported environments
  }
  return items;
}
