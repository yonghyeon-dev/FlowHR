"use client";

import { isDevToolsEnabled } from "@/app/employee/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type UseEmployeeRuntimeSessionInput = {
  notConfiguredLabel: string;
};

export function useEmployeeRuntimeSession({
  notConfiguredLabel
}: UseEmployeeRuntimeSessionInput) {
  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const sessionEmployeeId = (supabaseSession?.actorId ?? "").trim();
  const employeeId =
    sessionEmployeeId.length > 0
      ? sessionEmployeeId
      : isProductionRuntime
        ? ""
        : (supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";
  const hasBoundEmployeeId = sessionEmployeeId.length > 0;

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;

  return {
    showDevTools,
    isProductionRuntime,
    supabaseSession,
    supabaseSessionError,
    organizationId,
    employeeId,
    hasBoundEmployeeId,
    bearerToken,
    usesBearerToken,
    supabaseUrl
  } as const;
}
