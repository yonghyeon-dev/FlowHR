"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

export type ApiActorSession = {
  accessToken: string;
  role: string;
  actorId: string;
  organizationId: string | null;
};

export type ApiClientFetchInput = {
  method: string;
  path: string;
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
};

function readAppMetadataString(app: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = app[key];
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return null;
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const next = encodeURIComponent(currentPath || "/");
  window.location.replace(`/login?next=${next}`);
}

function buildMissingMetadataErrorMessage() {
  return "Supabase session app_metadata.role/app_metadata.actor_id is required.";
}

export async function resolveApiActorSession(): Promise<ApiActorSession> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  if (!session?.access_token || !session.user) {
    redirectToLogin();
    throw new Error("Supabase login session is required.");
  }

  const app = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const role = readAppMetadataString(app, "role");
  const actorId = readAppMetadataString(app, "actor_id", "employee_id", "actorId", "employeeId");
  const organizationId = readAppMetadataString(app, "organization_id", "organizationId");

  if (!role || !actorId) {
    redirectToLogin();
    throw new Error(buildMissingMetadataErrorMessage());
  }

  return {
    accessToken: session.access_token,
    role,
    actorId,
    organizationId
  };
}

export async function resolveActorHeadersFromSupabaseSession(): Promise<Record<string, string>> {
  const actorSession = await resolveApiActorSession();
  const headers: Record<string, string> = {
    authorization: `Bearer ${actorSession.accessToken}`,
    "x-actor-role": actorSession.role,
    "x-actor-id": actorSession.actorId
  };
  if (actorSession.organizationId) {
    headers["x-actor-organization-id"] = actorSession.organizationId;
  }
  return headers;
}

export async function apiClientFetch(input: ApiClientFetchInput): Promise<Response> {
  const actorHeaders = await resolveActorHeadersFromSupabaseSession();
  const headers: Record<string, string> = {
    ...input.headers,
    ...actorHeaders
  };

  if (input.payload && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }

  return fetch(input.path, {
    method: input.method,
    headers,
    body: input.payload ? JSON.stringify(input.payload) : undefined
  });
}

export async function parseApiResponseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (raw.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}
