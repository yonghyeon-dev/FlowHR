"use client";

import { useEffect } from "react";

import { isDevToolsEnabled } from "@/app/employee/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type UseEmployeeRuntimeSessionInput = {
  accessToken: string;
  organizationId: string;
  setOrganizationId: (value: string) => void;
  employeeId: string;
  setEmployeeId: (value: string) => void;
  notConfiguredLabel: string;
};

export function useEmployeeRuntimeSession({
  accessToken,
  organizationId,
  setOrganizationId,
  employeeId,
  setEmployeeId,
  notConfiguredLabel
}: UseEmployeeRuntimeSessionInput) {
  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const actorId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim();
    if (actorId.length > 0 && employeeId.trim() !== actorId) {
      setEmployeeId(actorId);
    }
  }, [employeeId, isProductionRuntime, setEmployeeId, supabaseSession?.actorId, supabaseSession?.userId]);

  return {
    showDevTools,
    isProductionRuntime,
    supabaseSession,
    supabaseSessionError,
    bearerToken,
    usesBearerToken,
    supabaseUrl
  } as const;
}
