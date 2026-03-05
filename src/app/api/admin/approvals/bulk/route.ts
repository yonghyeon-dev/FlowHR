import { approveAttendanceRecord, rejectAttendanceRecord } from "@/features/attendance/service";
import { approveLeaveRequest, rejectLeaveRequest } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { fail, ok } from "@/lib/http";

import { bulkApprovalSchema, requireAdminOrManager } from "../shared";

type BulkResult = {
  type: "attendance" | "leave";
  id: string;
  status: "success" | "error";
  error?: string;
};

export async function POST(request: Request) {
  const auth = await requireAdminOrManager(request, "admin.approvals.bulk");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = bulkApprovalSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const actor = auth.actor;
  const reason = parsed.data.reason ?? "";
  const results: BulkResult[] = [];

  for (const item of parsed.data.items) {
    try {
      if (parsed.data.action === "APPROVE") {
        if (item.type === "attendance") {
          await approveAttendanceRecord(
            {
              actor,
              dataAccess
            },
            item.id
          );
        } else {
          await approveLeaveRequest(
            {
              actor,
              dataAccess
            },
            item.id
          );
        }
      } else if (item.type === "attendance") {
        await rejectAttendanceRecord(
          {
            actor,
            dataAccess
          },
          item.id,
          reason
        );
      } else {
        await rejectLeaveRequest(
          {
            actor,
            dataAccess
          },
          item.id,
          reason
        );
      }

      results.push({
        type: item.type,
        id: item.id,
        status: "success"
      });
    } catch (error) {
      results.push({
        type: item.type,
        id: item.id,
        status: "error",
        error: isServiceError(error) ? error.message : "unexpected error"
      });
    }
  }

  const succeeded = results.filter((result) => result.status === "success").length;
  const failed = results.length - succeeded;

  return ok({
    processed: results.length,
    succeeded,
    failed,
    results
  });
}

