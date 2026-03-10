import Link from "next/link";

import {
  resolveNoticeAudienceLabel,
  resolveNoticeStatusLabel,
  resolveNoticeWorkspaceCopy
} from "@/components/notices/copy";
import type { NoticeItem, NoticeStatus } from "@/features/notices/types";
import {
  formatAdminSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

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
type DepartmentOption = { id: string; code: string; name: string; active: boolean };

type AdminNoticeWorkspaceViewProps = {
  copy: NoticeWorkspaceCopy;
  sourceHint: string;
  analyticsBackHref: string;
  analyticsBackLabel: string;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
  statusFilter: NoticeStatus | "all";
  audienceFilter: "all" | "employees" | "admins";
  title: string;
  body: string;
  audience: "all" | "employees" | "admins";
  departments: DepartmentOption[];
  selectedDepartmentIds: string[];
  publishAt: string;
  editingNoticeId: string | null;
  summary: NoticeApiSummary;
  notices: NoticeItem[];
  filteredNotices: NoticeItem[];
  listSearchQuery: string;
  readRiskOnly: boolean;
  readRiskNoticeCount: number;
  readCountByNoticeId: Map<string, number>;
  readCountLabel: string;
  logs: NoticeApiLog[];
  stats: {
    total: number;
    success: number;
  };
  pendingLabel: string | null;
  statusTone: "info" | "success" | "error" | null;
  statusMessage: string;
  onStatusFilterChange: (value: NoticeStatus | "all") => void;
  onAudienceFilterChange: (value: "all" | "employees" | "admins") => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onAudienceChange: (value: "all" | "employees" | "admins") => void;
  onToggleTargetDepartment: (departmentId: string) => void;
  onClearTargetDepartments: () => void;
  onPublishAtChange: (value: string) => void;
  onListSearchQueryChange: (value: string) => void;
  onSetReadRiskOnly: (value: boolean) => void;
  onClearListSearch: () => void;
  onLoadNotices: () => void;
  onCreateNotice: () => void;
  onStartEditNotice: (noticeId: string) => void;
  onCancelEditNotice: () => void;
  onPublishNow: (noticeId: string) => void;
  onDeleteNotice: (noticeId: string) => void;
};

function isReadCoverageRisk(notice: NoticeItem, readCountByNoticeId: Map<string, number>) {
  return notice.status === "PUBLISHED" && (readCountByNoticeId.get(notice.id) ?? 0) === 0;
}

function canMutateNotice(notice: NoticeItem) {
  return notice.status !== "PUBLISHED";
}

export default function AdminNoticeWorkspaceView({
  copy,
  sourceHint,
  analyticsBackHref,
  analyticsBackLabel,
  showDevTools,
  sessionOrganizationId,
  sessionActorId,
  statusFilter,
  audienceFilter,
  title,
  body,
  audience,
  departments,
  selectedDepartmentIds,
  publishAt,
  editingNoticeId,
  summary,
  notices,
  filteredNotices,
  listSearchQuery,
  readRiskOnly,
  readRiskNoticeCount,
  readCountByNoticeId,
  readCountLabel,
  logs,
  stats,
  pendingLabel,
  statusTone,
  statusMessage,
  onStatusFilterChange,
  onAudienceFilterChange,
  onTitleChange,
  onBodyChange,
  onAudienceChange,
  onToggleTargetDepartment,
  onClearTargetDepartments,
  onPublishAtChange,
  onListSearchQueryChange,
  onSetReadRiskOnly,
  onClearListSearch,
  onLoadNotices,
  onCreateNotice,
  onStartEditNotice,
  onCancelEditNotice,
  onPublishNow,
  onDeleteNotice
}: AdminNoticeWorkspaceViewProps) {
  const draftCount = notices.filter((notice) => notice.status === "DRAFT").length;
  const scheduledCount = notices.filter((notice) => notice.status === "SCHEDULED").length;
  const publishedCount = notices.filter((notice) => notice.status === "PUBLISHED").length;
  const hasWorkspaceSession = Boolean(sessionOrganizationId.trim());
  const hasAdminSession = Boolean(sessionActorId.trim());
  const runtimeLocale = copy.pageTitle === "공지사항 워크스페이스" ? "ko-KR" : "en-US";
  const workspaceStatusLabel = runtimeLocale === "ko-KR" ? "작업 공간 상태" : "Workspace status";
  const adminSessionStatusLabel = runtimeLocale === "ko-KR" ? "관리자 세션 상태" : "Admin session status";
  const statusMessageClassName =
    statusTone === "success" ? "small ok" : statusTone === "error" ? "small fail" : "small";

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          {sourceHint ? <p className="small muted">{sourceHint}</p> : null}
        </div>
        <div className="page-actions">
          {analyticsBackHref ? (
            <Link className="btn btn-secondary" href={analyticsBackHref}>
              {analyticsBackLabel}
            </Link>
          ) : null}
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
          {showDevTools ? (
            <p className="small muted">
              {workspaceStatusLabel}: <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {adminSessionStatusLabel}: <strong>{formatAdminSessionConnectionState(hasAdminSession, runtimeLocale)}</strong>
            </p>
          ) : null}
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
            <button
              className={readRiskOnly ? "btn btn-secondary btn-small" : "btn btn-primary btn-small"}
              type="button"
              onClick={() => onSetReadRiskOnly(false)}
            >
              {copy.statusFilter.all} ({notices.length})
            </button>
            <button
              className={readRiskOnly ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
              type="button"
              onClick={() => onSetReadRiskOnly(true)}
              disabled={readRiskNoticeCount === 0}
            >
              {copy.readRiskSummaryLabel} ({readRiskNoticeCount})
            </button>
          </div>
          <p className="small muted">
            {copy.statsLabel}: {summary.total} (D {summary.draft} / S {summary.scheduled} / P {summary.published})
          </p>
          <p className="small muted">
            {copy.statusFilter.DRAFT}: {draftCount} / {copy.statusFilter.SCHEDULED}: {scheduledCount} /{" "}
            {copy.statusFilter.PUBLISHED}: {publishedCount}
          </p>
          <p className="small muted">
            {copy.readRiskSummaryLabel}: {readRiskNoticeCount}
          </p>
          <p className="small muted">
            {copy.logsTitle}: {stats.total} / OK {stats.success} / FAIL {stats.total - stats.success}
            {pendingLabel ? ` / ${copy.pendingLabelPrefix}: ${pendingLabel}` : ""}
          </p>
          {statusMessage ? <p className={statusMessageClassName}>{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{editingNoticeId ? copy.editTitle ?? copy.composeTitle : copy.composeTitle}</h2>
          <label>
            {copy.titleLabel}
            <input value={title} onChange={(event) => onTitleChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.bodyLabel}
            <textarea rows={5} value={body} onChange={(event) => onBodyChange(event.target.value)} maxLength={2000} />
          </label>
          <fieldset>
            <legend>{copy.departmentTargetLabel}</legend>
            <p className="small muted">{copy.departmentTargetHelp}</p>
            <details>
              <summary className="small">
                {selectedDepartmentIds.length === 0
                  ? copy.departmentTargetAllOption
                  : `${copy.departmentTargetSelectedLabel}: ${selectedDepartmentIds.length}`}
              </summary>
              {departments.length === 0 ? (
                <p className="small muted">{copy.departmentTargetEmpty}</p>
              ) : (
                <ul className="simple-list">
                  {departments.map((department) => (
                    <li key={department.id}>
                      <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedDepartmentIds.includes(department.id)}
                          onChange={() => onToggleTargetDepartment(department.id)}
                        />
                        <span>
                          {department.name} <span className="small muted">({department.code})</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </details>
            <div className="actions">
              <button
                className="btn btn-secondary btn-small"
                type="button"
                onClick={onClearTargetDepartments}
                disabled={selectedDepartmentIds.length === 0}
              >
                {copy.clearDepartmentTargetsAction}
              </button>
            </div>
            <p className="small muted">
              {selectedDepartmentIds.length === 0
                ? copy.departmentTargetAllOption
                : `${copy.departmentTargetSelectedLabel}: ${selectedDepartmentIds.length}`}
            </p>
          </fieldset>
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
          <p className="small muted">{copy.scheduleHelp}</p>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onCreateNotice} disabled={Boolean(pendingLabel)}>
              {editingNoticeId ? copy.updateAction ?? copy.createAction : copy.createAction}
            </button>
            {editingNoticeId ? (
              <button className="btn btn-secondary" type="button" onClick={onCancelEditNotice} disabled={Boolean(pendingLabel)}>
                {copy.cancelEditAction ?? copy.clearListSearchAction}
              </button>
            ) : null}
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
            <button className="btn btn-secondary btn-small" type="button" onClick={onClearListSearch} disabled={Boolean(pendingLabel)}>
              {copy.clearListSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.filteredListSummaryLabel}: {filteredNotices.length} / {notices.length}
          </p>
          {notices.length === 0 ? (
            <div>
              <p className="small"><strong>{copy.listEmpty}</strong></p>
              <p className="small muted">{copy.listEmptyHelp}</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div>
              <p className="small"><strong>{copy.filteredListEmpty}</strong></p>
              <p className="small muted">{copy.filteredListEmptyHelp}</p>
            </div>
          ) : (
            <ul className="simple-list">
              {filteredNotices.map((notice) => {
                const readCount = readCountByNoticeId.get(notice.id) ?? 0;
                const needsReadCoverage = isReadCoverageRisk(notice, readCountByNoticeId);
                const actionLocked = !canMutateNotice(notice);
                const actionLockReason = actionLocked
                  ? copy.messages.deletePublishedLocked ?? copy.messages.loadFailed
                  : undefined;
                return (
                  <li key={notice.id}>
                    <span>
                      <strong>{notice.title}</strong>
                      <br />
                      <span className="small muted">{notice.body}</span>
                      <br />
                      <span className="small muted">
                        {resolveNoticeAudienceLabel(copy, notice.audience)} / {resolveNoticeStatusLabel(copy, notice.status)} / {notice.updatedAt}
                      </span>
                      <br />
                      <span className="small muted">
                        {readCountLabel}: {readCount}
                      </span>
                      {editingNoticeId === notice.id ? (
                        <>
                          <br />
                          <span className="small">{copy.editingBadge ?? "Editing"}</span>
                        </>
                      ) : null}
                      {needsReadCoverage ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.readRiskBadgeLabel}
                          </span>
                        </>
                      ) : null}
                    </span>
                    <span className="actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => onStartEditNotice(notice.id)}
                        disabled={actionLocked || Boolean(pendingLabel)}
                        title={actionLockReason}
                      >
                        {copy.editAction ?? "Edit"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => onPublishNow(notice.id)}
                        disabled={actionLocked || Boolean(pendingLabel)}
                        title={actionLockReason}
                      >
                        {copy.publishAction}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => onDeleteNotice(notice.id)}
                        disabled={actionLocked || Boolean(pendingLabel)}
                        title={actionLockReason}
                      >
                        {copy.deleteAction ?? "Delete"}
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        {showDevTools ? (
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
        ) : null}
      </section>
    </main>
  );
}
