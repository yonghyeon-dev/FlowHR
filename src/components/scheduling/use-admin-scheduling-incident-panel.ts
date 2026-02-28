"use client";

import { useMemo, useState } from "react";

import type { AdminSchedulingCopy } from "@/components/scheduling/copy";
import { buildQuery } from "@/components/scheduling/helpers";

export type ScheduleAnomalyIncidentState = "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
export type ScheduleAnomalyIncidentFilterState = "ALL" | ScheduleAnomalyIncidentState;
export type ScheduleAnomalyIncidentResolutionCode =
  | "FALSE_POSITIVE"
  | "ATTENDANCE_CORRECTED"
  | "MANUAL_CONFIRMED"
  | "OTHER";

export type ScheduleAnomalyIncidentDto = {
  incidentId: string;
  state: ScheduleAnomalyIncidentState;
  assigneeId: string | null;
  updatedAt: string;
  history: unknown[];
};

type IncidentSummary = {
  total: number;
  acknowledged: number;
  assigned: number;
  resolved: number;
  unassigned: number;
};

type ApiCall = (
  label: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  payload?: Record<string, unknown>
) => Promise<unknown>;

type UseAdminSchedulingIncidentPanelInput = {
  copy: AdminSchedulingCopy;
  callApi: ApiCall;
  setStatusMessage: (value: string) => void;
};

export type AdminSchedulingIncidentPanelState = {
  incidentFilterState: ScheduleAnomalyIncidentFilterState;
  incidentAssigneeId: string;
  incidentTopN: string;
  incidentTotal: number;
  incidents: ScheduleAnomalyIncidentDto[];
  incidentSummary: IncidentSummary;
  selectedIncidentId: string;
  incidentActionAssigneeId: string;
  incidentActionNote: string;
  incidentResolutionCode: ScheduleAnomalyIncidentResolutionCode;
  onIncidentFilterStateChange: (value: ScheduleAnomalyIncidentFilterState) => void;
  onIncidentAssigneeIdChange: (value: string) => void;
  onIncidentTopNChange: (value: string) => void;
  onSelectIncident: (value: string) => void;
  onIncidentActionAssigneeIdChange: (value: string) => void;
  onIncidentActionNoteChange: (value: string) => void;
  onIncidentResolutionCodeChange: (value: ScheduleAnomalyIncidentResolutionCode) => void;
  onLoadIncidents: () => void;
  onRunIncidentQuickFilter: (value: ScheduleAnomalyIncidentFilterState) => void;
  onAcknowledgeIncident: () => void;
  onAssignIncident: () => void;
  onResolveIncident: () => void;
};

function normalizeIncidentTopN(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(200, Math.max(1, Math.trunc(parsed)));
}

function buildIncidentSummary(incidents: ScheduleAnomalyIncidentDto[], total: number): IncidentSummary {
  return {
    total,
    acknowledged: incidents.filter((incident) => incident.state === "ACKNOWLEDGED").length,
    assigned: incidents.filter((incident) => incident.state === "ASSIGNED").length,
    resolved: incidents.filter((incident) => incident.state === "RESOLVED").length,
    unassigned: incidents.filter((incident) => !incident.assigneeId).length
  };
}

function toOptionalNote(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function useAdminSchedulingIncidentPanel(
  input: UseAdminSchedulingIncidentPanelInput
): AdminSchedulingIncidentPanelState {
  const [incidentFilterState, setIncidentFilterState] = useState<ScheduleAnomalyIncidentFilterState>("ALL");
  const [incidentAssigneeId, setIncidentAssigneeId] = useState("");
  const [incidentTopN, setIncidentTopN] = useState("20");
  const [incidents, setIncidents] = useState<ScheduleAnomalyIncidentDto[]>([]);
  const [incidentTotal, setIncidentTotal] = useState(0);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [incidentActionAssigneeId, setIncidentActionAssigneeId] = useState("");
  const [incidentActionNote, setIncidentActionNote] = useState("");
  const [incidentResolutionCode, setIncidentResolutionCode] =
    useState<ScheduleAnomalyIncidentResolutionCode>("OTHER");

  const incidentSummary = useMemo(
    () => buildIncidentSummary(incidents, incidentTotal || incidents.length),
    [incidentTotal, incidents]
  );

  function setSelectedIncident(incidentId: string) {
    setSelectedIncidentId(incidentId);
    const matchedIncident = incidents.find((incident) => incident.incidentId === incidentId);
    setIncidentActionAssigneeId(matchedIncident?.assigneeId ?? "");
  }

  async function loadIncidents(nextState?: ScheduleAnomalyIncidentFilterState) {
    const state = nextState ?? incidentFilterState;
    const topN = normalizeIncidentTopN(incidentTopN);
    const queryState = state === "ALL" ? undefined : state;
    const body = (await input.callApi(
      input.copy.pendingIncidentList,
      "GET",
      `/api/scheduling/anomalies/incidents${buildQuery({
        state: queryState,
        assigneeId: incidentAssigneeId.trim() || undefined,
        topN: String(topN)
      })}`
    )) as { total?: number; items?: ScheduleAnomalyIncidentDto[] } | null;

    const items = Array.isArray(body?.items) ? body.items : [];
    setIncidents(items);
    setIncidentTotal(typeof body?.total === "number" ? body.total : items.length);
    if (selectedIncidentId && !items.some((incident) => incident.incidentId === selectedIncidentId)) {
      setSelectedIncidentId("");
    }
    input.setStatusMessage(input.copy.statusIncidentListLoaded);
  }

  function runQuickFilter(state: ScheduleAnomalyIncidentFilterState) {
    setIncidentFilterState(state);
    void loadIncidents(state);
  }

  function requireSelectedIncidentId() {
    const incidentId = selectedIncidentId.trim();
    if (!incidentId) {
      input.setStatusMessage(input.copy.statusIncidentNeedsSelection);
      return null;
    }
    return incidentId;
  }

  async function acknowledgeIncident() {
    const incidentId = requireSelectedIncidentId();
    if (!incidentId) {
      return;
    }
    await input.callApi(
      input.copy.pendingIncidentAcknowledge,
      "POST",
      `/api/scheduling/anomalies/incidents/${encodeURIComponent(incidentId)}/ack`,
      {
        note: toOptionalNote(incidentActionNote)
      }
    );
    input.setStatusMessage(input.copy.statusIncidentAcknowledgeDone);
    await loadIncidents();
  }

  async function assignIncident() {
    const incidentId = requireSelectedIncidentId();
    if (!incidentId) {
      return;
    }
    const assigneeId = incidentActionAssigneeId.trim();
    if (!assigneeId) {
      input.setStatusMessage(input.copy.statusIncidentNeedsAssignee);
      return;
    }
    await input.callApi(
      input.copy.pendingIncidentAssign,
      "POST",
      `/api/scheduling/anomalies/incidents/${encodeURIComponent(incidentId)}/assign`,
      {
        assigneeId,
        note: toOptionalNote(incidentActionNote)
      }
    );
    input.setStatusMessage(input.copy.statusIncidentAssignDone);
    await loadIncidents();
  }

  async function resolveIncident() {
    const incidentId = requireSelectedIncidentId();
    if (!incidentId) {
      return;
    }
    await input.callApi(
      input.copy.pendingIncidentResolve,
      "POST",
      `/api/scheduling/anomalies/incidents/${encodeURIComponent(incidentId)}/resolve`,
      {
        resolutionCode: incidentResolutionCode,
        note: toOptionalNote(incidentActionNote)
      }
    );
    input.setStatusMessage(input.copy.statusIncidentResolveDone);
    await loadIncidents();
  }

  return {
    incidentFilterState,
    incidentAssigneeId,
    incidentTopN,
    incidentTotal,
    incidents,
    incidentSummary,
    selectedIncidentId,
    incidentActionAssigneeId,
    incidentActionNote,
    incidentResolutionCode,
    onIncidentFilterStateChange: setIncidentFilterState,
    onIncidentAssigneeIdChange: setIncidentAssigneeId,
    onIncidentTopNChange: setIncidentTopN,
    onSelectIncident: setSelectedIncident,
    onIncidentActionAssigneeIdChange: setIncidentActionAssigneeId,
    onIncidentActionNoteChange: setIncidentActionNote,
    onIncidentResolutionCodeChange: setIncidentResolutionCode,
    onLoadIncidents: () => void loadIncidents(),
    onRunIncidentQuickFilter: runQuickFilter,
    onAcknowledgeIncident: () => void acknowledgeIncident(),
    onAssignIncident: () => void assignIncident(),
    onResolveIncident: () => void resolveIncident()
  };
}
