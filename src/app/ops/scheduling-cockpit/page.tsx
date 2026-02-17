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

    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${accessToken.trim()}`;
    } else {
      headers["x-actor-role"] = "manager";
      headers["x-actor-id"] = actorId.trim() || "MGR-OPS-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }

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
