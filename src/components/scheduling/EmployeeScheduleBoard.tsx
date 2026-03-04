"use client";

import { useMemo, useState } from "react";

import { employeeScheduleCopyByLocale } from "@/components/scheduling/copy";
import EmployeeScheduleBoardView from "@/components/scheduling/EmployeeScheduleBoardView";
import {
  type ScheduleApiLog,
  type ScheduleHolidayFilter,
  type ScheduleStatusFilter,
  type WorkScheduleDto,
  buildCurrentMonthDateRange,
  buildCurrentWeekDateRange,
  buildNextWeekDateRange,
  buildQuery,
  countScheduleOverlapCandidates,
  exportScheduleRowsCsv,
  exportScheduleRowsIcs,
  extractErrorMessage,
  parseResponseBody,
  resolveScheduleTimeStatus,
  resolveScheduleWorkMinutes,
  toIsoDateRangeEndExclusive,
  toIsoDateRangeStart
} from "@/components/scheduling/helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function EmployeeScheduleBoard() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const productionSessionRequiredNotice =
    isKoLocale
      ? "프로덕션에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요."
      : "A login session is required in production. Please sign in again at /login.";
  const copy = employeeScheduleCopyByLocale[locale];
  const monthRange = buildCurrentMonthDateRange();
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const [fromDate, setFromDate] = useState(monthRange.fromDate);
  const [toDate, setToDate] = useState(monthRange.toDate);
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("all");
  const [holidayFilter, setHolidayFilter] = useState<ScheduleHolidayFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [logs, setLogs] = useState<ScheduleApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const allowHeaderActorFallback = showDevTools || !isProductionRuntime;
  const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;

  const summary = useMemo(() => {
    const nowMs = Date.now();
    const summaryTotalShifts = schedules.length;
    const holidayShifts = schedules.filter((schedule) => schedule.isHoliday).length;
    let totalMinutes = 0;
    let upcomingShifts = 0;
    let inProgressShifts = 0;
    let completedShifts = 0;
    for (const schedule of schedules) {
      totalMinutes += resolveScheduleWorkMinutes(schedule);
      const status = resolveScheduleTimeStatus(schedule, nowMs);
      if (status === "upcoming") {
        upcomingShifts += 1;
      } else if (status === "in_progress") {
        inProgressShifts += 1;
      } else {
        completedShifts += 1;
      }
    }
    const averageMinutesPerShift =
      summaryTotalShifts === 0 ? 0 : Math.round((totalMinutes / summaryTotalShifts) * 10) / 10;
    return {
      totalShifts: summaryTotalShifts,
      holidayShifts,
      totalMinutes,
      averageMinutesPerShift,
      upcomingShifts,
      inProgressShifts,
      completedShifts
    };
  }, [schedules]);

  const rows = useMemo(() => {
    const nowMs = Date.now();
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return schedules
      .map((schedule) => ({ schedule, status: resolveScheduleTimeStatus(schedule, nowMs) }))
      .filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) {
          return false;
        }
        if (holidayFilter === "holiday") {
          return row.schedule.isHoliday;
        }
        if (holidayFilter === "workday") {
          return !row.schedule.isHoliday;
        }
        if (normalizedSearchQuery) {
          const searchable = `${row.schedule.id} ${row.schedule.notes ?? ""}`.toLowerCase();
          if (!searchable.includes(normalizedSearchQuery)) {
            return false;
          }
        }
        return true;
      })
      .sort((left, right) => {
        const leftMs = new Date(left.schedule.startAt).getTime();
        const rightMs = new Date(right.schedule.startAt).getTime();
        return leftMs - rightMs;
      });
  }, [holidayFilter, schedules, searchQuery, statusFilter]);

  const nextSchedule = useMemo(() => {
    const nowMs = Date.now();
    return schedules
      .filter((schedule) => resolveScheduleTimeStatus(schedule, nowMs) === "upcoming")
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())[0] ?? null;
  }, [schedules]);

  const logStats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  async function loadSchedules() {
    if (requiresLoginSession) {
      setStatusMessage(productionSessionRequiredNotice);
      return;
    }
    if (!fromDate || !toDate) {
      setStatusMessage(copy.statusNeedsRange);
      return;
    }
    if (!usesBearerToken && !organizationId.trim()) {
      setStatusMessage(copy.statusNeedsOrgDev);
      return;
    }

    setPendingLabel(copy.pendingList);
    try {
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else if (allowHeaderActorFallback) {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }

      const response = await fetch(
        `/api/scheduling/schedules${buildQuery({
          from: toIsoDateRangeStart(fromDate),
          to: toIsoDateRangeEndExclusive(toDate)
        })}`,
        { method: "GET", headers }
      );
      const body = await parseResponseBody(response);
      setLogs((previous) => [
        {
          id: Date.now(),
          label: copy.pendingList,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale),
          body
        },
        ...previous
      ]);

      if (!response.ok) {
        throw new Error(`${copy.loadErrorPrefix}: ${extractErrorMessage(body, isKoLocale)}`);
      }

      const list = Array.isArray((body as { schedules?: WorkScheduleDto[] } | null)?.schedules)
        ? ((body as { schedules?: WorkScheduleDto[] }).schedules ?? [])
        : [];
      setSchedules(list);
      const overlapCandidates = countScheduleOverlapCandidates(list);
      setStatusMessage(
        `${copy.statusListLoaded} (${copy.statusConflictCandidatesLabel}: ${overlapCandidates}). ${copy.statusRequestTrackingHint}`
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.loadErrorPrefix);
    } finally {
      setPendingLabel(null);
    }
  }

  function applyCurrentMonthRange() {
    const range = buildCurrentMonthDateRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  }

  function applyCurrentWeekRange() {
    const range = buildCurrentWeekDateRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  }

  function applyNextWeekRange() {
    const range = buildNextWeekDateRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
  }

  function clearSearch() { setSearchQuery(""); }
  function exportCsv() {
    setStatusMessage(exportScheduleRowsCsv({ rows, runtimeLocale, isKoLocale }) ? copy.statusExported : copy.statusNoSchedulesToExport);
  }
  function exportIcs() {
    setStatusMessage(exportScheduleRowsIcs({ rows, isKoLocale }) ? copy.statusIcsExported : copy.statusNoSchedulesToExport);
  }

  return (
    <EmployeeScheduleBoardView
      copy={copy}
      runtimeLocale={runtimeLocale}
      showDevTools={showDevTools}
      requiresLoginSession={requiresLoginSession}
      productionSessionRequiredNotice={productionSessionRequiredNotice}
      statusMessage={statusMessage}
      pendingLabel={pendingLabel}
      logStats={logStats}
      rows={rows}
      allScheduleCount={schedules.length}
      nextSchedule={nextSchedule}
      summary={summary}
      logs={logs}
      sessionOrganizationId={organizationId}
      sessionEmployeeId={employeeId}
      fromDate={fromDate}
      toDate={toDate}
      statusFilter={statusFilter}
      holidayFilter={holidayFilter}
      searchQuery={searchQuery}
      visibleScheduleCount={rows.length}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      onStatusFilterChange={setStatusFilter}
      onHolidayFilterChange={setHolidayFilter}
      onSearchQueryChange={setSearchQuery}
      onLoadSchedules={() => void loadSchedules()}
      onApplyCurrentMonthRange={applyCurrentMonthRange}
      onApplyCurrentWeekRange={applyCurrentWeekRange}
      onApplyNextWeekRange={applyNextWeekRange}
      onClearSearch={clearSearch}
      onExportCsv={exportCsv}
      onExportIcs={exportIcs}
    />
  );
}
