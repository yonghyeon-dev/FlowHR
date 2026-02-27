"use client";

import { useEffect, useMemo, useState } from "react";

import { adminSchedulingCopyByLocale } from "@/components/scheduling/copy";
import AdminSchedulingWorkspaceView from "@/components/scheduling/AdminSchedulingWorkspaceView";
import {
  type ScheduleApiLog,
  type WorkScheduleDto,
  buildCurrentMonthDateRange,
  buildDefaultScheduleWindow,
  buildQuery,
  extractErrorMessage,
  parseResponseBody,
  toIsoDateRangeEndExclusive,
  toIsoDateRangeStart,
  toIsoDateTime
} from "@/components/scheduling/helpers";
import { useAdminSchedulingIncidentPanel } from "@/components/scheduling/use-admin-scheduling-incident-panel";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminSchedulingWorkspace() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const copy = adminSchedulingCopyByLocale[locale];
  const monthRange = buildCurrentMonthDateRange();
  const defaultWindow = buildDefaultScheduleWindow();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [queryEmployeeId, setQueryEmployeeId] = useState("");
  const [fromDate, setFromDate] = useState(monthRange.fromDate);
  const [toDate, setToDate] = useState(monthRange.toDate);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<ScheduleApiLog[]>([]);

  const [createEmployeeId, setCreateEmployeeId] = useState("");
  const [createStartAt, setCreateStartAt] = useState(defaultWindow.startAt);
  const [createEndAt, setCreateEndAt] = useState(defaultWindow.endAt);
  const [createBreakMinutes, setCreateBreakMinutes] = useState("60");
  const [createIsHoliday, setCreateIsHoliday] = useState("no");
  const [createNotes, setCreateNotes] = useState("");

  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editBreakMinutes, setEditBreakMinutes] = useState("0");
  const [editIsHoliday, setEditIsHoliday] = useState("no");
  const [editNotes, setEditNotes] = useState("");

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId]
  );

  const logStats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  useEffect(() => {
    if (!selectedSchedule) {
      return;
    }
    setEditStartAt(selectedSchedule.startAt.slice(0, 16));
    setEditEndAt(selectedSchedule.endAt.slice(0, 16));
    setEditBreakMinutes(String(selectedSchedule.breakMinutes));
    setEditIsHoliday(selectedSchedule.isHoliday ? "yes" : "no");
    setEditNotes(selectedSchedule.notes ?? "");
  }, [selectedSchedule]);

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });
      const body = await parseResponseBody(response);
      setLogs((previous) => [
        {
          id: Date.now(),
          label,
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
      return body;
    } finally {
      setPendingLabel(null);
    }
  }

  const incidentPanel = useAdminSchedulingIncidentPanel({
    copy,
    callApi,
    setStatusMessage
  });

  async function loadSchedules() {
    if (!organizationId.trim()) {
      setStatusMessage(copy.statusNeedsOrganization);
      return;
    }
    if (!queryEmployeeId.trim()) {
      setStatusMessage(copy.statusNeedsEmployee);
      return;
    }
    if (!fromDate || !toDate) {
      setStatusMessage(copy.statusNeedsRange);
      return;
    }

    const body = (await callApi(
      copy.pendingList,
      "GET",
      `/api/scheduling/schedules${buildQuery({
        from: toIsoDateRangeStart(fromDate),
        to: toIsoDateRangeEndExclusive(toDate),
        employeeId: queryEmployeeId.trim()
      })}`
    )) as { schedules?: WorkScheduleDto[] } | null;

    const list = Array.isArray(body?.schedules) ? body.schedules : [];
    setSchedules(list);
    if (list.length > 0 && !list.some((schedule) => schedule.id === selectedScheduleId)) {
      setSelectedScheduleId(list[0].id);
    }
    if (list.length === 0) {
      setSelectedScheduleId("");
    }
    setStatusMessage(copy.statusListLoaded);
  }

  async function createSchedule() {
    if (!organizationId.trim()) {
      setStatusMessage(copy.statusNeedsOrganization);
      return;
    }
    if (!createEmployeeId.trim()) {
      setStatusMessage(copy.statusNeedsEmployee);
      return;
    }
    if (!createStartAt || !createEndAt) {
      setStatusMessage(copy.statusNeedsDateTime);
      return;
    }

    const startAt = toIsoDateTime(createStartAt);
    const endAt = toIsoDateTime(createEndAt);
    if (!startAt || !endAt) {
      setStatusMessage(copy.statusInvalidDateTime);
      return;
    }

    await callApi(copy.pendingCreate, "POST", "/api/scheduling/schedules", {
      employeeId: createEmployeeId.trim(),
      startAt,
      endAt,
      breakMinutes: Math.max(0, Math.trunc(Number(createBreakMinutes) || 0)),
      isHoliday: createIsHoliday === "yes",
      notes: createNotes.trim().length > 0 ? createNotes.trim() : undefined
    });
    setStatusMessage(copy.statusCreateDone);
    setQueryEmployeeId((previous) => previous || createEmployeeId.trim());
    await loadSchedules();
  }

  async function updateSelectedSchedule() {
    if (!selectedSchedule) {
      return;
    }
    if (!editStartAt || !editEndAt) {
      setStatusMessage(copy.statusNeedsDateTime);
      return;
    }
    const startAt = toIsoDateTime(editStartAt);
    const endAt = toIsoDateTime(editEndAt);
    if (!startAt || !endAt) {
      setStatusMessage(copy.statusInvalidDateTime);
      return;
    }

    await callApi(copy.pendingUpdate, "PATCH", `/api/scheduling/schedules/${encodeURIComponent(selectedSchedule.id)}`, {
      startAt,
      endAt,
      breakMinutes: Math.max(0, Math.trunc(Number(editBreakMinutes) || 0)),
      isHoliday: editIsHoliday === "yes",
      notes: editNotes.trim().length > 0 ? editNotes.trim() : undefined
    });
    setStatusMessage(copy.statusUpdateDone);
    await loadSchedules();
  }

  async function deleteSelectedSchedule() {
    if (!selectedSchedule) {
      return;
    }
    await callApi(copy.pendingDelete, "DELETE", `/api/scheduling/schedules/${encodeURIComponent(selectedSchedule.id)}`);
    setStatusMessage(copy.statusDeleteDone);
    await loadSchedules();
  }

  return (
    <AdminSchedulingWorkspaceView
      copy={copy}
      runtimeLocale={runtimeLocale}
      statusMessage={statusMessage}
      pendingLabel={pendingLabel}
      logStats={logStats}
      logs={logs}
      incidentPanel={incidentPanel}
      schedules={schedules}
      selectedSchedule={selectedSchedule}
      organizationId={organizationId}
      adminActorId={adminActorId}
      accessToken={accessToken}
      queryEmployeeId={queryEmployeeId}
      fromDate={fromDate}
      toDate={toDate}
      createEmployeeId={createEmployeeId}
      createStartAt={createStartAt}
      createEndAt={createEndAt}
      createBreakMinutes={createBreakMinutes}
      createIsHoliday={createIsHoliday}
      createNotes={createNotes}
      editStartAt={editStartAt}
      editEndAt={editEndAt}
      editBreakMinutes={editBreakMinutes}
      editIsHoliday={editIsHoliday}
      editNotes={editNotes}
      onOrganizationIdChange={setOrganizationId}
      onAdminActorIdChange={setAdminActorId}
      onAccessTokenChange={setAccessToken}
      onQueryEmployeeIdChange={setQueryEmployeeId}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      onCreateEmployeeIdChange={setCreateEmployeeId}
      onCreateStartAtChange={setCreateStartAt}
      onCreateEndAtChange={setCreateEndAt}
      onCreateBreakMinutesChange={setCreateBreakMinutes}
      onCreateIsHolidayChange={setCreateIsHoliday}
      onCreateNotesChange={setCreateNotes}
      onEditStartAtChange={setEditStartAt}
      onEditEndAtChange={setEditEndAt}
      onEditBreakMinutesChange={setEditBreakMinutes}
      onEditIsHolidayChange={setEditIsHoliday}
      onEditNotesChange={setEditNotes}
      onLoadSchedules={() => void loadSchedules()}
      onCreateSchedule={() => void createSchedule()}
      onSelectSchedule={setSelectedScheduleId}
      onUpdateSelectedSchedule={() => void updateSelectedSchedule()}
      onDeleteSelectedSchedule={() => void deleteSelectedSchedule()}
    />
  );
}
