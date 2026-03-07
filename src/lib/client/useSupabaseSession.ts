"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { syncAccessTokenCookie } from "@/lib/auth/session-cookie";
import { getSupabaseClient } from "@/lib/supabase/client";

export type SupabaseSessionSnapshot = {
  accessToken: string;
  userId: string;
  email: string | null;
  role: string | null;
  organizationId: string | null;
  actorId: string | null;
};

type SupabaseSessionState = {
  snapshot: SupabaseSessionSnapshot | null;
  error: string | null;
  loading: boolean;
};

const ensuredOrganizationKeys = new Set<string>();
const organizationEnsureRequests = new Map<string, Promise<void>>();

function readAppMetadataString(
  app: Record<string, unknown>,
  ...keys: string[]
): string | null {
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

function toSnapshot(session: Session | null): SupabaseSessionSnapshot | null {
  if (!session?.access_token || !session.user?.id) {
    return null;
  }

  const app = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const role = readAppMetadataString(app, "role");
  const organizationId = readAppMetadataString(app, "organization_id", "organizationId");
  const actorId = readAppMetadataString(
    app,
    "actor_id",
    "employee_id",
    "actorId",
    "employeeId"
  );

  return {
    accessToken: session.access_token,
    userId: session.user.id,
    email: session.user.email ?? null,
    role,
    organizationId,
    actorId
  };
}

function toOrganizationEnsureKey(snapshot: SupabaseSessionSnapshot | null): string | null {
  if (!snapshot?.organizationId) {
    return null;
  }

  return `${snapshot.userId}:${snapshot.organizationId}`;
}

async function readEnsureOrganizationError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown; message?: unknown };
    if (typeof body.error === "string" && body.error.trim().length > 0) {
      return body.error.trim();
    }
    if (typeof body.message === "string" && body.message.trim().length > 0) {
      return body.message.trim();
    }
  } catch {
    // Ignore non-JSON responses and fall back to the status text below.
  }

  return `organization ensure failed (${response.status})`;
}

async function ensureOrganizationForSession(session: Session | null) {
  const snapshot = toSnapshot(session);
  const ensureKey = toOrganizationEnsureKey(snapshot);
  if (!snapshot?.accessToken || !ensureKey) {
    return;
  }

  if (ensuredOrganizationKeys.has(ensureKey)) {
    return;
  }

  const pending = organizationEnsureRequests.get(ensureKey);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    const response = await fetch("/api/auth/ensure-organization", {
      method: "POST",
      headers: {
        authorization: `Bearer ${snapshot.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(await readEnsureOrganizationError(response));
    }

    ensuredOrganizationKeys.add(ensureKey);
  })().finally(() => {
    organizationEnsureRequests.delete(ensureKey);
  });

  organizationEnsureRequests.set(ensureKey, request);
  return request;
}

export function useSupabaseSession(): SupabaseSessionState {
  const [snapshot, setSnapshot] = useState<SupabaseSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stable = useMemo(() => ({ snapshot, error, loading }), [snapshot, error, loading]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    let hydrateSequence = 0;

    async function applySession(session: Session | null, nextError: string | null, forceLoading: boolean) {
      const sequence = ++hydrateSequence;
      const nextSnapshot = toSnapshot(session);
      const ensureKey = toOrganizationEnsureKey(nextSnapshot);
      const shouldBlock = forceLoading || (ensureKey !== null && !ensuredOrganizationKeys.has(ensureKey));

      syncAccessTokenCookie(session);
      if (shouldBlock) {
        setLoading(true);
      }

      try {
        await ensureOrganizationForSession(session);
        if (!active || sequence !== hydrateSequence) {
          return;
        }
        setError(nextError);
      } catch (error) {
        if (!active || sequence !== hydrateSequence) {
          return;
        }
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        if (!active || sequence !== hydrateSequence) {
          return;
        }
        setSnapshot(nextSnapshot);
        setLoading(false);
      }
    }

    async function bind() {
      try {
        const supabase = getSupabaseClient();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          void applySession(session, null, false);
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        const { data, error } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
        await applySession(data.session, error?.message ?? null, true);
      } catch (error) {
        if (!active) {
          return;
        }
        setError(error instanceof Error ? error.message : String(error));
        setSnapshot(null);
      } finally {
        if (!active) {
          return;
        }
        setLoading(false);
      }
    }

    void bind();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return stable;
}

