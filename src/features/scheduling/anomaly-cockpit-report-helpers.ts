import {
  anomalyEscalationSeverityWeight,
  classifyAnomalyEscalationSeverity
} from "@/features/scheduling/anomaly-automation-helpers";
import {
  anomalyCockpitRecommendedAction,
  buildScheduleAttendanceAnomalySet
} from "@/features/scheduling/anomaly-report-helpers";
import type {
  ScheduleAnomalyCockpitQueueEntry,
  ScheduleAttendanceAnomaly,
  ScheduleAttendanceAnomalyCockpitReport
} from "@/features/scheduling/anomaly-report-helpers";
import type { AttendanceRecordEntity, WorkScheduleEntity } from "@/features/shared/data-access";

export type ScheduleAttendanceAnomalyCockpitProjection = {
  anomalies: ScheduleAttendanceAnomaly[];
  lateCount: number;
  noShowCount: number;
  employees: ScheduleAttendanceAnomalyCockpitReport["employees"];
  queue: ScheduleAnomalyCockpitQueueEntry[];
  severities: ScheduleAttendanceAnomalyCockpitReport["severities"];
};

export function buildScheduleAttendanceAnomalyCockpitProjection(
  schedules: WorkScheduleEntity[],
  attendances: AttendanceRecordEntity[],
  lateThresholdMinutes: number,
  topN: number
): ScheduleAttendanceAnomalyCockpitProjection {
  const { anomalies, lateCount, noShowCount } = buildScheduleAttendanceAnomalySet(
    schedules,
    attendances,
    lateThresholdMinutes
  );

  const anomaliesByEmployee = new Map<string, ScheduleAttendanceAnomaly[]>();
  for (const anomaly of anomalies) {
    const rows = anomaliesByEmployee.get(anomaly.employeeId);
    if (rows) {
      rows.push(anomaly);
      continue;
    }
    anomaliesByEmployee.set(anomaly.employeeId, [anomaly]);
  }

  const employees = Array.from(anomaliesByEmployee.entries()).map(([employeeId, rows]) => {
    const late = rows.filter((row) => row.anomalyType === "LATE").length;
    const noShow = rows.length - late;
    const lastAnomalyAt =
      rows.length === 0
        ? null
        : rows.reduce(
            (max, row) =>
              row.scheduleStartAt.getTime() > max.getTime() ? row.scheduleStartAt : max,
            rows[0].scheduleStartAt
          );
    const severity = classifyAnomalyEscalationSeverity(rows, late, noShow);
    return {
      employeeId,
      anomalies: rows.length,
      late,
      noShow,
      severity,
      lastAnomalyAt
    };
  });

  employees.sort((left, right) => {
    const bySeverity =
      anomalyEscalationSeverityWeight(right.severity) -
      anomalyEscalationSeverityWeight(left.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }
    if (left.anomalies !== right.anomalies) {
      return right.anomalies - left.anomalies;
    }
    return left.employeeId.localeCompare(right.employeeId);
  });

  const severityByEmployee = new Map(
    employees.map((employee) => [employee.employeeId, employee.severity])
  );
  const queue: ScheduleAnomalyCockpitQueueEntry[] = anomalies
    .map((anomaly) => ({
      scheduleId: anomaly.scheduleId,
      employeeId: anomaly.employeeId,
      anomalyType: anomaly.anomalyType,
      severity: severityByEmployee.get(anomaly.employeeId) ?? "MINOR",
      lateMinutes: anomaly.lateMinutes,
      scheduleStartAt: anomaly.scheduleStartAt,
      recommendedAction: anomalyCockpitRecommendedAction(anomaly)
    }))
    .sort((left, right) => {
      const bySeverity =
        anomalyEscalationSeverityWeight(right.severity) -
        anomalyEscalationSeverityWeight(left.severity);
      if (bySeverity !== 0) {
        return bySeverity;
      }
      const byStart = left.scheduleStartAt.getTime() - right.scheduleStartAt.getTime();
      if (byStart !== 0) {
        return byStart;
      }
      return left.scheduleId.localeCompare(right.scheduleId);
    })
    .slice(0, topN);

  const severities = {
    minor: employees.filter((employee) => employee.severity === "MINOR").length,
    major: employees.filter((employee) => employee.severity === "MAJOR").length,
    critical: employees.filter((employee) => employee.severity === "CRITICAL").length
  };

  return {
    anomalies,
    lateCount,
    noShowCount,
    employees,
    queue,
    severities
  };
}
