function normalizeText(value) {
  return String(value ?? "").trim();
}

export const EMPLOYEE_REQUEST_TYPE_OPTIONS = [
  { key: "attendanceCorrection", label: "Attendance correction" },
  { key: "leaveRequest", label: "Leave request" }
];

export const EMPLOYEE_LEAVE_UNIT_OPTIONS = [
  { key: "fullDay", label: "Full day" },
  { key: "halfDay", label: "Half day" },
  { key: "hourly", label: "Hourly" }
];

const REQUEST_TYPE_SET = new Set(EMPLOYEE_REQUEST_TYPE_OPTIONS.map((option) => option.key));
const LEAVE_UNIT_SET = new Set(EMPLOYEE_LEAVE_UNIT_OPTIONS.map((option) => option.key));

function asIsoDate(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return "";
  }
  return normalized;
}

function asPositiveNumber(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function normalizeEmployeeRequestDraft(draft = {}) {
  const requestType = REQUEST_TYPE_SET.has(draft.requestType) ? draft.requestType : "attendanceCorrection";
  const leaveUnit = LEAVE_UNIT_SET.has(draft.leaveUnit) ? draft.leaveUnit : "fullDay";
  return {
    requestType,
    requestDate: asIsoDate(draft.requestDate),
    leaveEndDate: asIsoDate(draft.leaveEndDate),
    leaveUnit,
    leaveHours: leaveUnit === "hourly" ? asPositiveNumber(draft.leaveHours) : null,
    reason: normalizeText(draft.reason),
    note: normalizeText(draft.note)
  };
}

export function validateEmployeeRequestDraft(draft) {
  const normalized = normalizeEmployeeRequestDraft(draft);
  const errors = [];

  if (!normalized.requestDate) {
    errors.push("Request date is required (YYYY-MM-DD).");
  }
  if (!normalized.reason || normalized.reason.length < 4) {
    errors.push("Reason must be at least 4 characters.");
  }

  if (normalized.requestType === "leaveRequest") {
    if (!normalized.leaveEndDate) {
      errors.push("Leave end date is required.");
    } else if (normalized.requestDate && normalized.leaveEndDate < normalized.requestDate) {
      errors.push("Leave end date must be on/after request date.");
    }
    if (normalized.leaveUnit === "hourly" && normalized.leaveHours == null) {
      errors.push("Hourly leave requires valid leave hours.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized
  };
}

export function createEmployeeRequestRecord(draft, actorId, now = new Date()) {
  const { normalized } = validateEmployeeRequestDraft(draft);
  return {
    id: `req-${now.getTime()}`,
    actorId: String(actorId ?? ""),
    requestType: normalized.requestType,
    requestDate: normalized.requestDate,
    leaveEndDate: normalized.requestType === "leaveRequest" ? normalized.leaveEndDate : null,
    leaveUnit: normalized.requestType === "leaveRequest" ? normalized.leaveUnit : null,
    leaveHours: normalized.requestType === "leaveRequest" ? normalized.leaveHours : null,
    reason: normalized.reason,
    note: normalized.note,
    status: "submitted",
    createdAt: now.toISOString()
  };
}

export function buildEmployeeRequestStats(items) {
  let total = 0;
  let submitted = 0;
  let attendanceCorrection = 0;
  let leaveRequest = 0;
  for (const item of items) {
    total += 1;
    if (item.status === "submitted") {
      submitted += 1;
    }
    if (item.requestType === "attendanceCorrection") {
      attendanceCorrection += 1;
    }
    if (item.requestType === "leaveRequest") {
      leaveRequest += 1;
    }
  }
  return {
    total,
    submitted,
    attendanceCorrection,
    leaveRequest
  };
}
