import { Permissions } from "@/lib/rbac";
import { ServiceError } from "@/features/shared/service-error";

export function resolveScheduleListEmployeeFilter(input: {
  requestedEmployeeId: string | undefined;
  actorId: string;
  permissions: Set<string>;
}) {
  let employeeId = input.requestedEmployeeId;

  if (input.permissions.has(Permissions.schedulingScheduleListAny)) {
    return employeeId;
  }

  if (input.permissions.has(Permissions.schedulingScheduleListByEmployee)) {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager schedule list queries");
    }
    return employeeId;
  }

  if (input.permissions.has(Permissions.schedulingScheduleListOwn)) {
    employeeId = employeeId ?? input.actorId;
    if (employeeId !== input.actorId) {
      throw new ServiceError(403, "employee can only list own schedules");
    }
    return employeeId;
  }

  throw new ServiceError(403, "schedule list requires permission");
}
