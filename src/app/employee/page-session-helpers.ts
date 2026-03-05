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
  const {
    snapshot: supabaseSession,
    error: supabaseSessionError,
    loading: supabaseSessionLoading
  } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const sessionEmployeeId = (supabaseSession?.actorId ?? "").trim();
  const employeeId = sessionEmployeeId;
  const hasBoundEmployeeId = sessionEmployeeId.length > 0;

  const usesBearerToken =
    isProductionRuntime && (supabaseSession?.accessToken ?? "").trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? notConfiguredLabel;

  return {
    showDevTools,
    isProductionRuntime,
    supabaseSession,
    supabaseSessionError,
    supabaseSessionLoading,
    organizationId,
    employeeId,
    hasBoundEmployeeId,
    usesBearerToken,
    supabaseUrl
  } as const;
}
