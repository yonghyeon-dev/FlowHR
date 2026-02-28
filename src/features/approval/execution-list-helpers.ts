import type { ApprovalExecutionEntity } from "@/features/shared/data-access";
import {
  calculateExecutionStalledHours,
  compareExecutionsByPriority
} from "@/features/approval/execution-escalation-core-helpers";
import { ServiceError } from "@/features/shared/service-error";

export type ApprovalExecutionListSort = "updated_desc" | "priority_desc";

export function normalizeApprovalExecutionListOptions(input: {
  limit: number | undefined;
  sort: ApprovalExecutionListSort | undefined;
  stalledHoursMin: number | undefined;
  asOf: Date | undefined;
}) {
  const limit = input.limit !== undefined ? Math.min(Math.max(input.limit, 1), 500) : 100;
  const sort = input.sort ?? "updated_desc";
  const stalledHoursMin =
    input.stalledHoursMin !== undefined ? Math.max(input.stalledHoursMin, 0) : undefined;
  const asOf = input.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) {
    throw new ServiceError(400, "asOf must be a valid datetime");
  }
  return {
    limit,
    sort,
    stalledHoursMin,
    asOf
  };
}

export function selectApprovalExecutionsForList(input: {
  rows: ApprovalExecutionEntity[];
  sort: ApprovalExecutionListSort;
  stalledHoursMin: number | undefined;
  asOf: Date;
  limit: number;
}) {
  let rows = input.rows;
  const stalledHoursMin = input.stalledHoursMin;

  if (stalledHoursMin !== undefined) {
    rows = rows.filter((row) => {
      if (row.state !== "PENDING") {
        return false;
      }
      return calculateExecutionStalledHours(row, input.asOf) >= stalledHoursMin;
    });
  }

  if (input.sort === "priority_desc") {
    rows = [...rows].sort((left, right) => compareExecutionsByPriority(left, right, input.asOf));
  }

  if (input.limit > 0 && rows.length > input.limit) {
    rows = rows.slice(0, input.limit);
  }

  return rows;
}
