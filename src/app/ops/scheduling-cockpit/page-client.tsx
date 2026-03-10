"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type StreamStatus = "idle" | "connecting" | "streaming" | "ended" | "reconnecting" | "error";
type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL";

type CockpitSnapshotEvent = {
  sequence: number;
  sampleCount: number;
  report: {
    generatedAt: string;
    counts: {
      evaluatedSchedules: number;
      anomalies: number;
      late: number;
      noShow: number;
    };
    severities: {
      minor: number;
      major: number;
      critical: number;
    };
    queue: Array<{
      scheduleId: string;
      employeeId: string;
      anomalyType: "LATE" | "NO_SHOW";
      severity: IncidentSeverity;
      lateMinutes: number | null;
      scheduleStartAt: string;
      recommendedAction: string;
    }>;
  };
};

type IncidentAutomationEvent = {
  sequence: number;
  generatedAt: string;
  thresholdSeverity: IncidentSeverity;
  matchedCount: number;
  recommendedAction: "TRIGGER_TICKET_AUTOMATION" | "NONE";
  queue: Array<{
    scheduleId: string;
    employeeId: string;
    anomalyType: "LATE" | "NO_SHOW";
    severity: IncidentSeverity;
    recommendedAction: string;
  }>;
};

type StreamErrorEvent = {
  sequence: number;
  status: number;
  message: string;
};

type IncidentCommandAction = "ack" | "assign" | "resolve";

type IncidentCommandLog = {
  id: number;
  action: IncidentCommandAction;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

type IncidentReadModel = {
  incidentId: string;
  state: "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
  assigneeId: string | null;
  resolutionCode: string | null;
  note: string | null;
  updatedAt: string;
  history: Array<{
    action: "ACKNOWLEDGE" | "ASSIGN" | "RESOLVE";
    updatedAt: string;
  }>;
};

function toIsoInputValue(value: Date) {
  const shifted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function defaultFrom() {
  const now = new Date();
  return toIsoInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
}

function defaultTo() {
  const now = new Date();
  return toIsoInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0));
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

function parseSseBlock(block: string) {
  const lines = block.split("\n");
  let event = "message";
  const dataParts: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataParts.push(line.slice("data:".length).trim());
    }
  }

  return {
    event,
    data: dataParts.join("\n")
  };
}

export default function SchedulingCockpitOpsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [actorId, setActorId] = useState("MGR-OPS-1001");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState("10");
  const [topN, setTopN] = useState("20");
  const [intervalSeconds, setIntervalSeconds] = useState("1");
  const [sampleCount, setSampleCount] = useState("15");
  const [incidentAutomation, setIncidentAutomation] = useState(true);
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>("MAJOR");
  const [incidentCooldownSeconds, setIncidentCooldownSeconds] = useState("120");
  const [autoReconnect, setAutoReconnect] = useState(true);

  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [snapshots, setSnapshots] = useState<CockpitSnapshotEvent[]>([]);
  const [incidentEvents, setIncidentEvents] = useState<IncidentAutomationEvent[]>([]);
  const [streamErrors, setStreamErrors] = useState<StreamErrorEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [incidentId, setIncidentId] = useState("INC-ANOMALY-20260217-0001");
  const [incidentAssigneeId, setIncidentAssigneeId] = useState("OPS-ONCALL-1");
  const [incidentResolutionCode, setIncidentResolutionCode] = useState<
    "FALSE_POSITIVE" | "ATTENDANCE_CORRECTED" | "MANUAL_CONFIRMED" | "OTHER"
  >("OTHER");
  const [incidentNote, setIncidentNote] = useState("");
  const [incidentLogs, setIncidentLogs] = useState<IncidentCommandLog[]>([]);
  const [incidentReadModels, setIncidentReadModels] = useState<IncidentReadModel[]>([]);
  const [incidentReadError, setIncidentReadError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTokenRef = useRef(0);

  const usesBearerToken = accessToken.trim().length > 0;
  const latestSnapshot = snapshots[0];

  function clearReconnectTimer() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }

  function resolveAuthHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${accessToken.trim()}`;
      return headers;
    }

    headers["x-actor-role"] = "manager";
    headers["x-actor-id"] = actorId.trim() || "MGR-OPS-1001";
    if (organizationId.trim()) {
      headers["x-actor-organization-id"] = organizationId.trim();
    }
    return headers;
  }

  function stopStream(message = "Stopped") {
    streamTokenRef.current += 1;
    clearReconnectTimer();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamStatus("idle");
    setStatusMessage(message);
  }

  async function startStream() {
    stopStream("Preparing stream");

    const token = streamTokenRef.current;
    const abortController = new AbortController();
    abortRef.current = abortController;
    setStreamStatus("connecting");
    setStatusMessage("Connecting stream...");

    const query = buildQuery({
      from: toIso(from),
      to: toIso(to),
      lateThresholdMinutes,
      topN,
      intervalSeconds,
      sampleCount,
      incidentAutomation: incidentAutomation ? "true" : "false",
      incidentSeverity,
      incidentCooldownSeconds
    });

    const headers = resolveAuthHeaders();

    try {
      const response = await fetch(`/api/scheduling/anomalies/cockpit/stream${query}`, {
        method: "GET",
        headers,
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        setStreamStatus("error");
        setStatusMessage(`Connect failed (${response.status})`);
        setStreamErrors((prev) => [
          {
            sequence: -1,
            status: response.status,
            message: errorText || "stream open failed"
          },
          ...prev
        ]);
        return;
      }

      if (!response.body) {
        setStreamStatus("error");
        setStatusMessage("Response body is empty.");
        return;
      }

      setStreamStatus("streaming");
      setStatusMessage("Streaming");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (token !== streamTokenRef.current) {
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        while (true) {
          const boundary = buffer.indexOf("\n\n");
          if (boundary < 0) {
            break;
          }

          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const parsed = parseSseBlock(block);
          if (!parsed.data) {
            continue;
          }

          let payload: unknown;
          try {
            payload = JSON.parse(parsed.data);
          } catch {
            continue;
          }

          if (parsed.event === "cockpit-snapshot") {
            const event = payload as CockpitSnapshotEvent;
            setSnapshots((prev) => [event, ...prev].slice(0, 50));
            setStreamStatus("streaming");
            setStatusMessage(`Streaming (sequence ${event.sequence})`);
            continue;
          }

          if (parsed.event === "incident-automation") {
            const event = payload as IncidentAutomationEvent;
            setIncidentEvents((prev) => [event, ...prev].slice(0, 30));
            continue;
          }

          if (parsed.event === "stream-error") {
            const event = payload as StreamErrorEvent;
            setStreamErrors((prev) => [event, ...prev].slice(0, 30));
            setStreamStatus("error");
            setStatusMessage(`Stream error: ${event.message}`);
            continue;
          }

          if (parsed.event === "stream-end") {
            setStreamStatus("ended");
            setStatusMessage("Stream ended");
          }
        }
      }

      if (token !== streamTokenRef.current) {
        return;
      }
      if (abortController.signal.aborted) {
        return;
      }

      if (autoReconnect) {
        setStreamStatus("reconnecting");
        setStatusMessage("Reconnecting soon...");
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          void startStream();
        }, 2000);
      } else {
        setStreamStatus("ended");
        setStatusMessage("Stream ended");
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }
      setStreamStatus("error");
      setStatusMessage("Stream stopped due to network error.");
      setStreamErrors((prev) => [
        {
          sequence: -1,
          status: 0,
          message: error instanceof Error ? error.message : "unknown stream error"
        },
        ...prev
      ]);
    }
  }

  async function runIncidentCommand(action: IncidentCommandAction) {
    const normalizedIncidentId = incidentId.trim();
    if (!normalizedIncidentId) {
      setStatusMessage("incidentId is required for lifecycle commands.");
      return;
    }

    const endpointByAction: Record<IncidentCommandAction, string> = {
      ack: `/api/scheduling/anomalies/incidents/${normalizedIncidentId}/ack`,
      assign: `/api/scheduling/anomalies/incidents/${normalizedIncidentId}/assign`,
      resolve: `/api/scheduling/anomalies/incidents/${normalizedIncidentId}/resolve`
    };

    const payload: Record<string, string> = {};
    const note = incidentNote.trim();
    if (note.length > 0) {
      payload.note = note;
    }
    if (action === "assign") {
      payload.assigneeId = incidentAssigneeId.trim();
    }
    if (action === "resolve") {
      payload.resolutionCode = incidentResolutionCode;
    }

    const headers = resolveAuthHeaders();
    headers["content-type"] = "application/json";

    try {
      const response = await fetch(endpointByAction[action], {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const raw = await response.text();
      let body: unknown = null;
      if (raw.trim().length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      setIncidentLogs((prev) => [
        {
          id: Date.now(),
          action,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR"),
          body
        },
        ...prev
      ]);

      if (response.ok) {
        setStatusMessage(`Incident command '${action}' completed.`);
        void refreshIncidentReadModels();
      } else {
        setStatusMessage(`Incident command '${action}' failed (${response.status}).`);
      }
    } catch (error) {
      setIncidentLogs((prev) => [
        {
          id: Date.now(),
          action,
          status: 0,
          ok: false,
          at: new Date().toLocaleString("ko-KR"),
          body: error instanceof Error ? error.message : "unknown request error"
        },
        ...prev
      ]);
      setStatusMessage(`Incident command '${action}' failed due to network error.`);
    }
  }

  async function refreshIncidentReadModels() {
    const headers = resolveAuthHeaders();
    const query = buildQuery({ topN: "20" });

    try {
      const response = await fetch(`/api/scheduling/anomalies/incidents${query}`, {
        method: "GET",
        headers
      });
      const raw = await response.text();
      let body: unknown = null;
      if (raw.trim().length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      if (!response.ok) {
        setIncidentReadError(`Read model refresh failed (${response.status}).`);
        return;
      }

      const parsed = body as { items?: IncidentReadModel[] };
      setIncidentReadModels(parsed.items ?? []);
      setIncidentReadError("");
    } catch (error) {
      setIncidentReadError(
        error instanceof Error ? error.message : "unknown read model refresh error"
      );
    }
  }

  const statusClassName = useMemo(() => {
    if (streamStatus === "streaming") {
      return styles.statusOk;
    }
    if (streamStatus === "error") {
      return styles.statusError;
    }
    if (streamStatus === "connecting" || streamStatus === "reconnecting") {
      return styles.statusPending;
    }
    return styles.statusIdle;
  }, [streamStatus]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>FlowHR Ops Cockpit</p>
        <h1>Scheduling anomaly real-time operations dashboard</h1>
        <p>
          Monitor cockpit snapshots and incident automation signals together. Both Dev Header mode and
          Bearer token mode are supported.
        </p>
        <div className={`${styles.statusBadge} ${statusClassName}`}>{statusMessage}</div>
      </section>

      <section className={styles.controls}>
        <h2>Connection Settings</h2>
        <div className={styles.grid}>
          <label>
            Organization ID
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            Manager Actor ID
            <input value={actorId} onChange={(event) => setActorId(event.target.value)} />
          </label>
          <label className={styles.full}>
            Bearer Token (Optional)
            <textarea
              rows={2}
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="If empty, x-actor-* header mode will be used"
            />
          </label>
          <label>
            From
            <input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label>
            lateThresholdMinutes
            <input value={lateThresholdMinutes} onChange={(event) => setLateThresholdMinutes(event.target.value)} />
          </label>
          <label>
            topN
            <input value={topN} onChange={(event) => setTopN(event.target.value)} />
          </label>
          <label>
            intervalSeconds
            <input value={intervalSeconds} onChange={(event) => setIntervalSeconds(event.target.value)} />
          </label>
          <label>
            sampleCount
            <input value={sampleCount} onChange={(event) => setSampleCount(event.target.value)} />
          </label>
          <label>
            incidentSeverity
            <select
              value={incidentSeverity}
              onChange={(event) => setIncidentSeverity(event.target.value as IncidentSeverity)}
            >
              <option value="MINOR">MINOR</option>
              <option value="MAJOR">MAJOR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            incidentCooldownSeconds
            <input
              value={incidentCooldownSeconds}
              onChange={(event) => setIncidentCooldownSeconds(event.target.value)}
            />
          </label>
          <label className={styles.inlineToggle}>
            <input
              type="checkbox"
              checked={incidentAutomation}
              onChange={(event) => setIncidentAutomation(event.target.checked)}
            />
            incidentAutomation
          </label>
          <label className={styles.inlineToggle}>
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(event) => setAutoReconnect(event.target.checked)}
            />
            autoReconnect
          </label>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => void startStream()}>
            Start Stream
          </button>
          <button className={styles.secondaryBtn} onClick={() => stopStream("Stopped manually")}>
            Stop Stream
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => {
              setSnapshots([]);
              setIncidentEvents([]);
              setStreamErrors([]);
            }}
          >
            Clear Events
          </button>
        </div>
      </section>

      <section className={styles.controls}>
        <h2>Incident Lifecycle Commands</h2>
        <div className={styles.grid}>
          <label>
            incidentId
            <input value={incidentId} onChange={(event) => setIncidentId(event.target.value)} />
          </label>
          <label>
            assigneeId
            <input
              value={incidentAssigneeId}
              onChange={(event) => setIncidentAssigneeId(event.target.value)}
            />
          </label>
          <label>
            resolutionCode
            <select
              value={incidentResolutionCode}
              onChange={(event) =>
                setIncidentResolutionCode(
                  event.target.value as
                    | "FALSE_POSITIVE"
                    | "ATTENDANCE_CORRECTED"
                    | "MANUAL_CONFIRMED"
                    | "OTHER"
                )
              }
            >
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              <option value="ATTENDANCE_CORRECTED">ATTENDANCE_CORRECTED</option>
              <option value="MANUAL_CONFIRMED">MANUAL_CONFIRMED</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label className={styles.full}>
            note (optional)
            <textarea
              rows={2}
              value={incidentNote}
              onChange={(event) => setIncidentNote(event.target.value)}
            />
          </label>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => void runIncidentCommand("ack")}>
            ACK
          </button>
          <button className={styles.secondaryBtn} onClick={() => void runIncidentCommand("assign")}>
            ASSIGN
          </button>
          <button className={styles.secondaryBtn} onClick={() => void runIncidentCommand("resolve")}>
            RESOLVE
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => {
              setIncidentLogs([]);
            }}
          >
            Clear Command Logs
          </button>
          <button className={styles.secondaryBtn} onClick={() => void refreshIncidentReadModels()}>
            Refresh Read Model
          </button>
        </div>
        {incidentLogs.length > 0 ? (
          <ul className={styles.eventList}>
            {incidentLogs.map((log) => (
              <li key={log.id}>
                <div>
                  <strong>{log.ok ? "OK" : "FAIL"}</strong> {log.action} / status {log.status}
                </div>
                <div>{log.at}</div>
                <div>
                  <code>{typeof log.body === "string" ? log.body : JSON.stringify(log.body)}</code>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No incident lifecycle command logs yet.</p>
        )}
        {incidentReadError ? <p className={styles.empty}>{incidentReadError}</p> : null}
        {incidentReadModels.length > 0 ? (
          <ul className={styles.eventList}>
            {incidentReadModels.map((incident) => (
              <li key={incident.incidentId}>
                <div>
                  <strong>{incident.state}</strong> / {incident.incidentId}
                </div>
                <div>assignee: {incident.assigneeId ?? "-"}</div>
                <div>resolution: {incident.resolutionCode ?? "-"}</div>
                <div>updatedAt: {formatDateTime(incident.updatedAt)}</div>
                <div>history: {incident.history.length}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No incident read-model entry yet.</p>
        )}
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.card}>
          <h2>Latest Snapshot</h2>
          {!latestSnapshot ? (
            <p className={styles.empty}>No snapshot received yet.</p>
          ) : (
            <>
              <p className={styles.meta}>
                sequence {latestSnapshot.sequence} / sample {latestSnapshot.sampleCount} / generatedAt{" "}
                {formatDateTime(latestSnapshot.report.generatedAt)}
              </p>
              <div className={styles.kpiGrid}>
                <div>
                  <strong>{latestSnapshot.report.counts.anomalies}</strong>
                  <span>anomalies</span>
                </div>
                <div>
                  <strong>{latestSnapshot.report.counts.late}</strong>
                  <span>late</span>
                </div>
                <div>
                  <strong>{latestSnapshot.report.counts.noShow}</strong>
                  <span>no-show</span>
                </div>
                <div>
                  <strong>{latestSnapshot.report.severities.critical}</strong>
                  <span>critical</span>
                </div>
              </div>
            </>
          )}
        </article>

        <article className={styles.card}>
          <h2>Queue</h2>
          {latestSnapshot?.report.queue.length ? (
            <ul className={styles.queueList}>
              {latestSnapshot.report.queue.slice(0, 10).map((entry) => (
                <li key={`${entry.scheduleId}:${entry.employeeId}`}>
                  <div>
                    <strong>{entry.severity}</strong> - {entry.anomalyType}
                  </div>
                  <div>{entry.employeeId}</div>
                  <div>{formatDateTime(entry.scheduleStartAt)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No queue item.</p>
          )}
        </article>

        <article className={styles.card}>
          <h2>Incident Automation Events</h2>
          {incidentEvents.length ? (
            <ul className={styles.eventList}>
              {incidentEvents.map((event, index) => (
                <li key={`${event.sequence}:${event.generatedAt}:${index}`}>
                  <div>
                    <strong>{event.recommendedAction}</strong> - {event.thresholdSeverity}
                  </div>
                  <div>matched: {event.matchedCount}</div>
                  <div>{formatDateTime(event.generatedAt)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No incident-automation event yet.</p>
          )}
        </article>

        <article className={styles.card}>
          <h2>Stream Errors</h2>
          {streamErrors.length ? (
            <ul className={styles.eventList}>
              {streamErrors.map((event, index) => (
                <li key={`${event.sequence}:${event.status}:${index}`}>
                  <div>
                    <strong>status {event.status}</strong>
                  </div>
                  <div>{event.message}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No stream error.</p>
          )}
        </article>
      </section>
    </main>
  );
}
