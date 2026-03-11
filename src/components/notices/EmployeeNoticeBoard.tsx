"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EmployeeNoticeBoardList } from "@/components/notices/EmployeeNoticeBoardList";
import { resolveEmployeeNoticeBoardCopy } from "@/components/notices/copy";
import {
  buildNoticeQuery,
  buildReadAtByNoticeIdMap,
  filterEmployeeNotices,
  isNoticeUnreadAgingRisk,
  normalizeEmployeeNoticeAgingRiskFilter,
  normalizeEmployeeNoticeReadStatusFilter,
  parseNotices,
  parseReadNoticeIds,
  parseReadReceipts,
  type EmployeeNoticeAgingRiskFilter,
  type EmployeeNoticeReadStatusFilter
} from "@/components/notices/employee-notice-board-helpers";
import { resolveEmployeeNoticeSourceEntry } from "@/components/notices/employee-source-context";
import type { NoticeItem, NoticeReadReceipt } from "@/features/notices/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatEmployeeSessionConnectionState,
  formatLoginSessionRequiredNotice,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export default function EmployeeNoticeBoard() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const copy = resolveEmployeeNoticeBoardCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const productionSessionRequiredNotice = formatLoginSessionRequiredNotice(locale);
  const sourceEntry = resolveEmployeeNoticeSourceEntry(searchParams.get("source"), locale === "ko");
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [readReceipts, setReadReceipts] = useState<NoticeReadReceipt[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readStatusFilter, setReadStatusFilter] = useState<EmployeeNoticeReadStatusFilter>("all");
  const [agingRiskFilter, setAgingRiskFilter] = useState<EmployeeNoticeAgingRiskFilter>("all");
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const allowHeaderActorFallback = showDevTools || !isProductionRuntime;
  const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;
  const hasWorkspaceSession = Boolean(organizationId.trim());
  const hasEmployeeSession = Boolean((supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim());
  const workspaceStatusLabel = runtimeLocale === "ko-KR" ? "작업 공간 상태" : "Workspace status";
  const employeeSessionStatusLabel = runtimeLocale === "ko-KR" ? "직원 세션 상태" : "Employee session status";
  const publishedCount = useMemo(
    () => notices.filter((notice) => notice.status === "PUBLISHED").length,
    [notices]
  );
  const unreadCount = useMemo(
    () => notices.filter((notice) => !readNoticeIds.includes(notice.id)).length,
    [notices, readNoticeIds]
  );
  const readCount = useMemo(() => Math.max(0, notices.length - unreadCount), [notices.length, unreadCount]);
  const unreadAgingRiskCount = useMemo(
    () =>
      notices.filter((notice) => !readNoticeIds.includes(notice.id) && isNoticeUnreadAgingRisk(notice)).length,
    [notices, readNoticeIds]
  );
  const filteredNotices = useMemo(
    () =>
      filterEmployeeNotices({
        notices,
        readNoticeIds,
        searchQuery,
        unreadOnly,
        readStatusFilter,
        agingRiskFilter
      }),
    [agingRiskFilter, notices, readNoticeIds, searchQuery, unreadOnly, readStatusFilter]
  );
  const visibleUnreadNoticeIds = useMemo(
    () => filteredNotices.filter((notice) => !readNoticeIds.includes(notice.id)).map((notice) => notice.id),
    [filteredNotices, readNoticeIds]
  );
  const shouldScopeMarkAllRead =
    searchQuery.trim().length > 0 || unreadOnly || readStatusFilter !== "all" || agingRiskFilter !== "all";
  const isAllQuickFilter = !unreadOnly && readStatusFilter === "all" && agingRiskFilter === "all";
  const isUnreadQuickFilter = !unreadOnly && readStatusFilter === "unread" && agingRiskFilter === "all";
  const isAgingRiskQuickFilter = !unreadOnly && readStatusFilter === "unread" && agingRiskFilter === "aging_3d";
  const readAtByNoticeId = useMemo(() => buildReadAtByNoticeIdMap(readReceipts), [readReceipts]);
  const statusMessageClassName =
    statusMessage === copy.messages.markedRead || statusMessage === copy.messages.markedAllRead
      ? "small ok workspace-inline-status"
      : "small fail workspace-inline-status";

  function buildActorHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
      return headers;
    }
    if (!allowHeaderActorFallback) {
      return headers;
    }
    headers["x-actor-role"] = "employee";
    headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
    headers["x-actor-organization-id"] = organizationId.trim();
    return headers;
  }

  async function loadNotices() {
    if (requiresLoginSession) {
      setStatusMessage(productionSessionRequiredNotice);
      return;
    }
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    setPending(true);
    try {
      const headers = buildActorHeaders();
      const query = buildNoticeQuery({
        organizationId,
        audience: "employees",
        status: "PUBLISHED",
        publishedOnly: "true"
      });
      const response = await fetch(`/api/notices${query}`, {
        method: "GET",
        headers
      });
      const text = await response.text();
      const parsed = text.trim() ? JSON.parse(text) : {};
      if (!response.ok) {
        setStatusMessage(copy.messages.loadFailed);
        return;
      }
      setNotices(parseNotices(parsed));
      setReadNoticeIds(parseReadNoticeIds(parsed));
      setReadReceipts(parseReadReceipts(parsed));
      setStatusMessage("");
    } catch {
      setStatusMessage(copy.messages.loadFailed);
    } finally {
      setPending(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-load intentionally keys off session readiness only
  useEffect(() => {
    if (autoLoadAttempted || requiresLoginSession || (!organizationId.trim() && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadNotices();
  }, [autoLoadAttempted, organizationId, requiresLoginSession, usesBearerToken]);

  async function markAsRead(noticeId: string) {
    if (requiresLoginSession) {
      setStatusMessage(productionSessionRequiredNotice);
      return;
    }
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    setPending(true);
    try {
      const headers = {
        ...buildActorHeaders(),
        "content-type": "application/json"
      };
      const response = await fetch(`/api/notices/${encodeURIComponent(noticeId)}/read`, {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId })
      });
      if (!response.ok) {
        setStatusMessage(copy.messages.markReadFailed);
        return;
      }
      setStatusMessage(copy.messages.markedRead);
      await loadNotices();
    } catch {
      setStatusMessage(copy.messages.markReadFailed);
    } finally {
      setPending(false);
    }
  }

  async function markAllAsRead() {
    if (requiresLoginSession) {
      setStatusMessage(productionSessionRequiredNotice);
      return;
    }
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (visibleUnreadNoticeIds.length === 0) {
      return;
    }
    setPending(true);
    try {
      const headers = {
        ...buildActorHeaders(),
        "content-type": "application/json"
      };
      const payload: { organizationId: string; noticeIds?: string[] } = { organizationId };
      if (shouldScopeMarkAllRead && visibleUnreadNoticeIds.length < unreadCount) {
        payload.noticeIds = visibleUnreadNoticeIds;
      }
      const response = await fetch("/api/notices/read-all", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        setStatusMessage(copy.messages.markAllReadFailed);
        return;
      }
      setStatusMessage(copy.messages.markedAllRead);
      await loadNotices();
    } catch {
      setStatusMessage(copy.messages.markAllReadFailed);
    } finally {
      setPending(false);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setUnreadOnly(false);
    setReadStatusFilter("all");
    setAgingRiskFilter("all");
  }

  function applyQuickFilter(
    nextReadStatusFilter: EmployeeNoticeReadStatusFilter,
    nextAgingRiskFilter: EmployeeNoticeAgingRiskFilter
  ) {
    setUnreadOnly(false);
    setReadStatusFilter(nextReadStatusFilter);
    setAgingRiskFilter(nextAgingRiskFilter);
  }

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <header className="page-header workspace-page-header employee-workspace-status-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          {sourceEntry ? <p className="small muted workspace-source-banner">{sourceEntry.hint}</p> : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {sourceEntry ? sourceEntry.returnLabel : "/employee"}
          </Link>
          {showDevTools ? <Link className="btn btn-secondary" href="/admin/notices">DEV /admin/notices</Link> : null}
        </div>
      </header>
      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}
      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <h2>{copy.filtersTitle}</h2>
          {showDevTools ? (
            <p className="small muted workspace-source-banner">
              {workspaceStatusLabel}: <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {employeeSessionStatusLabel}: <strong>{formatEmployeeSessionConnectionState(hasEmployeeSession, runtimeLocale)}</strong>
            </p>
          ) : null}
          <div className="kpi-strip workspace-summary-strip employee-workspace-status-strip">
            <article className="kpi-card workspace-summary-card employee-workspace-status-card">
              <p>{copy.summaryLabel}</p>
              <strong>{publishedCount}</strong>
            </article>
            <article className="kpi-card workspace-summary-card employee-workspace-status-card">
              <p>{copy.filteredSummaryLabel}</p>
              <strong>{filteredNotices.length}</strong>
            </article>
            <article className="kpi-card workspace-summary-card employee-workspace-status-card">
              <p>{copy.unreadLabel}</p>
              <strong>{unreadCount}</strong>
            </article>
            <article className="kpi-card workspace-summary-card employee-workspace-status-card">
              <p>{copy.readStatusFilterReadOption}</p>
              <strong>{readCount}</strong>
            </article>
            <article className="kpi-card workspace-summary-card employee-workspace-status-card">
              <p>{copy.unreadAgingRiskSummaryLabel}</p>
              <strong>{unreadAgingRiskCount}</strong>
            </article>
          </div>
          <label>
            {copy.searchLabel}
            <input
              value={searchQuery}
              placeholder={copy.searchPlaceholder}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label>
            {copy.readStatusFilterLabel}
            <select
              value={readStatusFilter}
              onChange={(event) => setReadStatusFilter(normalizeEmployeeNoticeReadStatusFilter(event.target.value))}
            >
              <option value="all">{copy.readStatusFilterAllOption}</option>
              <option value="unread">{copy.readStatusFilterUnreadOption}</option>
              <option value="read">{copy.readStatusFilterReadOption}</option>
            </select>
          </label>
          <label>
            {copy.agingRiskFilterLabel}
            <select
              value={agingRiskFilter}
              onChange={(event) => setAgingRiskFilter(normalizeEmployeeNoticeAgingRiskFilter(event.target.value))}
            >
              <option value="all">{copy.agingRiskFilterAllOption}</option>
              <option value="aging_3d">{copy.agingRiskFilterOnlyOption}</option>
            </select>
          </label>
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
            />
            <span>{copy.unreadOnlyLabel}</span>
          </label>
          <p className="small muted">{copy.readStatusFilterLabel}</p>
          <div className="actions">
            <button
              className={isAllQuickFilter ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
              type="button"
              onClick={() => applyQuickFilter("all", "all")}
              disabled={pending || requiresLoginSession}
            >
              {copy.readStatusFilterAllOption} ({notices.length})
            </button>
            <button
              className={isUnreadQuickFilter ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
              type="button"
              onClick={() => applyQuickFilter("unread", "all")}
              disabled={pending || unreadCount === 0 || requiresLoginSession}
            >
              {copy.readStatusFilterUnreadOption} ({unreadCount})
            </button>
            <button
              className={isAgingRiskQuickFilter ? "btn btn-primary btn-small" : "btn btn-secondary btn-small"}
              type="button"
              onClick={() => applyQuickFilter("unread", "aging_3d")}
              disabled={pending || unreadAgingRiskCount === 0 || requiresLoginSession}
            >
              {copy.agingRiskFilterOnlyOption} ({unreadAgingRiskCount})
            </button>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadNotices()} disabled={pending || requiresLoginSession}>
              {copy.refreshAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={clearFilters} disabled={pending || requiresLoginSession}>
              {copy.clearFiltersAction}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={pending || visibleUnreadNoticeIds.length === 0 || requiresLoginSession}
            >
              {copy.markAllReadAction}
            </button>
          </div>
          <p className="small muted">
            {copy.summaryLabel}: {publishedCount} / {copy.filteredSummaryLabel}: {filteredNotices.length} / {copy.unreadLabel}: {unreadCount} / {copy.readStatusFilterReadOption}: {readCount} / {copy.unreadAgingRiskSummaryLabel}: {unreadAgingRiskCount}
          </p>
          {statusMessage ? <p className={statusMessageClassName}>{statusMessage}</p> : null}
        </article>
        <article className="panel workspace-section-card workspace-note-card">
          <h2>{copy.listTitle}</h2>
          <EmployeeNoticeBoardList
            copy={copy}
            notices={notices}
            filteredNotices={filteredNotices}
            readNoticeIds={readNoticeIds}
            readAtByNoticeId={readAtByNoticeId}
            pending={pending || requiresLoginSession}
            runtimeLocale={runtimeLocale}
            onMarkAsRead={(noticeId) => void markAsRead(noticeId)}
          />
        </article>
      </section>
    </main>
  );
}
