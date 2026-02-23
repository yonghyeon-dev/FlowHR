export type AttendanceLiveStatus = "scheduled" | "present" | "late" | "absent" | "checked_out";
export type AttendanceLiveAlertLevel = "normal" | "watch" | "critical";

export type AttendanceLiveEmployee = {
  id: string;
  name: string | null;
  departmentId: string | null;
};

export type AttendanceLiveDepartment = {
  id: string;
  name: string;
};

export type AttendanceLiveSchedule = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
};

export type AttendanceLiveRecord = {
  id: string;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
};

export type AttendanceLiveRow = {
  scheduleId: string;
  employeeId: string;
  employeeName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  scheduleStartAt: string;
  scheduleEndAt: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  minutesLate: number;
  status: AttendanceLiveStatus;
  alertLevel: AttendanceLiveAlertLevel;
};

export type AttendanceLiveSummary = {
  totalScheduled: number;
  scheduledCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  checkedOutCount: number;
  watchCount: number;
  criticalCount: number;
};

export type BuildAttendanceLiveSnapshotInput = {
  employees: AttendanceLiveEmployee[];
  departments: AttendanceLiveDepartment[];
  schedules: AttendanceLiveSchedule[];
  records: AttendanceLiveRecord[];
  now: Date;
  lateThresholdMinutes: number;
  criticalLateThresholdMinutes: number;
};

export type AttendanceLiveSnapshot = {
  rows: AttendanceLiveRow[];
  summary: AttendanceLiveSummary;
};

function toTimestamp(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLocalDateKey(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusFromRow(
  hasCheckIn: boolean,
  hasCheckOut: boolean,
  minutesLate: number,
  nowMs: number,
  scheduleStartMs: number,
  lateThresholdMinutes: number
): AttendanceLiveStatus {
  if (hasCheckIn) {
    if (hasCheckOut) {
      return "checked_out";
    }
    if (minutesLate >= lateThresholdMinutes) {
      return "late";
    }
    return "present";
  }

  if (nowMs >= scheduleStartMs + lateThresholdMinutes * 60_000) {
    return "absent";
  }

  return "scheduled";
}

function alertLevelFromRow(
  status: AttendanceLiveStatus,
  minutesLate: number,
  criticalLateThresholdMinutes: number
): AttendanceLiveAlertLevel {
  if (status === "absent") {
    return "critical";
  }
  if (status === "late") {
    return minutesLate >= criticalLateThresholdMinutes ? "critical" : "watch";
  }
  return "normal";
}

function consumeEarliestUnusedRecord(
  rows: AttendanceLiveRecord[],
  usedIds: Set<string>
): AttendanceLiveRecord | null {
  for (const row of rows) {
    if (!usedIds.has(row.id)) {
      usedIds.add(row.id);
      return row;
    }
  }
  return null;
}

export function summarizeAttendanceLiveRows(rows: AttendanceLiveRow[]): AttendanceLiveSummary {
  const summary: AttendanceLiveSummary = {
    totalScheduled: rows.length,
    scheduledCount: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    checkedOutCount: 0,
    watchCount: 0,
    criticalCount: 0
  };

  for (const row of rows) {
    if (row.status === "scheduled") {
      summary.scheduledCount += 1;
    } else if (row.status === "present") {
      summary.presentCount += 1;
    } else if (row.status === "late") {
      summary.lateCount += 1;
    } else if (row.status === "absent") {
      summary.absentCount += 1;
    } else if (row.status === "checked_out") {
      summary.checkedOutCount += 1;
    }

    if (row.alertLevel === "watch") {
      summary.watchCount += 1;
    } else if (row.alertLevel === "critical") {
      summary.criticalCount += 1;
    }
  }

  return summary;
}

export function buildAttendanceLiveSnapshot(
  input: BuildAttendanceLiveSnapshotInput
): AttendanceLiveSnapshot {
  const lateThresholdMinutes = Math.max(1, Math.trunc(input.lateThresholdMinutes));
  const criticalLateThresholdMinutes = Math.max(
    lateThresholdMinutes,
    Math.trunc(input.criticalLateThresholdMinutes)
  );

  const employeeById = new Map(input.employees.map((row) => [row.id, row] as const));
  const departmentNameById = new Map(input.departments.map((row) => [row.id, row.name] as const));

  const recordsByEmployeeDate = new Map<string, AttendanceLiveRecord[]>();
  for (const record of input.records) {
    const dateKey = toLocalDateKey(record.checkInAt);
    const groupKey = `${record.employeeId}::${dateKey}`;
    const rows = recordsByEmployeeDate.get(groupKey) ?? [];
    rows.push(record);
    recordsByEmployeeDate.set(groupKey, rows);
  }
  for (const rows of recordsByEmployeeDate.values()) {
    rows.sort((left, right) => toTimestamp(left.checkInAt) - toTimestamp(right.checkInAt));
  }

  const usedRecordIds = new Set<string>();
  const nowMs = input.now.getTime();

  const rows: AttendanceLiveRow[] = [...input.schedules]
    .sort((left, right) => toTimestamp(left.startAt) - toTimestamp(right.startAt))
    .map((schedule) => {
      const employee = employeeById.get(schedule.employeeId);
      const dateKey = toLocalDateKey(schedule.startAt);
      const groupKey = `${schedule.employeeId}::${dateKey}`;
      const sameDayRecords = recordsByEmployeeDate.get(groupKey) ?? [];
      const matchedRecord = consumeEarliestUnusedRecord(sameDayRecords, usedRecordIds);

      const scheduleStartMs = toTimestamp(schedule.startAt);
      const checkInMs = matchedRecord ? toTimestamp(matchedRecord.checkInAt) : 0;
      const minutesLate =
        checkInMs > 0
          ? Math.max(0, Math.round((checkInMs - scheduleStartMs) / 60_000))
          : Math.max(0, Math.round((nowMs - scheduleStartMs) / 60_000));

      const status = statusFromRow(
        Boolean(matchedRecord),
        Boolean(matchedRecord?.checkOutAt),
        minutesLate,
        nowMs,
        scheduleStartMs,
        lateThresholdMinutes
      );
      const alertLevel = alertLevelFromRow(status, minutesLate, criticalLateThresholdMinutes);

      return {
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        employeeName: employee?.name ?? null,
        departmentId: employee?.departmentId ?? null,
        departmentName: employee?.departmentId
          ? (departmentNameById.get(employee.departmentId) ?? null)
          : null,
        scheduleStartAt: schedule.startAt,
        scheduleEndAt: schedule.endAt,
        checkInAt: matchedRecord?.checkInAt ?? null,
        checkOutAt: matchedRecord?.checkOutAt ?? null,
        minutesLate,
        status,
        alertLevel
      } satisfies AttendanceLiveRow;
    });

  rows.sort((left, right) => {
    const alertRank = { critical: 2, watch: 1, normal: 0 } as const;
    const alertDiff = alertRank[right.alertLevel] - alertRank[left.alertLevel];
    if (alertDiff !== 0) {
      return alertDiff;
    }
    return toTimestamp(left.scheduleStartAt) - toTimestamp(right.scheduleStartAt);
  });

  return {
    rows,
    summary: summarizeAttendanceLiveRows(rows)
  };
}
