function trimTrailingSlash(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function defaultBaseUrl() {
  return trimTrailingSlash(process.env.EXPO_PUBLIC_FLOWHR_API_BASE_URL ?? "http://localhost:3000");
}

function resolveActorRole(session) {
  const raw = String(session?.role ?? "").trim().toUpperCase();
  if (raw === "ADMIN") {
    return "admin";
  }
  if (raw === "EMPLOYEE") {
    return "employee";
  }
  if (raw === "MANAGER") {
    return "manager";
  }
  return "";
}

function buildHeaders(session, overrides) {
  const headers = {
    "content-type": "application/json",
    "x-tenant-id": session?.tenantId ?? "",
    "x-actor-id": session?.actorId ?? "",
    "x-actor-role": resolveActorRole(session),
    "x-actor-organization-id": session?.tenantId ?? "",
    ...overrides
  };
  if (session?.accessToken) {
    headers.authorization = `Bearer ${session.accessToken}`;
  }
  return headers;
}

function parseMaybeJson(text) {
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export function createFlowHrApiClient({ session, baseUrl = defaultBaseUrl(), fetchImpl = fetch } = {}) {
  const resolvedBaseUrl = trimTrailingSlash(baseUrl);

  async function request(path, init) {
    const response = await fetchImpl(`${resolvedBaseUrl}${path}`, init);
    const text = await response.text();
    const body = parseMaybeJson(text);
    if (!response.ok) {
      const message = body?.error?.message ?? `FlowHR API request failed (${response.status})`;
      throw new Error(message);
    }
    return body;
  }

  return {
    get(path, options = {}) {
      return request(path, {
        method: "GET",
        headers: buildHeaders(session, options.headers)
      });
    },
    post(path, payload, options = {}) {
      return request(path, {
        method: "POST",
        headers: buildHeaders(session, options.headers),
        body: JSON.stringify(payload ?? {})
      });
    }
  };
}

export { defaultBaseUrl };
