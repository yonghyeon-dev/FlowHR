"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatActorRoleLabel,
  formatApprovalEntityTypeLabel,
  formatAuditActionLabel,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

type AuditLogItem = {
  action: string;
  entityType: string;
  entityId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: string;
};

type AuditLogsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  sourceHint: string;
  backToHubLabel: string;
  exportLabel: string;
  searchLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  startDateLabel: string;
  endDateLabel: string;
  entityTypeLabel: string;
  entityTypePlaceholder: string;
  summaryTotalLabel: string;
  summaryVisibleLabel: string;
  summaryRangeLabel: string;
  tableHeaders: string[];
  previousLabel: string;
  nextLabel: string;
  noPayloadLabel: string;
  changedPayloadLabel: string;
  payloadNameLabel: string;
  payloadEmailLabel: string;
};

function getCopy(locale: string): AuditLogsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "감사 로그",
      pageSubtitle: "조직 내 주요 변경과 승인, 정책 조정 이력을 검색하고 내보냅니다.",
      sourceHint: "감사 로그는 운영 이슈 검토와 권한 변경 확인 흐름에 바로 연결됩니다.",
      backToHubLabel: "관리자 허브",
      exportLabel: "CSV 내보내기",
      searchLabel: "조회",
      loadingLabel: "불러오는 중...",
      emptyLabel: "감사 로그가 없습니다.",
      startDateLabel: "시작일",
      endDateLabel: "종료일",
      entityTypeLabel: "대상 유형",
      entityTypePlaceholder: "직원, 휴가 요청, 근태 정정",
      summaryTotalLabel: "전체 로그",
      summaryVisibleLabel: "현재 페이지",
      summaryRangeLabel: "조회 범위",
      tableHeaders: ["시간", "대상", "활동 내역", "수행 주체", "변경 요약"],
      previousLabel: "이전",
      nextLabel: "다음",
      noPayloadLabel: "-",
      changedPayloadLabel: "변경 전후 정보",
      payloadNameLabel: "이름",
      payloadEmailLabel: "이메일"
    };
  }

  return {
    pageTitle: "Audit Logs",
    pageSubtitle: "Search and export major organization changes, approvals, and policy adjustments.",
    sourceHint: "Audit logs support operational review and permission-change verification flows.",
    backToHubLabel: "Admin hub",
    exportLabel: "Export CSV",
    searchLabel: "Search",
    loadingLabel: "Loading...",
    emptyLabel: "No audit logs found.",
    startDateLabel: "Start date",
    endDateLabel: "End date",
    entityTypeLabel: "Entity type",
    entityTypePlaceholder: "Employee, leave request, attendance correction",
    summaryTotalLabel: "Total logs",
    summaryVisibleLabel: "Current page",
    summaryRangeLabel: "Query range",
    tableHeaders: ["Time", "Entity", "Action", "Actor", "Summary"],
    previousLabel: "Previous",
    nextLabel: "Next",
    noPayloadLabel: "-",
    changedPayloadLabel: "Before/after payload",
    payloadNameLabel: "Name",
    payloadEmailLabel: "Email"
  };
}

function formatDateTime(iso: string, runtimeLocale: string) {
  try {
    return new Date(iso).toLocaleString(runtimeLocale);
  } catch {
    return iso;
  }
}

function formatPayloadSummary(payload: unknown, copy: AuditLogsCopy) {
  if (!payload || typeof payload !== "object") {
    return copy.noPayloadLabel;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.name === "string" && record.name.trim()) {
    return `${copy.payloadNameLabel}: ${record.name.trim()}`;
  }

  if (typeof record.email === "string" && record.email.trim()) {
    return `${copy.payloadEmailLabel}: ${record.email.trim()}`;
  }

  if (record.before && record.after) {
    return copy.changedPayloadLabel;
  }

  const keys = Object.keys(record);
  if (keys.length === 0) {
    return copy.noPayloadLabel;
  }

  return `${copy.changedPayloadLabel} ${keys.length}`;
}

function todayRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

export default function AdminAuditLogsPage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const range = todayRange();
  const [from, setFrom] = useState(range.from.slice(0, 10));
  const [to, setTo] = useState(range.to.slice(0, 10));
  const [entityType, setEntityType] = useState("");

  const loadLogs = useCallback(
    async (pageOffset: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const fromDate = new Date(`${from}T00:00:00+09:00`).toISOString();
        const toDate = new Date(`${to}T23:59:59+09:00`).toISOString();
        let path = `/api/admin/audit-logs?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&limit=${limit}&offset=${pageOffset}`;
        if (entityType.trim()) {
          path += `&entityType=${encodeURIComponent(entityType.trim())}`;
        }

        const result = await performAdminApiCall({
          label: "Load audit logs",
          method: "GET",
          path,
          runtimeLocale
        });

        if (!result.response.ok) {
          throw new Error(locale === "ko" ? "감사 로그를 불러오지 못했습니다." : "Failed to load audit logs.");
        }

        const body = result.body as { items?: AuditLogItem[]; total?: number };
        setItems(body?.items ?? []);
        setTotal(body?.total ?? 0);
      } catch (err) {
        setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), runtimeLocale));
      } finally {
        setIsLoading(false);
      }
    },
    [entityType, from, locale, runtimeLocale, to]
  );

  useEffect(() => {
    if (!sessionLoading) {
      void loadLogs(0);
    }
  }, [loadLogs, sessionLoading]);

  const handleSearch = () => {
    setOffset(0);
    void loadLogs(0);
  };

  const handleExportCsv = async () => {
    const fromDate = new Date(`${from}T00:00:00+09:00`).toISOString();
    const toDate = new Date(`${to}T23:59:59+09:00`).toISOString();
    let path = `/api/admin/audit-logs/export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    if (entityType.trim()) {
      path += `&entityType=${encodeURIComponent(entityType.trim())}`;
    }

    try {
      const result = await performAdminApiCall({
        label: "Export audit logs csv",
        method: "GET",
        path,
        runtimeLocale
      });
      if (result.response.ok) {
        const text = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `audit-logs-${from}-${to}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // best-effort export
    }
  };

  const handlePrev = () => {
    const newOffset = Math.max(0, offset - limit);
    setOffset(newOffset);
    void loadLogs(newOffset);
  };

  const handleNext = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    void loadLogs(newOffset);
  };

  if (sessionLoading) {
    return null;
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {copy.backToHubLabel}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void handleExportCsv()}>
            {copy.exportLabel}
          </button>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryTotalLabel}</p>
          <strong>{total}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryVisibleLabel}</p>
          <strong>{items.length}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryRangeLabel}</p>
          <strong>{from} ~ {to}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.pageTitle}</h2>
              <p className="small muted">{copy.pageSubtitle}</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="stack gap-8">
              <span>{copy.startDateLabel}</span>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="stack gap-8">
              <span>{copy.endDateLabel}</span>
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label className="stack gap-8">
              <span>{copy.entityTypeLabel}</span>
              <input
                type="text"
                placeholder={copy.entityTypePlaceholder}
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
              />
            </label>
          </div>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={handleSearch}>
              {copy.searchLabel}
            </button>
          </div>
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{copy.summaryVisibleLabel}</h2>
              <p className="small muted">{copy.sourceHint}</p>
            </div>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>{copy.summaryTotalLabel}</dt>
              <dd>{total}</dd>
            </div>
            <div>
              <dt>{copy.summaryVisibleLabel}</dt>
              <dd>{items.length}</dd>
            </div>
            <div>
              <dt>{copy.summaryRangeLabel}</dt>
              <dd>{from} ~ {to}</dd>
            </div>
          </dl>
        </article>

        <article className="panel workspace-section-card">
          <div className="section-heading">
            <div>
              <h2>{copy.pageTitle}</h2>
              <p className="small muted">{isLoading ? copy.loadingLabel : copy.pageSubtitle}</p>
            </div>
          </div>

          {isLoading ? (
            <p className="small muted">{copy.loadingLabel}</p>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    {copy.tableHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={copy.tableHeaders.length} className="muted" style={{ textAlign: "center" }}>
                        {copy.emptyLabel}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={`${item.createdAt}-${index}`}>
                        <td>{formatDateTime(item.createdAt, runtimeLocale)}</td>
                        <td>{formatApprovalEntityTypeLabel(item.entityType, runtimeLocale)}</td>
                        <td>{formatAuditActionLabel(item.action, runtimeLocale)}</td>
                        <td>{formatActorRoleLabel(item.actorRole, runtimeLocale)}</td>
                        <td>{formatPayloadSummary(item.payload, copy)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.75rem" }}>
                <p className="small muted">
                  {total === 0 ? 0 : offset + 1}~{Math.min(offset + limit, total)} / {total}
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary" type="button" onClick={handlePrev} disabled={offset === 0}>
                    {copy.previousLabel}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={handleNext}
                    disabled={offset + limit >= total}
                  >
                    {copy.nextLabel}
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
