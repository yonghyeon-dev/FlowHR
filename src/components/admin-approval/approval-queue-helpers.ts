import {
  type ApprovalQueueType,
  type QueueAlertLevel,
  type QueueSearchScope,
  type QueueSearchSortOption,
  type QueueSearchSortRow,
  type QueueSearchSortScope
} from "./approval-queue-types";

export function toQueueAlertLevelByRule(
  waitHours: number,
  watchThresholdHours: number,
  criticalThresholdHours: number
): QueueAlertLevel {
  if (waitHours >= criticalThresholdHours) {
    return "critical";
  }
  if (waitHours >= watchThresholdHours) {
    return "watch";
  }
  return "normal";
}

export function queueAlertLevelRank(level: QueueAlertLevel) {
  if (level === "critical") {
    return 2;
  }
  if (level === "watch") {
    return 1;
  }
  return 0;
}

export function matchesQueueSearchSort(
  scope: QueueSearchSortScope,
  normalizedQuery: string,
  row: QueueSearchSortRow
) {
  if (!normalizedQuery) {
    return true;
  }
  const queue = row.queueLabel.toLowerCase();
  const employee = row.employeeId.toLowerCase();
  const requestId = row.itemId.toLowerCase();
  const detail = row.detail.toLowerCase();

  if (scope === "queue") {
    return queue.includes(normalizedQuery);
  }
  if (scope === "employee") {
    return employee.includes(normalizedQuery);
  }
  if (scope === "request_id") {
    return requestId.includes(normalizedQuery);
  }
  if (scope === "detail") {
    return detail.includes(normalizedQuery);
  }
  return `${queue} ${employee} ${requestId} ${detail}`.includes(normalizedQuery);
}

export function sortQueueSearchSortRows(rows: QueueSearchSortRow[], option: QueueSearchSortOption) {
  return [...rows].sort((left, right) => {
    if (option === "queue_asc") {
      const queueDiff = left.queueLabel.localeCompare(right.queueLabel, "ko");
      if (queueDiff !== 0) {
        return queueDiff;
      }
      return right.waitHours - left.waitHours;
    }
    if (option === "employee_asc") {
      const employeeDiff = left.employeeId.localeCompare(right.employeeId, "ko");
      if (employeeDiff !== 0) {
        return employeeDiff;
      }
      return right.waitHours - left.waitHours;
    }
    if (option === "recent_desc") {
      return right.waitedAtMs - left.waitedAtMs;
    }
    if (option === "wait_desc") {
      return right.waitHours - left.waitHours;
    }
    const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }
    const waitDiff = right.waitHours - left.waitHours;
    if (waitDiff !== 0) {
      return waitDiff;
    }
    return Number(right.selected) - Number(left.selected);
  });
}

export function summarizeQueueAlertByRule(
  waitHoursValues: number[],
  watchThresholdHours: number,
  criticalThresholdHours: number
) {
  const oldestHours = waitHoursValues.length > 0 ? Math.max(...waitHoursValues) : 0;
  const critical = waitHoursValues.filter(
    (value) => toQueueAlertLevelByRule(value, watchThresholdHours, criticalThresholdHours) === "critical"
  ).length;
  const watch = waitHoursValues.filter(
    (value) => toQueueAlertLevelByRule(value, watchThresholdHours, criticalThresholdHours) === "watch"
  ).length;
  const alertLevel: QueueAlertLevel = critical > 0 ? "critical" : watch > 0 ? "watch" : "normal";
  return { oldestHours, critical, watch, alertLevel };
}

export function matchesQueueSearch(
  scope: QueueSearchScope,
  normalizedQuery: string,
  fields: { employee: string; requestId: string; content: string }
) {
  if (!normalizedQuery) {
    return true;
  }
  const employee = fields.employee.toLowerCase();
  const requestId = fields.requestId.toLowerCase();
  const content = fields.content.toLowerCase();

  if (scope === "employee") {
    return employee.includes(normalizedQuery);
  }
  if (scope === "request_id") {
    return requestId.includes(normalizedQuery);
  }
  if (scope === "content") {
    return content.includes(normalizedQuery);
  }
  return `${employee} ${requestId} ${content}`.includes(normalizedQuery);
}

export function toQueueItemHistoryKey(queue: ApprovalQueueType, itemId: string) {
  return `${queue}:${itemId}`;
}
