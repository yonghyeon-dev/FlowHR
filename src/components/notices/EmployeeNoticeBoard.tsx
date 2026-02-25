"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NoticeItem, NoticeReadReceipt } from "@/features/notices/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveEmployeeNoticeBoardCopy, resolveNoticeAudienceLabel } from "@/components/notices/copy";

type NoticeBoardLog = {
  id: number;
  status: number;
  ok: boolean;
  at: string;
};

function parseNotices(payload: unknown) {
  const notices = (payload as { notices?: NoticeItem[] } | null)?.notices;
  return Array.isArray(notices) ? notices : [];
}

function parseReadNoticeIds(payload: unknown) {
  const ids = (payload as { readNoticeIds?: string[] } | null)?.readNoticeIds;
  return Array.isArray(ids) ? ids.filter((value) => typeof value === "string") : [];
}

function parseReadReceipts(payload: unknown) {
  const receipts = (payload as { readReceipts?: NoticeReadReceipt[] } | null)?.readReceipts;
  return Array.isArray(receipts) ? receipts : [];
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
  const readAtByNoticeId = useMemo(() => {
    const map = new Map<string, string>();
    readReceipts.forEach((receipt) => {
      map.set(receipt.noticeId, receipt.readAt);
    });
    return map;
  }, [readReceipts]);

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

      const query = buildQuery({
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
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadNotices()} disabled={pending}>
              {copy.refreshAction}
            </button>
          </div>
          <p className="small muted">
            {copy.summaryLabel}: {publishedCount} · {copy.unreadLabel}: {unreadCount}
          </p>
          <p className="small muted">logs: {logs.length}</p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.listTitle}</h2>
          {notices.length === 0 ? (
            <p className="small muted">{copy.listEmpty}</p>
          ) : (
            <ul className="simple-list">
              {notices.map((notice) => {
                const isRead = readNoticeIds.includes(notice.id);
                const readAt = readAtByNoticeId.get(notice.id) ?? null;
                return (
                  <li key={notice.id}>
                    <span>
                      <strong>{notice.title}</strong>
                      <br />
                      <span className="small muted">{notice.body}</span>
                      <br />
                      <span className="small muted">
                        {copy.audienceLabel}: {resolveNoticeAudienceLabel(copy, notice.audience)} · {notice.publishedAt ?? notice.updatedAt}
                      </span>
                      <br />
                      <span className="small muted">
                        {isRead ? copy.readBadge : copy.unreadBadge}
                        {readAt ? ` · ${copy.readAtLabel}: ${new Date(readAt).toLocaleString(runtimeLocale)}` : ""}
                      </span>
                    </span>
                    {isRead ? null : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={pending}
                        onClick={() => void markAsRead(notice.id)}
                      >
                        {copy.markReadAction}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

