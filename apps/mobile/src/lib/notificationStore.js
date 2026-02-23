import * as SecureStore from "expo-secure-store";

import {
  NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT,
  sanitizeNotificationPresetKeys
} from "./notificationHistory";

const PREF_KEY = "flowhr.mobile.notification.preference.v1";
const INBOX_KEY = "flowhr.mobile.notification.inbox.v1";
const HISTORY_PRESET_STATE_KEY = "flowhr.mobile.notification.history.preset-state.v1";
let inMemoryPreference = null;
let inMemoryInbox = null;
let inMemoryHistoryPresetState = null;

export const defaultNotificationPreference = {
  approvalRequest: true,
  approvalResult: true,
  payslipReady: true
};

export const defaultNotificationHistoryPresetState = {
  pinnedPresetKeys: ["allOpen", "approvalUnread"],
  recentPresetKeys: []
};

const seedInbox = [
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

function normalizeNotificationHistoryPresetState(value) {
  const source = value && typeof value === "object" ? value : {};
  const pinnedPresetKeys = sanitizeNotificationPresetKeys(source.pinnedPresetKeys);
  const recentPresetKeys = sanitizeNotificationPresetKeys(source.recentPresetKeys)
    .filter((key) => !pinnedPresetKeys.includes(key))
    .slice(0, NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT);
  return {
    ...defaultNotificationHistoryPresetState,
    pinnedPresetKeys,
    recentPresetKeys
  };
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

export async function loadNotificationHistoryPresetState() {
  try {
    const raw = await SecureStore.getItemAsync(HISTORY_PRESET_STATE_KEY);
    const parsed = parseJson(raw, defaultNotificationHistoryPresetState);
    const normalized = normalizeNotificationHistoryPresetState(parsed);
    inMemoryHistoryPresetState = normalized;
    return normalized;
  } catch {
    return normalizeNotificationHistoryPresetState(inMemoryHistoryPresetState ?? defaultNotificationHistoryPresetState);
  }
}

export async function saveNotificationHistoryPresetState(state) {
  const normalized = normalizeNotificationHistoryPresetState(state);
  inMemoryHistoryPresetState = normalized;
  try {
    await SecureStore.setItemAsync(HISTORY_PRESET_STATE_KEY, JSON.stringify(normalized));
  } catch {
    // fallback in unsupported environments
  }
  return normalized;
}
