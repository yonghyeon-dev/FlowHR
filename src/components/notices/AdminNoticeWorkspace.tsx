"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NoticeItem, NoticeStatus } from "@/features/notices/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import {
  resolveNoticeAudienceLabel,
  resolveNoticeStatusLabel,
  resolveNoticeWorkspaceCopy
} from "@/components/notices/copy";

type NoticeApiSummary = {
  total: number;
  draft: number;
  scheduled: number;
  published: number;
};

type NoticeApiLog = {
  id: number;
  action: string;
  status: number;
  ok: boolean;
  at: string;
};

const DEFAULT_SUMMARY: NoticeApiSummary = {
  total: 0,
  draft: 0,
  scheduled: 0,
  published: 0
};

function parseSummary(payload: unknown): NoticeApiSummary {
  const summary = (payload as { summary?: Partial<NoticeApiSummary> } | null)?.summary;
  if (!summary) {
    return DEFAULT_SUMMARY;
  }
  return {
    total: Number(summary.total ?? 0),
    draft: Number(summary.draft ?? 0),
    scheduled: Number(summary.scheduled ?? 0),
    published: Number(summary.published ?? 0)
  };
}

function parseNotices(payload: unknown) {
  const notices = (payload as { notices?: NoticeItem[] } | null)?.notices;
  return Array.isArray(notices) ? notices : [];
}

function toDateTimeLocalValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}`;
}

function buildQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (!value.trim()) {
      return;
    }
    query.set(key, value.trim());
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export default function AdminNoticeWorkspace() {
  const { locale } = useI18n();
  const copy = resolveNoticeWorkspaceCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [actorId, setActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");

  const [statusFilter, setStatusFilter] = useState<NoticeStatus | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "employees" | "admins">("all");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "employees" | "admins">("all");
  const [publishAt, setPublishAt] = useState(toDateTimeLocalValue());

  const [summary, setSummary] = useState<NoticeApiSummary>(DEFAULT_SUMMARY);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [logs, setLogs] = useState<NoticeApiLog[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => ({
    total: logs.length,
    success: logs.filter((log) => log.ok).length
  }), [logs]);

  function appendLog(action: string, status: number, ok: boolean) {
    setLogs((previous) => [
      {
        id: Date.now(),
        action,
        status,
        ok,
        at: new Date().toLocaleString(runtimeLocale)
      },
      ...previous
    ]);
  }

  async function callApi(action: string, method: "GET" | "POST", path: string, payload?: Record<string, unknown>) {
    setPendingLabel(action);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = actorId.trim() || "ADM-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });
      const text = await response.text();
      const parsed = text.trim() ? JSON.parse(text) : {};
      appendLog(action, response.status, response.ok);
      return { response, parsed };
    } catch {
      appendLog(action, 500, false);
      return { response: { ok: false, status: 500 } as Response, parsed: {} };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadNotices() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }

    const query = buildQuery({
      organizationId,
      status: statusFilter,
      audience: audienceFilter
    });
    const { response, parsed } = await callApi(copy.refreshAction, "GET", `/api/notices${query}`);
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setNotices(parseNotices(parsed));
    setSummary(parseSummary(parsed));
    setStatusMessage(`${copy.statusMessagePrefix}: ${copy.refreshAction}`);
  }

  async function createNoticeItem() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (!title.trim()) {
      setStatusMessage(copy.messages.needTitle);
      return;
    }
    if (!body.trim()) {
      setStatusMessage(copy.messages.needBody);
      return;
    }

    const publishIso = publishAt ? new Date(publishAt).toISOString() : undefined;
    const { response } = await callApi(copy.createAction, "POST", "/api/notices", {
      organizationId,
      title,
      body,
      audience,
      publishAt: publishIso
    });
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setTitle("");
    setBody("");
    setStatusMessage(copy.messages.created);
    await loadNotices();
  }

  async function publishNow(noticeId: string) {
    const { response } = await callApi(copy.publishAction, "POST", `/api/notices/${encodeURIComponent(noticeId)}/publish`);
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }
    setStatusMessage(copy.messages.published);
    await loadNotices();
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            /admin
          </Link>
          <Link className="btn btn-secondary" href="/employee/notices">
            /employee/notices
          </Link>
        </div>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.filtersTitle}</h2>
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.actorIdLabel}
            <input value={actorId} onChange={(event) => setActorId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              {copy.statusFilterLabel}
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as NoticeStatus | "all")}>
                <option value="all">{copy.statusFilter.all}</option>
                <option value="DRAFT">{copy.statusFilter.DRAFT}</option>
                <option value="SCHEDULED">{copy.statusFilter.SCHEDULED}</option>
                <option value="PUBLISHED">{copy.statusFilter.PUBLISHED}</option>
              </select>
            </label>
            <label>
              {copy.audienceFilterLabel}
              <select
                value={audienceFilter}
                onChange={(event) => setAudienceFilter(event.target.value as "all" | "employees" | "admins")}
              >
                <option value="all">{copy.audienceFilter.all}</option>
                <option value="employees">{copy.audienceFilter.employees}</option>
                <option value="admins">{copy.audienceFilter.admins}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadNotices()}>
              {copy.refreshAction}
            </button>
          </div>
          <p className="small muted">
            {copy.statsLabel}: {summary.total} (D {summary.draft} / S {summary.scheduled} / P {summary.published})
          </p>
          <p className="small muted">
            {copy.logsTitle}: {stats.total} / OK {stats.success} / FAIL {stats.total - stats.success}
            {pendingLabel ? ` · ${copy.pendingLabelPrefix}: ${pendingLabel}` : ""}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.composeTitle}</h2>
          <label>
            {copy.titleLabel}
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.bodyLabel}
            <textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} />
          </label>
          <div className="input-grid">
            <label>
              {copy.audienceLabel}
              <select value={audience} onChange={(event) => setAudience(event.target.value as "all" | "employees" | "admins") }>
                <option value="all">{copy.audience.all}</option>
                <option value="employees">{copy.audience.employees}</option>
                <option value="admins">{copy.audience.admins}</option>
              </select>
            </label>
            <label>
              {copy.scheduleLabel}
              <input type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void createNoticeItem()}>
              {copy.createAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.listTitle}</h2>
          {notices.length === 0 ? (
            <p className="small muted">{copy.listEmpty}</p>
          ) : (
            <ul className="simple-list">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <span>
                    <strong>{notice.title}</strong>
                    <br />
                    <span className="small muted">{notice.body}</span>
                    <br />
                    <span className="small muted">
                      {resolveNoticeAudienceLabel(copy, notice.audience)} · {resolveNoticeStatusLabel(copy, notice.status)} · {notice.updatedAt}
                    </span>
                  </span>
                  {notice.status === "PUBLISHED" ? null : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => void publishNow(notice.id)}
                    >
                      {copy.publishAction}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.logsTitle}</h2>
          {logs.length === 0 ? (
            <p className="small muted">{copy.logsEmpty}</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.action} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
