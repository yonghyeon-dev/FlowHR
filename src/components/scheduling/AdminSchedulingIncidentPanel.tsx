import type { AdminSchedulingCopy } from "@/components/scheduling/copy";
import type {
  AdminSchedulingIncidentPanelState,
  ScheduleAnomalyIncidentFilterState,
  ScheduleAnomalyIncidentState
} from "@/components/scheduling/use-admin-scheduling-incident-panel";
import { formatDateTime } from "@/components/scheduling/helpers";

type AdminSchedulingIncidentPanelProps = {
  copy: AdminSchedulingCopy;
  runtimeLocale: string;
  incidentPanel: AdminSchedulingIncidentPanelState;
};

function resolveIncidentStateLabel(state: ScheduleAnomalyIncidentState, copy: AdminSchedulingCopy) {
  if (state === "ACKNOWLEDGED") {
    return copy.incidentStateAcknowledgedLabel;
  }
  if (state === "ASSIGNED") {
    return copy.incidentStateAssignedLabel;
  }
  return copy.incidentStateResolvedLabel;
}

function quickFilterSummaryLabel(state: ScheduleAnomalyIncidentFilterState, copy: AdminSchedulingCopy) {
  if (state === "ACKNOWLEDGED") {
    return copy.incidentSummaryAcknowledgedLabel;
  }
  if (state === "ASSIGNED") {
    return copy.incidentSummaryAssignedLabel;
  }
  if (state === "RESOLVED") {
    return copy.incidentSummaryResolvedLabel;
  }
  return copy.incidentSummaryTotalLabel;
}

export default function AdminSchedulingIncidentPanel({
  copy,
  runtimeLocale,
  incidentPanel
}: AdminSchedulingIncidentPanelProps) {
  const {
    incidentFilterState,
    incidentAssigneeId,
    incidentTopN,
    incidentTotal,
    incidents,
    incidentSummary,
    onIncidentFilterStateChange,
    onIncidentAssigneeIdChange,
    onIncidentTopNChange,
    onLoadIncidents,
    onRunIncidentQuickFilter
  } = incidentPanel;

  const quickFilters: Array<{ state: ScheduleAnomalyIncidentFilterState; count: number }> = [
    { state: "ALL", count: incidentSummary.total || incidentTotal },
    { state: "ACKNOWLEDGED", count: incidentSummary.acknowledged },
    { state: "ASSIGNED", count: incidentSummary.assigned },
    { state: "RESOLVED", count: incidentSummary.resolved }
  ];

  return (
    <article className="panel">
      <h2>{copy.incidentQueueTitle}</h2>
      <div className="input-grid">
        <label>
          {copy.incidentStateFilterLabel}
          <select
            value={incidentFilterState}
            onChange={(event) => onIncidentFilterStateChange(event.target.value as ScheduleAnomalyIncidentFilterState)}
          >
            <option value="ALL">{copy.incidentStateAllLabel}</option>
            <option value="ACKNOWLEDGED">{copy.incidentStateAcknowledgedLabel}</option>
            <option value="ASSIGNED">{copy.incidentStateAssignedLabel}</option>
            <option value="RESOLVED">{copy.incidentStateResolvedLabel}</option>
          </select>
        </label>
        <label>
          {copy.incidentTopNLabel}
          <input value={incidentTopN} onChange={(event) => onIncidentTopNChange(event.target.value)} />
        </label>
      </div>
      <label>
        {copy.incidentAssigneeIdLabel}
        <input value={incidentAssigneeId} onChange={(event) => onIncidentAssigneeIdChange(event.target.value)} />
      </label>
      <div className="actions">
        <button className="btn btn-primary" type="button" onClick={onLoadIncidents}>
          {copy.incidentLoadAction}
        </button>
      </div>
      <p className="small">
        {copy.incidentQuickFilterLabel}: {copy.incidentSummaryTotalLabel} {incidentSummary.total || incidentTotal} /{" "}
        {copy.incidentSummaryUnassignedLabel} {incidentSummary.unassigned}
      </p>
      <div className="actions">
        {quickFilters.map((filter) => (
          <button
            key={filter.state}
            className={filter.state === incidentFilterState ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
            type="button"
            onClick={() => onRunIncidentQuickFilter(filter.state)}
          >
            {quickFilterSummaryLabel(filter.state, copy)} {filter.count}
          </button>
        ))}
      </div>
      {incidents.length === 0 ? (
        <p className="small muted">{copy.incidentListEmpty}</p>
      ) : (
        <ul className="simple-list">
          {incidents.map((incident) => (
            <li key={incident.incidentId}>
              <span>
                <strong>{incident.incidentId}</strong>
                <br />
                <span className="small">
                  {resolveIncidentStateLabel(incident.state, copy)} /{" "}
                  {incident.assigneeId?.trim() || copy.incidentUnassignedAssigneeLabel}
                </span>
                <br />
                <span className="small">
                  {copy.incidentUpdatedAtLabel}: {formatDateTime(incident.updatedAt, runtimeLocale)} /{" "}
                  {copy.incidentHistoryCountLabel}: {incident.history.length}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
