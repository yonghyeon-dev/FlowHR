export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  durationMs: number;
  at: string;
  body: unknown;
};

export type AttendanceRecordDto = {
  id: string;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
};

export type LeaveRequestDto = {
  id: string;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY";
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hours: number | null;
  days: number;
  reason: string | null;
  decisionReason?: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

export type EmployeeLeaveCalendarState = "PENDING" | "APPROVED" | "REJECTED";

export type EmployeeDepartmentLeaveCalendarEntryDto = {
  requestId: string;
  employeeId: string;
  employeeName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  isMine: boolean;
  state: EmployeeLeaveCalendarState;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY";
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hours: number | null;
  days: number;
  startDate: string;
  endDate: string;
  coveredDates: string[];
};

export type WorkScheduleDto = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
};

export type LeaveBalanceDto = {
  employeeId: string;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  carryOverDays: number;
  lastAccrualYear: number | null;
  updatedAt: string;
};

export type LeaveCalendarDensity = "none" | "low" | "mid" | "high";
export type LeaveCalendarStatusTone = "none" | "approved" | "pending" | "rejected" | "mixed";

export type LeaveCalendarDayCellEvent = {
  requestId: string;
  employeeId: string;
  employeeName: string | null;
  isMine: boolean;
  state: EmployeeLeaveCalendarState;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY";
};

export type LeaveCalendarDayCell = {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  requestCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  events: LeaveCalendarDayCellEvent[];
  density: LeaveCalendarDensity;
  tone: LeaveCalendarStatusTone;
};

export type RequestFeedbackRow = {
  id: string;
  channel: "attendance" | "leave";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  at: string;
  message: string;
  tone: "ok" | "pending" | "fail";
};

export type RequestFailureCause = {
  id: string;
  source: string;
  message: string;
  at: string;
};

export type RequestStatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
export type TimelineChannelFilter = "all" | "attendance" | "leave";

export type MobileRequestTimelineItem = {
  id: string;
  channel: "attendance" | "leave";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  at: string;
  title: string;
  detail: string;
};

export type PreSubmitCheckItem = {
  id: string;
  pass: boolean;
  label: string;
  detail: string;
};

export type IntegratedSummaryCard = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "pending" | "fail" | "info";
};

export type ResubmitCandidate = {
  key: string;
  channel: "attendance" | "leave";
  recordId: string;
  status: "REJECTED" | "CANCELED";
  at: string;
  reason: string;
  summary: string;
};

export type IntegratedSubmitChecklistCard = {
  key: string;
  label: string;
  passCount: number;
  totalCount: number;
  ready: boolean;
  detail: string;
  targetSectionId: string;
};

export type RequestSearchScope = "all" | "request_id" | "status" | "content";
export type RequestSortOption = "pending_first" | "latest_desc" | "oldest_asc" | "status";

export type RequestSearchRow = {
  key: string;
  channel: "attendance" | "leave";
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  at: string;
  summary: string;
  detail: string;
  pendingHours: number;
};
