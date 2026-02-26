import { createFlowHrApiClient } from "./flowhrApi";
import { normalizeEmployeeRequestRecord } from "./employeeRequest";

const API_TO_MOBILE_STATUS = {
  PENDING: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELED: "canceled"
};

const MOBILE_TO_LEAVE_UNIT = {
  fullDay: "FULL_DAY",
  halfDay: "HALF_DAY",
  hourly: "HOUR"
};

const LEAVE_TO_MOBILE_UNIT = {
  FULL_DAY: "fullDay",
  HALF_DAY: "halfDay",
  HOUR: "hourly"
};

function toDateOnly(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function toIsoAtKst(dateOnly, hour = 9) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateOnly ?? "").trim())) {
    return new Date().toISOString();
  }
  const hh = String(hour).padStart(2, "0");
  return new Date(`${dateOnly}T${hh}:00:00+09:00`).toISOString();
}

function mapLeaveStatus(state) {
  return API_TO_MOBILE_STATUS[String(state ?? "").trim().toUpperCase()] ?? "submitted";
}

function mapAttendanceStatus(state) {
  return API_TO_MOBILE_STATUS[String(state ?? "").trim().toUpperCase()] ?? "submitted";
}

function buildStatusTimeline(input) {
  const {
    createdAt,
    status,
    approvedAt,
    rejectedAt,
    canceledAt,
    fallbackUpdatedAt
  } = input;
  const base = [{ status: "submitted", at: String(createdAt) }];
  if (status === "approved") {
    base.push({ status: "approved", at: String(approvedAt ?? fallbackUpdatedAt ?? createdAt) });
  } else if (status === "rejected") {
    base.push({ status: "rejected", at: String(rejectedAt ?? fallbackUpdatedAt ?? createdAt) });
  } else if (status === "canceled") {
    base.push({ status: "canceled", at: String(canceledAt ?? fallbackUpdatedAt ?? createdAt) });
  }
  return base;
}

function mapLeaveRequestToMobileRecord(item) {
  const status = mapLeaveStatus(item?.state);
  const createdAt = String(item?.createdAt ?? new Date().toISOString());
  return normalizeEmployeeRequestRecord({
    id: `leave-${item?.id ?? ""}`,
    actorId: String(item?.employeeId ?? ""),
    requestType: "leaveRequest",
    requestDate: toDateOnly(item?.startDate),
    leaveEndDate: toDateOnly(item?.endDate),
    leaveUnit: LEAVE_TO_MOBILE_UNIT[item?.unit] ?? "fullDay",
    leaveHours: item?.hours ?? null,
    reason: String(item?.reason ?? ""),
    note: String(item?.decisionReason ?? ""),
    status,
    createdAt,
    statusTimeline: buildStatusTimeline({
      createdAt,
      status,
      approvedAt: item?.approvedAt,
      rejectedAt: item?.rejectedAt,
      canceledAt: item?.canceledAt,
      fallbackUpdatedAt: item?.updatedAt
    })
  });
}

function mapAttendanceRecordToMobileRecord(item) {
  const status = mapAttendanceStatus(item?.state);
  const createdAt = String(item?.createdAt ?? new Date().toISOString());
  return normalizeEmployeeRequestRecord({
    id: `attendance-${item?.id ?? ""}`,
    actorId: String(item?.employeeId ?? ""),
    requestType: "attendanceCorrection",
    requestDate: toDateOnly(item?.checkInAt),
    leaveEndDate: null,
    leaveUnit: null,
    leaveHours: null,
    reason: String(item?.notes ?? "Attendance correction"),
    note: "",
    status,
    createdAt,
    statusTimeline: buildStatusTimeline({
      createdAt,
      status,
      approvedAt: item?.approvedAt,
      rejectedAt: item?.updatedAt,
      canceledAt: null,
      fallbackUpdatedAt: item?.updatedAt
    })
  });
}

function defaultRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 180);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setDate(to.getDate() + 180);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildListQuery(session, range) {
  const query = new URLSearchParams();
  query.set("from", range.from);
  query.set("to", range.to);
  const employeeId = String(session?.actorId ?? "").trim();
  if (employeeId) {
    query.set("employeeId", employeeId);
  }
  return `?${query.toString()}`;
}

function ensureSession(session) {
  const actorId = String(session?.actorId ?? "").trim();
  if (!actorId) {
    throw new Error("actorId is required for mobile employee request API");
  }
}

export async function fetchEmployeeRequestsFromApi({
  session,
  fetchImpl = fetch,
  fromIso,
  toIso
} = {}) {
  ensureSession(session);
  const api = createFlowHrApiClient({ session, baseUrl: session?.baseUrl, fetchImpl });
  const fallbackRange = defaultRange();
  const range = {
    from: fromIso ?? fallbackRange.from,
    to: toIso ?? fallbackRange.to
  };
  const query = buildListQuery(session, range);
  const [leaveResult, attendanceResult] = await Promise.allSettled([
    api.get(`/api/leave/requests${query}`),
    api.get(`/api/attendance/records${query}`)
  ]);

  if (leaveResult.status === "rejected" && attendanceResult.status === "rejected") {
    throw leaveResult.reason instanceof Error ? leaveResult.reason : new Error("Failed to load employee requests from API");
  }

  const requests = [];
  if (leaveResult.status === "fulfilled") {
    const leaves = Array.isArray(leaveResult.value?.requests) ? leaveResult.value.requests : [];
    requests.push(...leaves.map((item) => mapLeaveRequestToMobileRecord(item)));
  }
  if (attendanceResult.status === "fulfilled") {
    const attendance = Array.isArray(attendanceResult.value?.records) ? attendanceResult.value.records : [];
    requests.push(...attendance.map((item) => mapAttendanceRecordToMobileRecord(item)));
  }

  return requests.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function submitEmployeeRequestToApi({ session, draft, fetchImpl = fetch } = {}) {
  ensureSession(session);
  const api = createFlowHrApiClient({ session, baseUrl: session?.baseUrl, fetchImpl });
  const reason = String(draft?.reason ?? "").trim();
  const note = String(draft?.note ?? "").trim();

  if (draft?.requestType === "leaveRequest") {
    const payload = {
      employeeId: String(session.actorId),
      leaveType: "ANNUAL",
      startDate: toIsoAtKst(draft.requestDate, 9),
      endDate: toIsoAtKst(draft.leaveEndDate || draft.requestDate, 18),
      unit: MOBILE_TO_LEAVE_UNIT[draft.leaveUnit] ?? "FULL_DAY",
      hours: draft.leaveUnit === "hourly" ? Number(draft.leaveHours ?? 0) : undefined,
      reason: [reason, note].filter(Boolean).join(" / ")
    };
    const body = await api.post("/api/leave/requests", payload);
    return mapLeaveRequestToMobileRecord(body?.request ?? {});
  }

  const attendancePayload = {
    employeeId: String(session.actorId),
    checkInAt: toIsoAtKst(draft?.requestDate, 9),
    notes: [reason, note].filter(Boolean).join(" / "),
    capture: { channel: "MANUAL" }
  };
  const body = await api.post("/api/attendance/records", attendancePayload);
  return mapAttendanceRecordToMobileRecord(body?.record ?? {});
}
