export type LeaveCalendarResponse = {
  organizationId: string;
  period: {
    from: string;
    to: string;
    timezone: string;
  };
  filters: {
    departmentId: string | null;
    includePending: boolean;
    overlapWarningThreshold: number;
  };
  summary: {
    dayCount: number;
    approvedEntryCount: number;
    pendingEntryCount: number;
    warningDayCount: number;
    uniqueEmployeeCount: number;
  };
  days: Array<{
    date: string;
    approvedCount: number;
    pendingCount: number;
    warning: boolean;
    employees: Array<{
      employeeId: string;
      name: string | null;
      departmentName: string | null;
      states: Array<"APPROVED" | "PENDING">;
    }>;
  }>;
  entries: Array<{
    requestId: string;
    employeeId: string;
    employeeName: string | null;
    employeeEmail: string | null;
    departmentId: string | null;
    departmentName: string | null;
    state: "APPROVED" | "PENDING";
    leaveType: "ANNUAL" | "SICK" | "UNPAID";
    unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
    hours: number | null;
    days: number;
    startDate: string;
    endDate: string;
    coveredDates: string[];
  }>;
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

export function defaultCalendarRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return {
    from: start.toISOString(),
    to: end.toISOString()
  };
}

export function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function toSeoulIsoStart(dateValue: string) {
  return `${dateValue}T00:00:00+09:00`;
}
