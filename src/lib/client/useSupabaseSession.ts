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

export function useSupabaseSession(): SupabaseSessionState {
  const [snapshot, setSnapshot] = useState<SupabaseSessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stable = useMemo(() => ({ snapshot, error, loading }), [snapshot, error, loading]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    async function bind() {
      try {
        const supabase = getSupabaseClient();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          syncAccessTokenCookie(session);
          setSnapshot(toSnapshot(session));
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        const { data, error } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
        if (error) {
          setError(error.message);
        } else {
          setError(null);
        }
        syncAccessTokenCookie(data.session);
        setSnapshot(toSnapshot(data.session));
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

