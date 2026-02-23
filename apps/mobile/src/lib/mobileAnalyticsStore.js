import * as SecureStore from "expo-secure-store";

import { normalizeMobileAnalyticsFilterPresetState } from "./mobileAnalytics";

const ANALYTICS_FILTER_PRESET_STATE_KEY = "flowhr.mobile.analytics.filter-preset-state.v1";
let inMemoryAnalyticsFilterPresetState = null;

const defaultAnalyticsFilterPresetState = {
  pinnedPresetKeys: ["allActionRequired", "approvalRisk"],
  recentPresetKeys: []
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

export async function loadMobileAnalyticsFilterPresetState() {
  try {
    const raw = await SecureStore.getItemAsync(ANALYTICS_FILTER_PRESET_STATE_KEY);
    const parsed = parseJson(raw, defaultAnalyticsFilterPresetState);
    const normalized = normalizeMobileAnalyticsFilterPresetState(parsed);
    inMemoryAnalyticsFilterPresetState = normalized;
    return normalized;
  } catch {
    return normalizeMobileAnalyticsFilterPresetState(
      inMemoryAnalyticsFilterPresetState ?? defaultAnalyticsFilterPresetState
    );
  }
}

export async function saveMobileAnalyticsFilterPresetState(state) {
  const normalized = normalizeMobileAnalyticsFilterPresetState(state);
  inMemoryAnalyticsFilterPresetState = normalized;
  try {
    await SecureStore.setItemAsync(ANALYTICS_FILTER_PRESET_STATE_KEY, JSON.stringify(normalized));
  } catch {
    // fallback in unsupported environments
  }
  return normalized;
}
