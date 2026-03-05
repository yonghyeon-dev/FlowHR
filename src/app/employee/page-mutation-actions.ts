import type { Dispatch, SetStateAction } from "react";

import {
  cancelLeaveFromHelper,
  checkOutNowFromHelper,
  createAttendanceFromHelper,
  createLeaveFromHelper,
  refreshEmployeeSnapshotFromHelper,
  requestAttendanceCorrectionFromHelper,
  type EmployeeCallApi,
  type EmployeeCallApiLabels
} from "@/app/employee/page-action-helpers";
import type {
  AttendanceRecordDto,
  EmployeeDepartmentLeaveCalendarEntryDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  WorkScheduleDto
} from "@/app/employee/page-types";

type StringSetter = Dispatch<SetStateAction<string>>;

export type BuildEmployeeMutationActionsInput = {
  callApi: EmployeeCallApi;
  callApiLabels: EmployeeCallApiLabels;
  buildQuery: (params: Record<string, string | undefined>) => string;
  toIso: (value: string) => string;
  coerceNumber: (value: string, fallback?: number) => number;
  periodStart: string;
  periodEnd: string;
  employeeId: string;
  selectedCorrectionRecordId: string;
  lastAttendanceId: string;
  setAttendance: Dispatch<SetStateAction<AttendanceRecordDto[]>>;
  setLastAttendanceId: StringSetter;
  setSelectedCorrectionRecordId: StringSetter;
  setLeaveRequests: Dispatch<SetStateAction<LeaveRequestDto[]>>;
  setDepartmentLeaveCalendarEntries: Dispatch<SetStateAction<EmployeeDepartmentLeaveCalendarEntryDto[]>>;
  setLastLeaveRequestId: StringSetter;
  setSchedules: Dispatch<SetStateAction<WorkScheduleDto[]>>;
  setLeaveBalance: Dispatch<SetStateAction<LeaveBalanceDto | null>>;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  isHoliday: boolean;
  attendanceNotes: string;
  correctionRequestNote: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  leaveUnit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  leaveStartDate: string;
  leaveEndDate: string;
  leaveHours: string;
  leaveReason: string;
  cancelReason: string;
  lastLeaveRequestId: string;
};

export function buildEmployeeMutationActions(input: BuildEmployeeMutationActionsInput) {
  async function refreshEmployeeSnapshot(range?: { fromIso: string; toIso: string }) {
    const fromIso = range?.fromIso ?? input.toIso(input.periodStart);
    const toIsoValue = range?.toIso ?? input.toIso(input.periodEnd);
    const snapshot = await refreshEmployeeSnapshotFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      fromIso,
      toIso: toIsoValue,
      employeeId: input.employeeId,
      selectedCorrectionRecordId: input.selectedCorrectionRecordId,
      lastAttendanceId: input.lastAttendanceId,
      buildQuery: input.buildQuery
    });

    if (snapshot.attendance) {
      input.setAttendance(snapshot.attendance);
    }
    if (snapshot.nextLastAttendanceId) {
      input.setLastAttendanceId(snapshot.nextLastAttendanceId);
    }
    if (snapshot.nextSelectedCorrectionRecordId) {
      input.setSelectedCorrectionRecordId(snapshot.nextSelectedCorrectionRecordId);
    }
    if (snapshot.leaveRequests) {
      input.setLeaveRequests(snapshot.leaveRequests);
    }
    if (snapshot.departmentLeaveCalendarEntries) {
      input.setDepartmentLeaveCalendarEntries(snapshot.departmentLeaveCalendarEntries);
    }
    if (snapshot.nextLastLeaveRequestId) {
      input.setLastLeaveRequestId(snapshot.nextLastLeaveRequestId);
    }
    if (snapshot.schedules) {
      input.setSchedules(snapshot.schedules);
    }
    if (snapshot.leaveBalance !== undefined) {
      input.setLeaveBalance(snapshot.leaveBalance);
    }
  }

  async function createAttendance() {
    const result = await createAttendanceFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      employeeId: input.employeeId,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      breakMinutes: input.breakMinutes,
      isHoliday: input.isHoliday,
      attendanceNotes: input.attendanceNotes,
      toIso: input.toIso,
      coerceNumber: input.coerceNumber
    });
    if (!result.ok) {
      return;
    }
    if (result.createdRecordId) {
      input.setLastAttendanceId(result.createdRecordId);
      input.setSelectedCorrectionRecordId(result.createdRecordId);
    }
    await refreshEmployeeSnapshot();
  }

  async function checkOutNow() {
    const checkedOut = await checkOutNowFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      lastAttendanceId: input.lastAttendanceId
    });
    if (checkedOut) {
      await refreshEmployeeSnapshot();
    }
  }

  async function requestAttendanceCorrection() {
    const corrected = await requestAttendanceCorrectionFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      lastAttendanceId: input.lastAttendanceId,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      breakMinutes: input.breakMinutes,
      isHoliday: input.isHoliday,
      attendanceNotes: input.attendanceNotes,
      correctionRequestNote: input.correctionRequestNote,
      toIso: input.toIso,
      coerceNumber: input.coerceNumber
    });
    if (corrected) {
      await refreshEmployeeSnapshot();
    }
  }

  async function createLeave() {
    const result = await createLeaveFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      leaveUnit: input.leaveUnit,
      leaveStartDate: input.leaveStartDate,
      leaveEndDate: input.leaveEndDate,
      leaveHours: input.leaveHours,
      leaveReason: input.leaveReason,
      toIso: input.toIso,
      coerceNumber: input.coerceNumber
    });
    if (!result.ok) {
      return;
    }
    if (result.requestId) {
      input.setLastLeaveRequestId(result.requestId);
    }
    await refreshEmployeeSnapshot();
  }

  async function cancelLeave() {
    const canceled = await cancelLeaveFromHelper({
      callApi: input.callApi,
      callApiLabels: input.callApiLabels,
      lastLeaveRequestId: input.lastLeaveRequestId,
      cancelReason: input.cancelReason
    });
    if (canceled) {
      await refreshEmployeeSnapshot();
    }
  }

  return {
    refreshEmployeeSnapshot,
    createAttendance,
    checkOutNow,
    requestAttendanceCorrection,
    createLeave,
    cancelLeave
  };
}
