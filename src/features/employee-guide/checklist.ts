export type EmployeeGuideChecklistInput = {
  profileReady: boolean;
  attendanceRecordCount: number;
  leaveRequestCount: number;
  confirmedPayslipCount: number;
};

export type EmployeeGuideChecklistItem = {
  key: "profile" | "attendance" | "leave" | "payslip";
  done: boolean;
};

export function buildEmployeeGuideChecklist(
  input: EmployeeGuideChecklistInput
): EmployeeGuideChecklistItem[] {
  return [
    { key: "profile", done: input.profileReady },
    { key: "attendance", done: input.attendanceRecordCount > 0 },
    { key: "leave", done: input.leaveRequestCount > 0 },
    { key: "payslip", done: input.confirmedPayslipCount > 0 }
  ];
}

export function employeeGuideProgressPercent(items: EmployeeGuideChecklistItem[]) {
  if (items.length === 0) {
    return 0;
  }
  const doneCount = items.filter((item) => item.done).length;
  return Math.round((doneCount / items.length) * 100);
}
