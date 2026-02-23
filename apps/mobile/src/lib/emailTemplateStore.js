import * as SecureStore from "expo-secure-store";

const PREF_KEY = "flowhr.mobile.email-template.preference.v1";
const HISTORY_KEY = "flowhr.mobile.email-template.preview-history.v1";

let inMemoryPreference = null;
let inMemoryHistory = null;

export const defaultEmailTemplatePreference = {
  templateId: "approval-request",
  locale: "ko",
  variables: {
    employeeName: "홍길동",
    organizationName: "FlowHR",
    actionLabel: "휴가 신청",
    deepLink: "https://flowhr.app/employee"
  }
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

export async function loadEmailTemplatePreference() {
  try {
    const raw = await SecureStore.getItemAsync(PREF_KEY);
    const parsed = parseJson(raw, {});
    inMemoryPreference = parsed;
    return {
      ...defaultEmailTemplatePreference,
      ...parsed,
      variables: {
        ...defaultEmailTemplatePreference.variables,
        ...(parsed.variables ?? {})
      }
    };
  } catch {
    return {
      ...defaultEmailTemplatePreference,
      ...(inMemoryPreference ?? {}),
      variables: {
        ...defaultEmailTemplatePreference.variables,
        ...((inMemoryPreference ?? {}).variables ?? {})
      }
    };
  }
}

export async function saveEmailTemplatePreference(preference) {
  const merged = {
    ...defaultEmailTemplatePreference,
    ...preference,
    variables: {
      ...defaultEmailTemplatePreference.variables,
      ...(preference.variables ?? {})
    }
  };
  inMemoryPreference = merged;
  try {
    await SecureStore.setItemAsync(PREF_KEY, JSON.stringify(merged));
  } catch {
    // fallback in unsupported environments
  }
  return merged;
}

export async function loadEmailTemplatePreviewHistory() {
  try {
    const raw = await SecureStore.getItemAsync(HISTORY_KEY);
    const parsed = parseJson(raw, []);
    inMemoryHistory = parsed;
    return parsed;
  } catch {
    return inMemoryHistory ?? [];
  }
}

export async function saveEmailTemplatePreviewHistory(items) {
  const normalized = items.slice(0, 8);
  inMemoryHistory = normalized;
  try {
    await SecureStore.setItemAsync(HISTORY_KEY, JSON.stringify(normalized));
  } catch {
    // fallback in unsupported environments
  }
  return normalized;
}
