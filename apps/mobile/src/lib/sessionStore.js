import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "flowhr.mobile.session.v1";
let inMemorySession = null;

function parseSession(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadSession() {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    const parsed = parseSession(raw);
    inMemorySession = parsed;
    return parsed;
  } catch {
    return inMemorySession;
  }
}

export async function saveSession(session) {
  const serialized = JSON.stringify(session);
  inMemorySession = session;
  try {
    await SecureStore.setItemAsync(SESSION_KEY, serialized);
  } catch {
    // SecureStore can fail on unsupported environments; keep in-memory fallback.
  }
  return session;
}

export async function clearSession() {
  inMemorySession = null;
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // no-op
  }
}
