"use client";

import { useMemo, useState } from "react";

import type { AdminSchedulingCopy } from "@/components/scheduling/copy";
import { buildQuery } from "@/components/scheduling/helpers";

export type ScheduleAnomalyIncidentState = "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
export type ScheduleAnomalyIncidentFilterState = "ALL" | ScheduleAnomalyIncidentState;

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
  onIncidentFilterStateChange: (value: ScheduleAnomalyIncidentFilterState) => void;
  onIncidentAssigneeIdChange: (value: string) => void;
  onIncidentTopNChange: (value: string) => void;
  onLoadIncidents: () => void;
  onRunIncidentQuickFilter: (value: ScheduleAnomalyIncidentFilterState) => void;
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

export function useAdminSchedulingIncidentPanel(
  input: UseAdminSchedulingIncidentPanelInput
): AdminSchedulingIncidentPanelState {
  const [incidentFilterState, setIncidentFilterState] = useState<ScheduleAnomalyIncidentFilterState>("ALL");
  const [incidentAssigneeId, setIncidentAssigneeId] = useState("");
  const [incidentTopN, setIncidentTopN] = useState("20");
  const [incidents, setIncidents] = useState<ScheduleAnomalyIncidentDto[]>([]);
  const [incidentTotal, setIncidentTotal] = useState(0);

  const incidentSummary = useMemo(
    () => buildIncidentSummary(incidents, incidentTotal || incidents.length),
    [incidentTotal, incidents]
  );

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
    input.setStatusMessage(input.copy.statusIncidentListLoaded);
  }

  function runQuickFilter(state: ScheduleAnomalyIncidentFilterState) {
    setIncidentFilterState(state);
    void loadIncidents(state);
  }

  return {
    incidentFilterState,
    incidentAssigneeId,
    incidentTopN,
    incidentTotal,
    incidents,
    incidentSummary,
    onIncidentFilterStateChange: setIncidentFilterState,
    onIncidentAssigneeIdChange: setIncidentAssigneeId,
    onIncidentTopNChange: setIncidentTopN,
    onLoadIncidents: () => void loadIncidents(),
    onRunIncidentQuickFilter: runQuickFilter
  };
}
