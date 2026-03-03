"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NoticeItem, NoticeReadReceipt, NoticeStatus } from "@/features/notices/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { resolveNoticeWorkspaceCopy } from "@/components/notices/copy";
import AdminNoticeWorkspaceView from "@/components/notices/AdminNoticeWorkspaceView";

type NoticeApiSummary = { total: number; draft: number; scheduled: number; published: number };
type NoticeApiLog = { id: number; action: string; status: number; ok: boolean; at: string };
type NoticeAudienceFilter = "all" | "employees" | "admins";
const DEFAULT_SUMMARY: NoticeApiSummary = { total: 0, draft: 0, scheduled: 0, published: 0 };

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

function parseReadReceipts(payload: unknown) {
  const readReceipts = (payload as { readReceipts?: NoticeReadReceipt[] } | null)?.readReceipts;
  return Array.isArray(readReceipts) ? readReceipts : [];
}

function toDateTimeLocalValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function buildQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value.trim()) {
      query.set(key, value.trim());
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isReadCoverageRisk(notice: NoticeItem, readCountByNoticeId: Map<string, number>) {
  return notice.status === "PUBLISHED" && (readCountByNoticeId.get(notice.id) ?? 0) === 0;
}

function normalizeNoticeStatusFilter(value: string | null): NoticeStatus | "all" {
  if (value === "DRAFT" || value === "SCHEDULED" || value === "PUBLISHED") {
    return value;
  }
  return "all";
}

function normalizeNoticeAudienceFilter(value: string | null): NoticeAudienceFilter {
  if (value === "employees" || value === "admins") {
    return value;
  }
  return "all";
}

function parseNoticeReadRiskFilter(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "no-read" || normalized === "aging-3d";
}

function parseNoticeSearchKeyword(value: string | null) {
  return (value ?? "").trim();
}

export default function AdminNoticeWorkspace() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const copy = resolveNoticeWorkspaceCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const actorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";

  const [statusFilter, setStatusFilter] = useState<NoticeStatus | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<NoticeAudienceFilter>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "employees" | "admins">("all");
  const [publishAt, setPublishAt] = useState(toDateTimeLocalValue());
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [readRiskOnly, setReadRiskOnly] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  const [summary, setSummary] = useState<NoticeApiSummary>(DEFAULT_SUMMARY);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [readReceipts, setReadReceipts] = useState<NoticeReadReceipt[]>([]);
  const [logs, setLogs] = useState<NoticeApiLog[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => ({ total: logs.length, success: logs.filter((log) => log.ok).length }), [logs]);
  const readCountByNoticeId = useMemo(() => {
    const map = new Map<string, number>();
    readReceipts.forEach((receipt) => map.set(receipt.noticeId, (map.get(receipt.noticeId) ?? 0) + 1));
    return map;
  }, [readReceipts]);
  const filteredNotices = useMemo(() => {
    const query = listSearchQuery.trim().toLowerCase();
    return notices.filter((notice) => {
      if (readRiskOnly && !isReadCoverageRisk(notice, readCountByNoticeId)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = `${notice.title} ${notice.body}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [listSearchQuery, notices, readCountByNoticeId, readRiskOnly]);

  const noticeReadCountByNoticeId = useMemo(() => {
    const map = new Map<string, number>();
    notices.forEach((notice) => map.set(notice.id, readCountByNoticeId.get(notice.id) ?? 0));
    return map;
  }, [notices, readCountByNoticeId]);
  const readRiskNoticeCount = useMemo(
    () => notices.filter((notice) => isReadCoverageRisk(notice, readCountByNoticeId)).length,
    [notices, readCountByNoticeId]
  );

  const appendLog = useCallback((action: string, status: number, ok: boolean) => {
    setLogs((previous) => [{ id: Date.now(), action, status, ok, at: new Date().toLocaleString(runtimeLocale) }, ...previous]);
  }, [runtimeLocale]);

  const callApi = useCallback(async (
    action: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    payload?: Record<string, unknown>
  ) => {
    setPendingLabel(action);
    try {
      const headers: Record<string, string> = payload ? { "content-type": "application/json" } : {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = actorId;
        headers["x-actor-organization-id"] = organizationId;
      }
      const response = await fetch(path, { method, headers, body: payload ? JSON.stringify(payload) : undefined });
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
  }, [actorId, appendLog, bearerToken, organizationId, usesBearerToken]);

  const loadNotices = useCallback(async () => {
    if (!organizationId && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    const query = buildQuery({ organizationId, status: statusFilter, audience: audienceFilter });
    const { response, parsed } = await callApi(copy.refreshAction, "GET", `/api/notices${query}`);
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }
    setNotices(parseNotices(parsed));
    setSummary(parseSummary(parsed));
    setReadReceipts(parseReadReceipts(parsed));
    setStatusMessage(`${copy.statusMessagePrefix}: ${copy.refreshAction}`);
  }, [
    audienceFilter,
    callApi,
    copy.messages.loadFailed,
    copy.messages.needOrganization,
    copy.refreshAction,
    copy.statusMessagePrefix,
    organizationId,
    statusFilter,
    usesBearerToken
  ]);

  useEffect(() => {
    setStatusFilter(normalizeNoticeStatusFilter(searchParams.get("status")));
    setAudienceFilter(normalizeNoticeAudienceFilter(searchParams.get("audience")));
    setListSearchQuery(parseNoticeSearchKeyword(searchParams.get("q")));
    setReadRiskOnly(parseNoticeReadRiskFilter(searchParams.get("risk")));
  }, [searchParams]);

  useEffect(() => {
    if (autoLoadAttempted || (!organizationId && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadNotices();
  }, [autoLoadAttempted, loadNotices, organizationId, usesBearerToken]);

  async function saveNotice() {
    if (!organizationId && !usesBearerToken) {
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

    const publishIso = publishAt.trim() ? new Date(publishAt).toISOString() : null;
    const hasEditingTarget = Boolean(editingNoticeId);
    const actionLabel = hasEditingTarget ? copy.updateAction ?? copy.createAction : copy.createAction;
    const method = hasEditingTarget ? "PATCH" : "POST";
    const path = hasEditingTarget ? `/api/notices/${encodeURIComponent(editingNoticeId ?? "")}` : "/api/notices";

    const { response } = await callApi(actionLabel, method, path, {
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

    setEditingNoticeId(null);
    setTitle("");
    setBody("");
    setAudience("all");
    setPublishAt(toDateTimeLocalValue());
    setStatusMessage(hasEditingTarget ? copy.messages.updated ?? copy.messages.created : copy.messages.created);
    await loadNotices();
  }

  function startEditNotice(noticeId: string) {
    const target = notices.find((notice) => notice.id === noticeId);
    if (!target || target.status === "PUBLISHED") {
      return;
    }
    setEditingNoticeId(target.id);
    setTitle(target.title);
    setBody(target.body);
    setAudience(target.audience);
    setPublishAt(target.publishAt ? target.publishAt.slice(0, 16) : "");
    setStatusMessage(copy.messages.editing ?? "");
  }

  function cancelEditNotice() {
    setEditingNoticeId(null);
    setTitle("");
    setBody("");
    setAudience("all");
    setPublishAt(toDateTimeLocalValue());
    setStatusMessage("");
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

  async function deleteExistingNotice(noticeId: string) {
    const actionLabel = copy.deleteAction ?? "Delete";
    const { response, parsed } = await callApi(actionLabel, "DELETE", `/api/notices/${encodeURIComponent(noticeId)}`);
    if (!response.ok) {
      const errorCode =
        typeof (parsed as { error?: unknown } | null)?.error === "string"
          ? ((parsed as { error: string }).error ?? "")
          : "";
      if (errorCode === "notice.delete.published_locked") {
        setStatusMessage(copy.messages.deletePublishedLocked ?? copy.messages.deleteFailed ?? copy.messages.loadFailed);
      } else {
        setStatusMessage(copy.messages.deleteFailed ?? copy.messages.loadFailed);
      }
      return;
    }

    if (editingNoticeId === noticeId) {
      cancelEditNotice();
    }
    setStatusMessage(copy.messages.deleted ?? actionLabel);
    await loadNotices();
  }

  return (
    <AdminNoticeWorkspaceView
      copy={copy}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionActorId={actorId}
      statusFilter={statusFilter}
      audienceFilter={audienceFilter}
      title={title}
      body={body}
      audience={audience}
      publishAt={publishAt}
      editingNoticeId={editingNoticeId}
      summary={summary}
      notices={notices}
      filteredNotices={filteredNotices}
      listSearchQuery={listSearchQuery}
      readRiskOnly={readRiskOnly}
      readRiskNoticeCount={readRiskNoticeCount}
      readCountByNoticeId={noticeReadCountByNoticeId}
      readCountLabel={copy.readCountLabel}
      logs={logs}
      stats={stats}
      pendingLabel={pendingLabel}
      statusMessage={statusMessage}
      onStatusFilterChange={setStatusFilter}
      onAudienceFilterChange={setAudienceFilter}
      onTitleChange={setTitle}
      onBodyChange={setBody}
      onAudienceChange={setAudience}
      onPublishAtChange={setPublishAt}
      onListSearchQueryChange={setListSearchQuery}
      onSetReadRiskOnly={setReadRiskOnly}
      onClearListSearch={() => setListSearchQuery("")}
      onLoadNotices={() => void loadNotices()}
      onCreateNotice={() => void saveNotice()}
      onStartEditNotice={startEditNotice}
      onCancelEditNotice={cancelEditNotice}
      onPublishNow={(noticeId) => void publishNow(noticeId)}
      onDeleteNotice={(noticeId) => void deleteExistingNotice(noticeId)}
    />
  );
}
