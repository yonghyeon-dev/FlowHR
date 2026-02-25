import { formatDateTime, type ScheduleTimeStatus, type WorkScheduleDto } from "@/components/scheduling/helpers";

function escapeCsvValue(value: string) {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

function downloadTextFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export function exportScheduleRowsCsv(input: {
  rows: Array<{ schedule: WorkScheduleDto; status: ScheduleTimeStatus }>;
  runtimeLocale: string;
  isKoLocale: boolean;
}) {
  if (input.rows.length === 0) {
    return false;
  }

  const headers = input.isKoLocale
    ? ["스케줄 ID", "상태", "시작", "종료", "휴일", "휴게(분)", "메모"]
    : ["Schedule ID", "Status", "Start", "End", "Holiday", "Break Minutes", "Notes"];

  const lines = input.rows.map((row) => {
    const { schedule } = row;
    const values = [
      schedule.id,
      row.status,
      formatDateTime(schedule.startAt, input.runtimeLocale),
      formatDateTime(schedule.endAt, input.runtimeLocale),
      schedule.isHoliday ? "Y" : "N",
      String(schedule.breakMinutes),
      schedule.notes?.trim() ?? ""
    ];
    return values.map(escapeCsvValue).join(",");
  });

  const csv = [headers.map(escapeCsvValue).join(","), ...lines].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(csv, "text/csv;charset=utf-8;", `employee-schedule-${stamp}.csv`);
  return true;
}

function toIcsDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function resolveIcsStatusLabel(status: ScheduleTimeStatus, isKoLocale: boolean) {
  if (status === "upcoming") {
    return isKoLocale ? "예정" : "Upcoming";
  }
  if (status === "in_progress") {
    return isKoLocale ? "진행 중" : "In progress";
  }
  return isKoLocale ? "완료" : "Completed";
}

export function exportScheduleRowsIcs(input: {
  rows: Array<{ schedule: WorkScheduleDto; status: ScheduleTimeStatus }>;
  isKoLocale: boolean;
}) {
  if (input.rows.length === 0) {
    return false;
  }

  const dtStamp = toIcsDateTime(new Date().toISOString()) || "19700101T000000Z";
  const events = input.rows
    .map((row) => {
      const { schedule } = row;
      const start = toIcsDateTime(schedule.startAt);
      const end = toIcsDateTime(schedule.endAt);
      if (!start || !end) {
        return "";
      }

      const statusLabel = resolveIcsStatusLabel(row.status, input.isKoLocale);
      const summaryBase = input.isKoLocale ? "근무 스케줄" : "Work schedule";
      const summary = `${summaryBase} (${schedule.id})`;
      const description = input.isKoLocale
        ? [
            `상태: ${statusLabel}`,
            `휴일 근무: ${schedule.isHoliday ? "예" : "아니오"}`,
            `휴게(분): ${schedule.breakMinutes}`,
            `메모: ${schedule.notes?.trim() || "-"}`
          ].join("\n")
        : [
            `Status: ${statusLabel}`,
            `Holiday shift: ${schedule.isHoliday ? "Yes" : "No"}`,
            `Break minutes: ${schedule.breakMinutes}`,
            `Notes: ${schedule.notes?.trim() || "-"}`
          ].join("\n");

      return [
        "BEGIN:VEVENT",
        `UID:${escapeIcsText(`${schedule.id}-${start}@flowhr.local`)}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        "END:VEVENT"
      ].join("\r\n");
    })
    .filter((value) => value.length > 0);

  if (events.length === 0) {
    return false;
  }

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlowHR//Employee Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(calendar, "text/calendar;charset=utf-8;", `employee-schedule-${stamp}.ics`);
  return true;
}
