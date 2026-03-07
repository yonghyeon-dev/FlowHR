"use client";

import { useCallback, useEffect, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type AuditLogItem = {
  action: string;
  entityType: string;
  entityId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: string;
};

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return iso;
  }
}

function formatPayload(payload: unknown) {
  if (!payload) return "-";
  try {
    const str = JSON.stringify(payload);
    return str.length > 80 ? `${str.slice(0, 80)}...` : str;
  } catch {
    return "-";
  }
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
        const fromDate = new Date(from + "T00:00:00+09:00").toISOString();
        const toDate = new Date(to + "T23:59:59+09:00").toISOString();
        let path = `/api/admin/audit-logs?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&limit=${limit}&offset=${pageOffset}`;
        if (entityType.trim()) {
          path += `&entityType=${encodeURIComponent(entityType.trim())}`;
        }

        const result = await performAdminApiCall({
          label: "감사로그 조회",
          method: "GET",
          path,
          runtimeLocale: "ko-KR"
        });

        if (!result.response.ok) {
          throw new Error("감사로그를 불러오지 못했습니다.");
        }

        const body = result.body as { items?: AuditLogItem[]; total?: number };
        setItems(body?.items ?? []);
        setTotal(body?.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    },
    [from, to, entityType]
  );

  useEffect(() => {
    if (!sessionLoading) {
      void loadLogs(0);
    }
  }, [sessionLoading, loadLogs]);

  const handleSearch = () => {
    setOffset(0);
    void loadLogs(0);
  };

  const handleExportCsv = async () => {
    const fromDate = new Date(from + "T00:00:00+09:00").toISOString();
    const toDate = new Date(to + "T23:59:59+09:00").toISOString();
    let path = `/api/admin/audit-logs/export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    if (entityType.trim()) {
      path += `&entityType=${encodeURIComponent(entityType.trim())}`;
    }

    try {
      const result = await performAdminApiCall({
        label: "감사로그 CSV 내보내기",
        method: "GET",
        path,
        runtimeLocale: "ko-KR"
      });
      if (result.response.ok) {
        const text = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${from}-${to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* export is best-effort */
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

  if (sessionLoading) return null;

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">감사로그</h1>
          <p className="page-subtitle">조직 내 모든 변경 이력을 조회합니다.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void handleExportCsv()}>
            CSV 내보내기
          </button>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}

      <section className="panel">
        <div className="input-grid" style={{ marginBottom: "1rem" }}>
          <label>
            시작일
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            종료일
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            엔티티 유형
            <input
              type="text"
              placeholder="예: employee, leave_request"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" type="button" onClick={handleSearch}>
              조회
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="small muted">불러오는 중...</p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>엔티티 유형</th>
                  <th>엔티티 ID</th>
                  <th>액션</th>
                  <th>수행자</th>
                  <th>변경 내용</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                      감사로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={`${item.createdAt}-${i}`}>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{item.entityType}</td>
                      <td>{item.entityId ?? "-"}</td>
                      <td>{item.action}</td>
                      <td>{item.actorId ?? "-"}</td>
                      <td title={JSON.stringify(item.payload)}>{formatPayload(item.payload)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <p className="small muted">
                {offset + 1}~{Math.min(offset + limit, total)} / 총 {total}건
              </p>
              <div>
                <button className="btn btn-secondary" type="button" onClick={handlePrev} disabled={offset === 0}>
                  이전
                </button>{" "}
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleNext}
                  disabled={offset + limit >= total}
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
