"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NoticeItem, NoticeReadReceipt, NoticeStatus } from "@/features/notices/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { type AdminKpiFocusMetric } from "@/components/admin-kpi/AdminKpiSections";
import { resolveNoticeWorkspaceCopy } from "@/components/notices/copy";
import AdminNoticeWorkspaceView from "@/components/notices/AdminNoticeWorkspaceView";

type NoticeApiSummary = { total: number; draft: number; scheduled: number; published: number };
type NoticeApiLog = { id: number; action: string; status: number; ok: boolean; at: string };
type NoticeAudienceFilter = "all" | "employees" | "admins";
type DepartmentOption = { id: string; code: string; name: string; active: boolean };
const DEFAULT_SUMMARY: NoticeApiSummary = { total: 0, draft: 0, scheduled: 0, published: 0 };
const adminAnalyticsFocusMetricSet = new Set<AdminKpiFocusMetric>([
  "all",
  "pendingApprovals",
  "stalledApprovals",
  "attendanceApprovalRate",
  "leaveApprovedDays",
  "payrollConfirmedRate",
  "contractDecisionQueueCount",
  "contractSlaOverdueCount"
]);

function normalizeAnalyticsFocusMetric(value: string | null): AdminKpiFocusMetric | null {
  if (!value) {
    return null;
  }
  if (adminAnalyticsFocusMetricSet.has(value as AdminKpiFocusMetric)) {
    return value as AdminKpiFocusMetric;
  }
  return null;
}

function resolveAnalyticsBackHref(source: string | null, analyticsFocusMetric: AdminKpiFocusMetric | null) {
  if (source !== "admin-analytics") {
    return "";
  }
  if (!analyticsFocusMetric || analyticsFocusMetric === "all") {
    return "/admin/analytics";
  }
  return `/admin/analytics?focus=${encodeURIComponent(analyticsFocusMetric)}`;
}

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
  if (!Array.isArray(notices)) {
    return [];
  }
  return notices.map((notice) => ({
    ...notice,
    targetDepartmentIds: Array.isArray(notice.targetDepartmentIds) ? notice.targetDepartmentIds : []
  }));
}

function parseReadReceipts(payload: unknown) {
  const readReceipts = (payload as { readReceipts?: NoticeReadReceipt[] } | null)?.readReceipts;
  return Array.isArray(readReceipts) ? readReceipts : [];
}

function parseDepartments(payload: unknown) {
  const departments = (payload as { departments?: DepartmentOption[] } | null)?.departments;
  return Array.isArray(departments) ? departments : [];
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

function resolveNoticeAnalyticsFocusLabel(
  locale: "ko" | "en",
  focusMetric: string | null,
  status: string | null,
  risk: string | null
) {
  if (focusMetric === "noticeUnreadAging3dCount") {
    return locale === "ko" ? "3일 이상 미열람 공지" : "Unread notices over 3 days";
  }
  if (focusMetric === "noticeNoReadCount") {
    return locale === "ko" ? "미열람 공지" : "No-read notices";
  }
  if (focusMetric === "noticePublishedCount") {
    return locale === "ko" ? "게시 공지" : "Published notices";
  }
  if (risk === "no-read") {
    return locale === "ko" ? "미열람 공지" : "No-read notices";
  }
  if (status === "PUBLISHED") {
    return locale === "ko" ? "게시 공지" : "Published notices";
  }
  return "";
}

export default function AdminNoticeWorkspace() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const copy = resolveNoticeWorkspaceCopy(locale);
  const source = searchParams.get("source");
  const analyticsFocusMetric = normalizeAnalyticsFocusMetric(searchParams.get("analyticsFocus"));
  const analyticsFocusLabel = resolveNoticeAnalyticsFocusLabel(
    locale === "ko" ? "ko" : "en",
    searchParams.get("focusMetric"),
    searchParams.get("status"),
    searchParams.get("risk")
  );
  const sourceHint =
    source === "admin-dashboard"
      ? locale === "ko"
        ? "관리자 대시보드에서 이동했습니다."
        : "Opened from admin dashboard."
      : source === "admin-analytics"
        ? locale === "ko"
          ? `관리자 분석 대시보드에서 이동했습니다.${analyticsFocusLabel ? ` · 집중 큐: ${analyticsFocusLabel}` : ""}`
          : `Opened from admin analytics.${analyticsFocusLabel ? ` · Focus queue: ${analyticsFocusLabel}` : ""}`
      : "";
  const analyticsBackHref = resolveAnalyticsBackHref(source, analyticsFocusMetric);
  const analyticsBackLabel = locale === "ko" ? "분석으로 돌아가기" : "Back to analytics";
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
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [publishAt, setPublishAt] = useState("");
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [readRiskOnly, setReadRiskOnly] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  const [summary, setSummary] = useState<NoticeApiSummary>(DEFAULT_SUMMARY);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
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

  const loadDepartments = useCallback(async () => {
    if (!organizationId && !usesBearerToken) {
      return;
    }
    const query = buildQuery({ organizationId, active: "true" });
    const { response, parsed } = await callApi("Load departments", "GET", `/api/people/departments${query}`);
    if (!response.ok) {
      setDepartments([]);
      return;
    }
    setDepartments(parseDepartments(parsed));
  }, [callApi, organizationId, usesBearerToken]);

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
    void Promise.all([loadNotices(), loadDepartments()]);
  }, [autoLoadAttempted, loadDepartments, loadNotices, organizationId, usesBearerToken]);

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
      targetDepartmentIds: selectedDepartmentIds,
      ...(hasEditingTarget || publishIso !== null ? { publishAt: publishIso } : {})
    });
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setEditingNoticeId(null);
    setTitle("");
    setBody("");
    setAudience("all");
    setSelectedDepartmentIds([]);
    setPublishAt("");
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
    setSelectedDepartmentIds([...target.targetDepartmentIds]);
    setPublishAt(target.publishAt ? target.publishAt.slice(0, 16) : "");
    setStatusMessage(copy.messages.editing ?? "");
  }

  function cancelEditNotice() {
    setEditingNoticeId(null);
    setTitle("");
    setBody("");
    setAudience("all");
    setSelectedDepartmentIds([]);
    setPublishAt("");
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
      sourceHint={sourceHint}
      analyticsBackHref={analyticsBackHref}
      analyticsBackLabel={analyticsBackLabel}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionActorId={actorId}
      statusFilter={statusFilter}
      audienceFilter={audienceFilter}
      title={title}
      body={body}
      audience={audience}
      departments={departments}
      selectedDepartmentIds={selectedDepartmentIds}
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
      onToggleTargetDepartment={(departmentId) =>
        setSelectedDepartmentIds((previous) =>
          previous.includes(departmentId)
            ? previous.filter((item) => item !== departmentId)
            : [...previous, departmentId]
        )
      }
      onClearTargetDepartments={() => setSelectedDepartmentIds([])}
      onPublishAtChange={setPublishAt}
      onListSearchQueryChange={setListSearchQuery}
      onSetReadRiskOnly={setReadRiskOnly}
      onClearListSearch={() => setListSearchQuery("")}
      onLoadNotices={() => void Promise.all([loadNotices(), loadDepartments()])}
      onCreateNotice={() => void saveNotice()}
      onStartEditNotice={startEditNotice}
      onCancelEditNotice={cancelEditNotice}
      onPublishNow={(noticeId) => void publishNow(noticeId)}
      onDeleteNotice={(noticeId) => void deleteExistingNotice(noticeId)}
    />
  );
}
