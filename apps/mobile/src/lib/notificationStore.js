import * as SecureStore from "expo-secure-store";

import { resolveMobileLocale } from "./mobileLocale";

const PREF_KEY = "flowhr.mobile.notification.preference.v1";
const INBOX_KEY = "flowhr.mobile.notification.inbox.v1";
let inMemoryPreference = null;
let inMemoryInbox = null;

export const defaultNotificationPreference = {
  approvalRequest: true,
  approvalResult: true,
  payslipReady: true
};

const seedInboxByLocale = {
  ko: [
    {
      id: "seed-approval-request",
      title: "승인 요청 도착",
      body: "승인 대기 항목 2건이 있습니다.",
      category: "approvalRequest",
      createdAt: "2026-02-23T06:00:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "seed-approval-result",
      title: "요청 처리 완료",
      body: "휴가 요청이 승인되었습니다.",
      category: "approvalResult",
      createdAt: "2026-02-23T05:30:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "seed-payslip",
      title: "명세서 발행",
      body: "이번 달 확정 급여 명세서를 확인할 수 있습니다.",
      category: "payslipReady",
      createdAt: "2026-02-22T23:50:00.000Z",
      read: true,
      archivedAt: null
    }
  ],
  en: [
    {
      id: "seed-approval-request",
      title: "Approval request arrived",
      body: "You have 2 requests waiting in queue.",
      category: "approvalRequest",
      createdAt: "2026-02-23T06:00:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "seed-approval-result",
      title: "Request processed",
      body: "Your leave request has been approved.",
      category: "approvalResult",
      createdAt: "2026-02-23T05:30:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "seed-payslip",
      title: "Payslip issued",
      body: "The finalized payslip for this month is ready.",
      category: "payslipReady",
      createdAt: "2026-02-22T23:50:00.000Z",
      read: true,
      archivedAt: null
    }
  ]
};

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

function resolveSeedInbox(locale = resolveMobileLocale()) {
  return locale === "en" ? seedInboxByLocale.en : seedInboxByLocale.ko;
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

export async function loadNotificationInbox(locale = resolveMobileLocale()) {
  const localeSeed = resolveSeedInbox(locale);
  try {
    const raw = await SecureStore.getItemAsync(INBOX_KEY);
    const parsed = parseJson(raw, localeSeed);
    inMemoryInbox = parsed;
    return parsed;
  } catch {
    return inMemoryInbox ?? localeSeed;
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
