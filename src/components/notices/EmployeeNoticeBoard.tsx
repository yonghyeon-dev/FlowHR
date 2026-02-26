"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NoticeItem, NoticeReadReceipt } from "@/features/notices/types";
import { EmployeeNoticeBoardList } from "@/components/notices/EmployeeNoticeBoardList";
import { resolveEmployeeNoticeBoardCopy } from "@/components/notices/copy";
import {
  buildNoticeQuery,
  buildReadAtByNoticeIdMap,
  filterEmployeeNotices,
  normalizeEmployeeNoticeReadStatusFilter,
  parseNotices,
  parseReadNoticeIds,
  parseReadReceipts,
  type EmployeeNoticeReadStatusFilter
} from "@/components/notices/employee-notice-board-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

type NoticeBoardLog = {
  id: number;
  status: number;
  ok: boolean;
  at: string;
};

export default function EmployeeNoticeBoard() {
  const { locale } = useI18n();
  const copy = resolveEmployeeNoticeBoardCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [readReceipts, setReadReceipts] = useState<NoticeReadReceipt[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readStatusFilter, setReadStatusFilter] = useState<EmployeeNoticeReadStatusFilter>("all");
  const [logs, setLogs] = useState<NoticeBoardLog[]>([]);

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const publishedCount = useMemo(
    () => notices.filter((notice) => notice.status === "PUBLISHED").length,
    [notices]
  );
  const unreadCount = useMemo(
    () => notices.filter((notice) => !readNoticeIds.includes(notice.id)).length,
    [notices, readNoticeIds]
  );
  const filteredNotices = useMemo(
    () =>
      filterEmployeeNotices({
        notices,
        readNoticeIds,
        searchQuery,
        unreadOnly,
        readStatusFilter
      }),
    [notices, readNoticeIds, searchQuery, unreadOnly, readStatusFilter]
  );
  const readAtByNoticeId = useMemo(() => buildReadAtByNoticeIdMap(readReceipts), [readReceipts]);

  function buildActorHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
      return headers;
    }

    headers["x-actor-role"] = "employee";
    headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
    headers["x-actor-organization-id"] = organizationId.trim();
    return headers;
  }

  async function loadNotices() {
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

      setLogs((previous) => [
        {
          id: Date.now(),
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...previous
      ]);

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

  async function markAsRead(noticeId: string) {
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
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (unreadCount === 0) {
      return;
    }

    setPending(true);
    try {
      const headers = {
        ...buildActorHeaders(),
        "content-type": "application/json"
      };
      const response = await fetch("/api/notices/read-all", {
        method: "POST",
        headers,
        body: JSON.stringify({ organizationId })
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
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            /employee
          </Link>
          <Link className="btn btn-secondary" href="/admin/notices">
            /admin/notices
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
            {copy.employeeIdLabel}
            <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
          </label>
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
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => setUnreadOnly(event.target.checked)}
            />
            <span>{copy.unreadOnlyLabel}</span>
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadNotices()} disabled={pending}>
              {copy.refreshAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={clearFilters} disabled={pending}>
              {copy.clearFiltersAction}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={pending || unreadCount === 0}
            >
              {copy.markAllReadAction}
            </button>
          </div>
          <p className="small muted">
            {copy.summaryLabel}: {publishedCount} · {copy.filteredSummaryLabel}: {filteredNotices.length} · {copy.unreadLabel}: {unreadCount}
          </p>
          <p className="small muted">{copy.logsCountLabel}: {logs.length}</p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.listTitle}</h2>
          <EmployeeNoticeBoardList
            copy={copy}
            notices={notices}
            filteredNotices={filteredNotices}
            readNoticeIds={readNoticeIds}
            readAtByNoticeId={readAtByNoticeId}
            pending={pending}
            runtimeLocale={runtimeLocale}
            onMarkAsRead={(noticeId) => void markAsRead(noticeId)}
          />
        </article>
      </section>
    </main>
  );
}

