import Link from "next/link";

import {
  resolveNoticeAudienceLabel,
  resolveNoticeStatusLabel,
  resolveNoticeWorkspaceCopy
} from "@/components/notices/copy";
import type { NoticeItem, NoticeStatus } from "@/features/notices/types";

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

type NoticeWorkspaceCopy = ReturnType<typeof resolveNoticeWorkspaceCopy>;

type AdminNoticeWorkspaceViewProps = {
  copy: NoticeWorkspaceCopy;
  organizationId: string;
  actorId: string;
  accessToken: string;
  statusFilter: NoticeStatus | "all";
  audienceFilter: "all" | "employees" | "admins";
  title: string;
  body: string;
  audience: "all" | "employees" | "admins";
  publishAt: string;
  summary: NoticeApiSummary;
  notices: NoticeItem[];
  filteredNotices: NoticeItem[];
  listSearchQuery: string;
  readCountByNoticeId: Map<string, number>;
  readCountLabel: string;
  logs: NoticeApiLog[];
  stats: {
    total: number;
    success: number;
  };
  pendingLabel: string | null;
  statusMessage: string;
  onOrganizationIdChange: (value: string) => void;
  onActorIdChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
  onStatusFilterChange: (value: NoticeStatus | "all") => void;
  onAudienceFilterChange: (value: "all" | "employees" | "admins") => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onAudienceChange: (value: "all" | "employees" | "admins") => void;
  onPublishAtChange: (value: string) => void;
  onListSearchQueryChange: (value: string) => void;
  onClearListSearch: () => void;
  onLoadNotices: () => void;
  onCreateNotice: () => void;
  onPublishNow: (noticeId: string) => void;
};

export default function AdminNoticeWorkspaceView({
  copy,
  organizationId,
  actorId,
  accessToken,
  statusFilter,
  audienceFilter,
  title,
  body,
  audience,
  publishAt,
  summary,
  notices,
  filteredNotices,
  listSearchQuery,
  readCountByNoticeId,
  readCountLabel,
  logs,
  stats,
  pendingLabel,
  statusMessage,
  onOrganizationIdChange,
  onActorIdChange,
  onAccessTokenChange,
  onStatusFilterChange,
  onAudienceFilterChange,
  onTitleChange,
  onBodyChange,
  onAudienceChange,
  onPublishAtChange,
  onListSearchQueryChange,
  onClearListSearch,
  onLoadNotices,
  onCreateNotice,
  onPublishNow
}: AdminNoticeWorkspaceViewProps) {
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
            <input value={organizationId} onChange={(event) => onOrganizationIdChange(event.target.value)} />
          </label>
          <label>
            {copy.actorIdLabel}
            <input value={actorId} onChange={(event) => onActorIdChange(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => onAccessTokenChange(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              {copy.statusFilterLabel}
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as NoticeStatus | "all")}
              >
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
                onChange={(event) =>
                  onAudienceFilterChange(event.target.value as "all" | "employees" | "admins")
                }
              >
                <option value="all">{copy.audienceFilter.all}</option>
                <option value="employees">{copy.audienceFilter.employees}</option>
                <option value="admins">{copy.audienceFilter.admins}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onLoadNotices}>
              {copy.refreshAction}
            </button>
          </div>
          <p className="small muted">
            {copy.statsLabel}: {summary.total} (D {summary.draft} / S {summary.scheduled} / P{" "}
            {summary.published})
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
            <input value={title} onChange={(event) => onTitleChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.bodyLabel}
            <textarea rows={5} value={body} onChange={(event) => onBodyChange(event.target.value)} maxLength={2000} />
          </label>
          <div className="input-grid">
            <label>
              {copy.audienceLabel}
              <select
                value={audience}
                onChange={(event) => onAudienceChange(event.target.value as "all" | "employees" | "admins")}
              >
                <option value="all">{copy.audience.all}</option>
                <option value="employees">{copy.audience.employees}</option>
                <option value="admins">{copy.audience.admins}</option>
              </select>
            </label>
            <label>
              {copy.scheduleLabel}
              <input type="datetime-local" value={publishAt} onChange={(event) => onPublishAtChange(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onCreateNotice}>
              {copy.createAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.listTitle}</h2>
          <label>
            {copy.listSearchLabel}
            <input
              value={listSearchQuery}
              onChange={(event) => onListSearchQueryChange(event.target.value)}
              placeholder={copy.listSearchPlaceholder}
            />
          </label>
          <div className="actions">
            <button className="btn btn-secondary btn-small" type="button" onClick={onClearListSearch}>
              {copy.clearListSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.filteredListSummaryLabel}: {filteredNotices.length} / {notices.length}
          </p>
          {notices.length === 0 ? (
            <p className="small muted">{copy.listEmpty}</p>
          ) : filteredNotices.length === 0 ? (
            <p className="small muted">{copy.filteredListEmpty}</p>
          ) : (
            <ul className="simple-list">
              {filteredNotices.map((notice) => (
                <li key={notice.id}>
                  <span>
                    <strong>{notice.title}</strong>
                    <br />
                    <span className="small muted">{notice.body}</span>
                    <br />
                    <span className="small muted">
                      {resolveNoticeAudienceLabel(copy, notice.audience)} ·{" "}
                      {resolveNoticeStatusLabel(copy, notice.status)} · {notice.updatedAt}
                    </span>
                    <br />
                    <span className="small muted">
                      {readCountLabel}: {readCountByNoticeId.get(notice.id) ?? 0}
                    </span>
                  </span>
                  {notice.status === "PUBLISHED" ? null : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => onPublishNow(notice.id)}
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
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.action} /{" "}
                  {log.status}
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
