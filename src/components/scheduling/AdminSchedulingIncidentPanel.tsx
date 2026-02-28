import type { AdminSchedulingCopy } from "@/components/scheduling/copy";
import type {
  AdminSchedulingIncidentPanelState,
  ScheduleAnomalyIncidentFilterState,
  ScheduleAnomalyIncidentResolutionCode,
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

function resolveResolutionCodeLabel(code: ScheduleAnomalyIncidentResolutionCode, copy: AdminSchedulingCopy) {
  if (code === "FALSE_POSITIVE") {
    return copy.incidentResolutionFalsePositiveLabel;
  }
  if (code === "ATTENDANCE_CORRECTED") {
    return copy.incidentResolutionAttendanceCorrectedLabel;
  }
  if (code === "MANUAL_CONFIRMED") {
    return copy.incidentResolutionManualConfirmedLabel;
  }
  return copy.incidentResolutionOtherLabel;
}

const resolutionCodes: ScheduleAnomalyIncidentResolutionCode[] = [
  "FALSE_POSITIVE",
  "ATTENDANCE_CORRECTED",
  "MANUAL_CONFIRMED",
  "OTHER"
];

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
    selectedIncidentId,
    incidentActionAssigneeId,
    incidentActionNote,
    incidentResolutionCode,
    onIncidentFilterStateChange,
    onIncidentAssigneeIdChange,
    onIncidentTopNChange,
    onSelectIncident,
    onIncidentActionAssigneeIdChange,
    onIncidentActionNoteChange,
    onIncidentResolutionCodeChange,
    onLoadIncidents,
    onRunIncidentQuickFilter,
    onAcknowledgeIncident,
    onAssignIncident,
    onResolveIncident
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
              <button
                className={incident.incidentId === selectedIncidentId ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
                type="button"
                onClick={() => onSelectIncident(incident.incidentId)}
              >
                {copy.incidentSelectAction}
              </button>
            </li>
          ))}
        </ul>
      )}
      <hr />
      <h3>{copy.incidentActionTitle}</h3>
      <p className="small">
        {copy.incidentSelectedLabel}:{" "}
        <strong>{selectedIncidentId || copy.incidentUnassignedAssigneeLabel}</strong>
      </p>
      <label>
        {copy.incidentActionAssigneeLabel}
        <input
          value={incidentActionAssigneeId}
          onChange={(event) => onIncidentActionAssigneeIdChange(event.target.value)}
        />
      </label>
      <label>
        {copy.incidentActionNoteLabel}
        <textarea rows={2} value={incidentActionNote} onChange={(event) => onIncidentActionNoteChange(event.target.value)} />
      </label>
      <label>
        {copy.incidentResolutionCodeLabel}
        <select
          value={incidentResolutionCode}
          onChange={(event) => onIncidentResolutionCodeChange(event.target.value as ScheduleAnomalyIncidentResolutionCode)}
        >
          {resolutionCodes.map((code) => (
            <option key={code} value={code}>
              {resolveResolutionCodeLabel(code, copy)}
            </option>
          ))}
        </select>
      </label>
      <div className="actions">
        <button className="btn btn-secondary btn-small" type="button" onClick={onAcknowledgeIncident}>
          {copy.incidentAcknowledgeAction}
        </button>
        <button className="btn btn-secondary btn-small" type="button" onClick={onAssignIncident}>
          {copy.incidentAssignAction}
        </button>
        <button className="btn btn-primary btn-small" type="button" onClick={onResolveIncident}>
          {copy.incidentResolveAction}
        </button>
      </div>
    </article>
  );
}
