import { useEffect } from "react";
import type { MutableRefObject } from "react";

import {
  resolveAttendanceCorrectionTargetFromScheduleRange,
  type AttendanceCorrectionSchedulePrefill
} from "@/app/employee/page-query-prefill-helpers";
import type { AttendanceRecordDto } from "@/app/employee/page-types";

type AttendancePrefillRef = MutableRefObject<{
  baseKey: string | null;
  selectedTargetKey: string | null;
}>;

export function useApplyAttendanceSchedulePrefillEffect(input: {
  attendanceSchedulePrefill: AttendanceCorrectionSchedulePrefill | null;
  attendance: AttendanceRecordDto[];
  appliedAttendanceSchedulePrefillRef: AttendancePrefillRef;
  setCheckInAt: (value: string) => void;
  setCheckOutAt: (value: string) => void;
  setAttendanceNotes: (value: string) => void;
  applyAttendanceRecordToCorrectionForm: (record: AttendanceRecordDto) => void;
}) {
  const {
    attendanceSchedulePrefill,
    attendance,
    appliedAttendanceSchedulePrefillRef,
    setCheckInAt,
    setCheckOutAt,
    setAttendanceNotes,
    applyAttendanceRecordToCorrectionForm
  } = input;

  useEffect(() => {
    if (!attendanceSchedulePrefill) {
      return;
    }

    if (appliedAttendanceSchedulePrefillRef.current.baseKey !== attendanceSchedulePrefill.key) {
      setCheckInAt(attendanceSchedulePrefill.checkInAt);
      setCheckOutAt(attendanceSchedulePrefill.checkOutAt);
      setAttendanceNotes(attendanceSchedulePrefill.note);
      appliedAttendanceSchedulePrefillRef.current.baseKey = attendanceSchedulePrefill.key;
      appliedAttendanceSchedulePrefillRef.current.selectedTargetKey = null;
    }

    if (appliedAttendanceSchedulePrefillRef.current.selectedTargetKey === attendanceSchedulePrefill.key) {
      return;
    }
    const correctionTarget = resolveAttendanceCorrectionTargetFromScheduleRange(
      attendance,
      attendanceSchedulePrefill
    );
    if (!correctionTarget) {
      return;
    }

    applyAttendanceRecordToCorrectionForm(correctionTarget);
    setAttendanceNotes(attendanceSchedulePrefill.note);
    appliedAttendanceSchedulePrefillRef.current.selectedTargetKey = attendanceSchedulePrefill.key;
  }, [
    appliedAttendanceSchedulePrefillRef,
    applyAttendanceRecordToCorrectionForm,
    attendance,
    attendanceSchedulePrefill,
    setAttendanceNotes,
    setCheckInAt,
    setCheckOutAt
  ]);
}
