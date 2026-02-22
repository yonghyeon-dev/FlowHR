export type ApprovalQueueType = "attendance" | "leave" | "payroll";

export type QueueFocus = "all" | ApprovalQueueType;
export type QueueSearchScope = "all" | "employee" | "request_id" | "content";
export type QueueAlertLevel = "normal" | "watch" | "critical";
export type AttendanceQueueSort = "checkin_desc" | "checkin_asc" | "stale_desc" | "employee_asc";
export type LeaveQueueSort = "start_desc" | "start_asc" | "stale_desc" | "employee_asc";
export type PayrollQueueSort = "period_desc" | "stale_desc" | "gross_desc" | "employee_asc";

export type ApprovalActivity = {
  id: number;
  queue: ApprovalQueueType;
  actionKind: "approve" | "reject" | "confirm" | "other";
  action: string;
  itemId: string;
  ok: boolean;
  status: number;
  createdAtMs: number;
  at: string;
};

export type QueueBadgeSummary = {
  focus: QueueFocus;
  label: string;
  pending: number;
  visible: number;
  selected: number;
  watch: number;
  critical: number;
  oldestHours: number;
  alertLevel: QueueAlertLevel;
};

export type QueueItemHistorySummary = {
  key: string;
  queue: ApprovalQueueType;
  itemId: string;
  total: number;
  success: number;
  fail: number;
  approved: number;
  rejected: number;
  confirmed: number;
  lastAction: string;
  lastStatus: number;
  lastAt: string;
  lastCreatedAtMs: number;
};

export type QueuePreActionCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type QueueMobileApprovalFeedback = {
  queue: ApprovalQueueType | "mixed";
  action: string;
  okCount: number;
  failCount: number;
  total: number;
  at: string;
};

export type QueueSearchSortScope = "all" | "queue" | "employee" | "request_id" | "detail";
export type QueueSearchSortOption =
  | "priority_desc"
  | "wait_desc"
  | "recent_desc"
  | "employee_asc"
  | "queue_asc";

export type QueueSearchSortRow = {
  key: string;
  queue: ApprovalQueueType;
  queueLabel: string;
  itemId: string;
  employeeId: string;
  waitHours: number;
  waitedAtMs: number;
  severity: QueueAlertLevel;
  selected: boolean;
  detail: string;
};
