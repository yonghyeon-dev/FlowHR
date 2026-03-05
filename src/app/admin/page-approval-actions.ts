import { useCallback, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import type { AttendanceRecordDto, LeaveRequestDto } from "@/app/admin/page-types";

type ApprovalQueue = "leave" | "attendance";

type UseAdminDashboardApprovalActionsInput = {
  firstPendingLeave: LeaveRequestDto | null;
  firstPendingAttendance: AttendanceRecordDto | null;
  isKoLocale: boolean;
  runtimeLocale: string;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  setLoadError: (value: string) => void;
  refreshSummary: () => Promise<void>;
};

function readApiErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }
  const parsed = body as { error?: unknown; message?: unknown };
  if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
    return parsed.error.trim();
  }
  if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
    return parsed.message.trim();
  }
  return null;
}

export function useAdminDashboardApprovalActions({
  firstPendingLeave,
  firstPendingAttendance,
  isKoLocale,
  runtimeLocale,
  requiresLoginSession,
  productionSessionRequiredNotice,
  setLoadError,
  refreshSummary
}: UseAdminDashboardApprovalActionsInput) {
  const [approvalQuickActionPending, setApprovalQuickActionPending] = useState<ApprovalQueue | null>(null);
  const [approvalQuickActionNotice, setApprovalQuickActionNotice] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const runApprovalQuickAction = useCallback(
    async (queue: ApprovalQueue) => {
      if (requiresLoginSession) {
        setLoadError(productionSessionRequiredNotice);
        return;
      }

      const targetId =
        queue === "leave" ? firstPendingLeave?.id?.trim() ?? "" : firstPendingAttendance?.id?.trim() ?? "";
      if (!targetId) {
        return;
      }

      const label =
        queue === "leave"
          ? isKoLocale
            ? "대시보드 빠른 승인(휴가)"
            : "Dashboard quick approve (leave)"
          : isKoLocale
            ? "대시보드 빠른 승인(출퇴근)"
            : "Dashboard quick approve (attendance)";
      const path =
        queue === "leave"
          ? `/api/leave/requests/${targetId}/approve`
          : `/api/attendance/records/${targetId}/approve`;

      setApprovalQuickActionPending(queue);
      setApprovalQuickActionNotice(null);
      try {
        const { response, body } = await performAdminApiCall({
          label,
          method: "POST",
          path,
          runtimeLocale
        });

        if (!response.ok) {
          const errorMessage = readApiErrorMessage(body);
          setApprovalQuickActionNotice({
            ok: false,
            message:
              errorMessage ?? (isKoLocale ? "빠른 승인을 처리하지 못했습니다." : "Failed to run quick approval.")
          });
          return;
        }

        setApprovalQuickActionNotice({
          ok: true,
          message:
            queue === "leave"
              ? isKoLocale
                ? "휴가 1건을 승인하고 대시보드를 갱신했습니다."
                : "Approved one leave request and refreshed dashboard."
              : isKoLocale
                ? "출퇴근 1건을 승인하고 대시보드를 갱신했습니다."
                : "Approved one attendance record and refreshed dashboard."
        });
        await refreshSummary();
      } catch (error) {
        setApprovalQuickActionNotice({
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : isKoLocale
                ? "빠른 승인을 처리하지 못했습니다."
                : "Failed to run quick approval."
        });
      } finally {
        setApprovalQuickActionPending(null);
      }
    },
    [
      firstPendingAttendance,
      firstPendingLeave,
      isKoLocale,
      productionSessionRequiredNotice,
      refreshSummary,
      requiresLoginSession,
      runtimeLocale,
      setLoadError
    ]
  );

  return {
    approvalQuickActionPending,
    approvalQuickActionNotice,
    runApprovalQuickAction
  };
}
