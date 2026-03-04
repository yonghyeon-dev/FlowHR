import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const ALL_TIME_START = new Date("1900-01-01T00:00:00.000Z");
const ALL_TIME_END = new Date("9999-12-31T23:59:59.999Z");

function resolveTodayRange(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "admin.metrics.unauthorized");
  }
  if (actor.role !== "admin") {
    return fail(403, "admin.metrics.forbidden", {
      reason: "admin_required"
    });
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return fail(400, "admin.metrics.organization_id_required");
  }

  const dataAccess = getRuntimeDataAccess();
  const { start: todayStart, end: todayEnd } = resolveTodayRange(new Date());

  const [
    employees,
    departments,
    leaveRequests,
    approvalExecutions,
    attendanceRecords,
    benefitRequests,
    recruitmentOpenings
  ] = await Promise.all([
    dataAccess.employees.list({ organizationId }),
    dataAccess.departments.list({ organizationId }),
    dataAccess.leave.listInPeriod({
      periodStart: ALL_TIME_START,
      periodEnd: ALL_TIME_END,
      organizationId
    }),
    dataAccess.approvals.listExecutions({ organizationId }),
    dataAccess.attendance.listInPeriod({
      periodStart: todayStart,
      periodEnd: todayEnd,
      organizationId
    }),
    dataAccess.benefits.listRequests({ organizationId }),
    dataAccess.recruitment.listOpenings({ organizationId })
  ]);

  return ok({
    headcount: employees.filter((employee) => employee.active).length,
    departmentCount: departments.length,
    pendingLeaveRequests: leaveRequests.filter((requestItem) => requestItem.state === "PENDING").length,
    pendingApprovals: approvalExecutions.filter((execution) => execution.state === "PENDING").length,
    todayAttendanceCount: attendanceRecords.length,
    activeBenefitRequests: benefitRequests.filter((requestItem) => requestItem.status === "SUBMITTED").length,
    openRecruitmentOpenings: recruitmentOpenings.filter((opening) => opening.status === "OPEN").length
  });
}
