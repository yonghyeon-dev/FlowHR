import type { AnomalyEscalationSeverity } from "@/features/scheduling/anomaly-automation-helpers";
import type { AttendanceRecordEntity, WorkScheduleEntity } from "@/features/shared/data-access";

export type ScheduleAttendanceAnomalyType = "LATE" | "NO_SHOW";

export type ScheduleAttendanceAnomaly = {
  scheduleId: string;
  employeeId: string;
  scheduleStartAt: Date;
  scheduleEndAt: Date;
  anomalyType: ScheduleAttendanceAnomalyType;
  lateMinutes: number | null;
  attendanceRecordId: string | null;
  checkInAt: Date | null;
};

export type ScheduleAttendanceAnomalyReport = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number;
  counts: {
    evaluatedSchedules: number;
    anomalies: number;
    late: number;
    noShow: number;
  };
  anomalies: ScheduleAttendanceAnomaly[];
};

export type ScheduleAttendanceAnomalyCockpitReport = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number;
  generatedAt: string;
  counts: {
    evaluatedSchedules: number;
    anomalies: number;
    late: number;
    noShow: number;
  };
  severities: {
    minor: number;
    major: number;
    critical: number;
  };
  employees: Array<{
    employeeId: string;
    anomalies: number;
    late: number;
    noShow: number;
    severity: AnomalyEscalationSeverity;
    lastAnomalyAt: Date | null;
  }>;
  queue: ScheduleAnomalyCockpitQueueEntry[];
};

export type ScheduleAnomalyCockpitQueueEntry = {
  scheduleId: string;
  employeeId: string;
  anomalyType: ScheduleAttendanceAnomalyType;
  severity: AnomalyEscalationSeverity;
  lateMinutes: number | null;
  scheduleStartAt: Date;
  recommendedAction: string;
};

type BuildScheduleAttendanceAnomalyReportAuditPayloadInput = {
  periodStartIso: string;
  periodEndIso: string;
  employeeId: string | undefined;
  lateThresholdMinutes: number;
  evaluatedSchedules: number;
  anomalies: number;
  lateCount: number;
  noShowCount: number;
};

type BuildScheduleAttendanceAnomalyReportInput = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number;
  evaluatedSchedules: number;
  anomalies: ScheduleAttendanceAnomaly[];
  lateCount: number;
  noShowCount: number;
};

function attendanceOverlapsSchedule(attendance: AttendanceRecordEntity, schedule: WorkScheduleEntity) {
  if (attendance.state === "REJECTED") {
    return false;
  }
  const attendanceEnd = attendance.checkOutAt ?? attendance.checkInAt;
  return attendance.checkInAt <= schedule.endAt && attendanceEnd >= schedule.startAt;
}

function indexAttendanceByEmployee(records: AttendanceRecordEntity[]) {
  const byEmployee = new Map<string, AttendanceRecordEntity[]>();
  for (const record of records) {
    const rows = byEmployee.get(record.employeeId);
    if (rows) {
      rows.push(record);
      continue;
    }
    byEmployee.set(record.employeeId, [record]);
  }
  return byEmployee;
}

export function buildScheduleAttendanceAnomalySet(
  schedules: WorkScheduleEntity[],
  attendances: AttendanceRecordEntity[],
  lateThresholdMinutes: number
) {
  const attendanceByEmployee = indexAttendanceByEmployee(attendances);
  const anomalies: ScheduleAttendanceAnomaly[] = [];

  for (const schedule of schedules) {
    const records = attendanceByEmployee.get(schedule.employeeId) ?? [];
    const overlaps = records.filter((record) => attendanceOverlapsSchedule(record, schedule));
    if (overlaps.length === 0) {
      anomalies.push({
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        scheduleStartAt: schedule.startAt,
        scheduleEndAt: schedule.endAt,
        anomalyType: "NO_SHOW",
        lateMinutes: null,
        attendanceRecordId: null,
        checkInAt: null
      });
      continue;
    }

    const earliest = overlaps.reduce((min, current) =>
      current.checkInAt.getTime() < min.checkInAt.getTime() ? current : min
    );
    const lateMinutes = Math.floor((earliest.checkInAt.getTime() - schedule.startAt.getTime()) / 60_000);
    if (lateMinutes > lateThresholdMinutes) {
      anomalies.push({
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        scheduleStartAt: schedule.startAt,
        scheduleEndAt: schedule.endAt,
        anomalyType: "LATE",
        lateMinutes,
        attendanceRecordId: earliest.id,
        checkInAt: earliest.checkInAt
      });
    }
  }

  anomalies.sort((a, b) => {
    const byStart = a.scheduleStartAt.getTime() - b.scheduleStartAt.getTime();
    if (byStart !== 0) {
      return byStart;
    }
    return a.scheduleId.localeCompare(b.scheduleId);
  });

  const lateCount = anomalies.filter((item) => item.anomalyType === "LATE").length;
  const noShowCount = anomalies.length - lateCount;
  return {
    anomalies,
    lateCount,
    noShowCount
  };
}

export function anomalyCockpitRecommendedAction(anomaly: ScheduleAttendanceAnomaly) {
  if (anomaly.anomalyType === "NO_SHOW") {
    return "\uCD9C\uACB0 \uD655\uC778 \uBC0F \uC0AC\uC720 \uC218\uC9D1";
  }
  if (anomaly.lateMinutes !== null && anomaly.lateMinutes >= 30) {
    return "\uC9C0\uAC01 \uC6D0\uC778 \uD655\uC778 \uBC0F \uC989\uC2DC \uC5D0\uC2A4\uCEEC\uB808\uC774\uC158 \uAC80\uD1A0";
  }
  return "\uC9C0\uAC01 \uC0AC\uC720 \uD655\uC778 \uBC0F \uC7AC\uBC1C \uBC29\uC9C0 \uC870\uCE58";
}

export function buildScheduleAttendanceAnomalyReportAuditPayload(
  input: BuildScheduleAttendanceAnomalyReportAuditPayloadInput
) {
  return {
    periodStart: input.periodStartIso,
    periodEnd: input.periodEndIso,
    employeeId: input.employeeId ?? null,
    lateThresholdMinutes: input.lateThresholdMinutes,
    evaluatedSchedules: input.evaluatedSchedules,
    anomalies: input.anomalies,
    lateCount: input.lateCount,
    noShowCount: input.noShowCount
  };
}

export function buildScheduleAttendanceAnomalyReport(
  input: BuildScheduleAttendanceAnomalyReportInput
): ScheduleAttendanceAnomalyReport {
  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes: input.lateThresholdMinutes,
    counts: {
      evaluatedSchedules: input.evaluatedSchedules,
      anomalies: input.anomalies.length,
      late: input.lateCount,
      noShow: input.noShowCount
    },
    anomalies: input.anomalies
  };
}
