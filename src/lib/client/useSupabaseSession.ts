"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

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
};

function toSnapshot(session: Session | null): SupabaseSessionSnapshot | null {
  if (!session?.access_token || !session.user?.id) {
    return null;
  }

  const app = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const role = typeof app.role === "string" ? app.role : null;
  const organizationId =
    typeof app.organization_id === "string"
      ? app.organization_id
      : typeof app.organizationId === "string"
        ? app.organizationId
        : null;
  const actorId =
    typeof app.actor_id === "string"
      ? app.actor_id
      : typeof app.actorId === "string"
        ? app.actorId
        : typeof app.employee_id === "string"
          ? app.employee_id
          : typeof app.employeeId === "string"
            ? app.employeeId
        : null;

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

  const stable = useMemo(() => ({ snapshot, error }), [snapshot, error]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    async function bind() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
        if (error) {
          setError(error.message);
        } else {
          setError(null);
        }
        setSnapshot(toSnapshot(data.session));

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setSnapshot(toSnapshot(session));
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (error) {
        if (!active) {
          return;
        }
        setError(error instanceof Error ? error.message : String(error));
        setSnapshot(null);
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

