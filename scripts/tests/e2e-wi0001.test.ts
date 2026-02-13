import assert from "node:assert/strict";
import type { Actor } from "../../src/lib/actor.ts";
import { hasAnyRole, canMutateAttendance } from "../../src/lib/permissions.ts";
import {
  calculateGrossPay,
  defaultMultipliers,
  splitPayableMinutes,
  workedMinutes
} from "../../src/lib/payroll-rules.ts";

type AttendanceRecord = {
  id: string;
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  state: "PENDING" | "APPROVED";
};

type AuditEvent = {
  action: string;
  actorId: string;
};

let sequence = 1;
const attendanceRecords: AttendanceRecord[] = [];
const auditEvents: AuditEvent[] = [];

function writeAudit(action: string, actor: Actor) {
  auditEvents.push({ action, actorId: actor.id });
}

function createAttendanceRecord(
  actor: Actor,
  input: Omit<AttendanceRecord, "id" | "state">
): AttendanceRecord {
  if (!canMutateAttendance(actor, input.employeeId)) {
    throw new Error("unauthorized create");
  }

  const record: AttendanceRecord = {
    ...input,
    id: `AR-${sequence++}`,
    state: "PENDING"
  };
  attendanceRecords.push(record);
  writeAudit("attendance.recorded", actor);
  return record;
}

function approveAttendanceRecord(actor: Actor, id: string): AttendanceRecord {
  if (!hasAnyRole(actor, ["admin", "manager"])) {
    throw new Error("unauthorized approve");
  }
  const target = attendanceRecords.find((record) => record.id === id);
  if (!target) {
    throw new Error("record not found");
  }
  target.state = "APPROVED";
  writeAudit("attendance.approved", actor);
  return target;
}

function previewPayroll(actor: Actor, periodStart: Date, periodEnd: Date, hourlyRateKrw: number) {
  if (!hasAnyRole(actor, ["admin", "payroll_operator"])) {
    throw new Error("unauthorized preview");
  }

  const approved = attendanceRecords.filter(
    (record) => record.state === "APPROVED" && record.checkInAt >= periodStart && record.checkInAt <= periodEnd
  );

  let totals = { regular: 0, overtime: 0, night: 0, holiday: 0 };
  for (const record of approved) {
    const worked = workedMinutes(record.checkInAt, record.checkOutAt, record.breakMinutes);
    const minutes = splitPayableMinutes(worked, record.isHoliday);
    totals = {
      regular: totals.regular + minutes.regular,
      overtime: totals.overtime + minutes.overtime,
      night: totals.night + minutes.night,
      holiday: totals.holiday + minutes.holiday
    };
  }

  const grossPayKrw = calculateGrossPay(totals, hourlyRateKrw, defaultMultipliers);
  writeAudit("payroll.calculated", actor);

  return {
    sourceCount: approved.length,
    totals,
    grossPayKrw
  };
}

const employee: Actor = { id: "EMP-1001", role: "employee" };
const manager: Actor = { id: "MGR-1", role: "manager" };
const payrollOperator: Actor = { id: "PAY-1", role: "payroll_operator" };

const created = createAttendanceRecord(employee, {
  employeeId: "EMP-1001",
  checkInAt: new Date("2026-02-02T09:00:00+09:00"),
  checkOutAt: new Date("2026-02-02T18:00:00+09:00"),
  breakMinutes: 60,
  isHoliday: false
});

assert.throws(
  () => approveAttendanceRecord(employee, created.id),
  /unauthorized approve/,
  "employee should not approve attendance"
);

const approved = approveAttendanceRecord(manager, created.id);
assert.equal(approved.state, "APPROVED");

const preview = previewPayroll(
  payrollOperator,
  new Date("2026-02-01T00:00:00+09:00"),
  new Date("2026-02-28T23:59:59+09:00"),
  12000
);

assert.equal(preview.sourceCount, 1);
assert.deepEqual(preview.totals, { regular: 480, overtime: 0, night: 0, holiday: 0 });
assert.equal(preview.grossPayKrw, 96000);

assert.deepEqual(
  auditEvents.map((event) => event.action),
  ["attendance.recorded", "attendance.approved", "payroll.calculated"]
);

console.log("e2e-wi0001.test passed");
