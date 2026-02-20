"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
type ApprovalStageResolution =
  | "EXPECTED_ROLE"
  | "ACTIVE_DELEGATION"
  | "PRIVILEGED_BYPASS"
  | "DENIED";

type ApprovalStageHistoryDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex: number;
  stageLabel: string;
  requiredRoles: string[];
  fallbackRole: string;
  matchedTemplateIds: string[];
  activeDelegationIds: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  payrollGrossPayKrw: number | null;
  evaluatedAt: string;
};

type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

const domainOptions: Array<ApprovalDomain | ""> = ["", "ATTENDANCE", "LEAVE", "PAYROLL"];
const resolutionOptions: Array<ApprovalStageResolution | ""> = [
  "",
  "EXPECTED_ROLE",
  "ACTIVE_DELEGATION",
  "PRIVILEGED_BYPASS",
  "DENIED"
];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

export default function AdminApprovalHistoryPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [targetEntityType, setTargetEntityType] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [allowed, setAllowed] = useState<"" | "true" | "false">("");
  const [resolution, setResolution] = useState<ApprovalStageResolution | "">("");
  const [limit, setLimit] = useState("100");

  const [history, setHistory] = useState<ApprovalStageHistoryDto[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  async function callApi(label: string, path: string) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, { method: "GET", headers });
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: response.ok,
          status: response.status,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadHistory() {
    if (!organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({
      organizationId: organizationId.trim()
    });
    if (domain) {
      query.set("domain", domain);
    }
    if (targetEntityType.trim()) {
      query.set("targetEntityType", targetEntityType.trim());
    }
    if (targetEntityId.trim()) {
      query.set("targetEntityId", targetEntityId.trim());
    }
    if (allowed) {
      query.set("allowed", allowed);
    }
    if (resolution) {
      query.set("resolution", resolution);
    }
    if (limit.trim()) {
      query.set("limit", limit.trim());
    }

    const { response, body } = await callApi(
      "寃곗옱 ?④퀎 ?대젰 議고쉶",
      `/api/approval/stage-history?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { history?: ApprovalStageHistoryDto[] };
    setHistory(parsed.history ?? []);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>寃곗옱 ?④퀎 ?대젰</h1>
        <p>
          ?뱀씤 寃뚯씠???됯? 寃곌낵(?덉슜/李⑤떒, ?쒗뵆由?留ㅼ묶, ?꾩엫 ?곸슜)瑜?議고쉶?⑸땲??
          {showDevTools ? " 媛쒕컻 紐⑤뱶?먯꽌???ㅻ뜑 湲곕컲 Actor 而⑦뀓?ㅽ듃瑜??ъ슜?⑸땲??" : ""}
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>而⑦뀓?ㅽ듃/?꾪꽣</h2>
          <label>
            Organization ID
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            Admin Actor ID (Dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Access Token (optional)
            <input
              placeholder="Bearer token"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
          <label>
            Domain
            <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain | "")}>
              {domainOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "ALL"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target Entity Type
            <input
              value={targetEntityType}
              onChange={(event) => setTargetEntityType(event.target.value)}
              placeholder="AttendanceRecord / LeaveRequest / PayrollRun"
            />
          </label>
          <label>
            Target Entity ID
            <input value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)} />
          </label>
          <label>
            Allowed
            <select value={allowed} onChange={(event) => setAllowed(event.target.value as "" | "true" | "false")}>
              <option value="">ALL</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <label>
            Resolution
            <select
              value={resolution}
              onChange={(event) => setResolution(event.target.value as ApprovalStageResolution | "")}
            >
              {resolutionOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "ALL"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Limit
            <input type="number" min={1} max={500} value={limit} onChange={(event) => setLimit(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void loadHistory()} disabled={!organizationId.trim()}>
              ?대젰 議고쉶
            </button>
          </div>
          {supabaseSessionError ? <p className="small fail">Session ?ㅻ쪟: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>議고쉶 寃곌낵 ({history.length})</h2>
          {history.length === 0 ? (
            <p className="small">議고쉶???대젰???놁뒿?덈떎.</p>
          ) : (
            <ul className="simple-list">
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.domain}</strong> / {entry.targetEntityType}:{entry.targetEntityId}
                  <br />
                  <span className={entry.allowed ? "ok" : "fail"}>
                    {entry.allowed ? "?덉슜" : "李⑤떒"} ({entry.resolution})
                  </span>
                  {" 쨌 "}required [{entry.requiredRoles.join(", ")}] / fallback {entry.fallbackRole}
                  <br />
                  actor {entry.actorRole}
                  {entry.actorId ? ` (${entry.actorId})` : ""} / stage {entry.stageIndex}({entry.stageLabel})
                  {entry.payrollGrossPayKrw !== null
                    ? ` / gross ${entry.payrollGrossPayKrw.toLocaleString("ko-KR")} KRW`
                    : ""}
                  <br />
                  {entry.matchedTemplateIds.length > 0
                    ? `matched templates: ${entry.matchedTemplateIds.join(", ")}`
                    : "matched templates: -"}
                  {" / "}
                  {entry.activeDelegationIds.length > 0
                    ? `delegations: ${entry.activeDelegationIds.join(", ")}`
                    : "delegations: -"}
                  <br />
                  <span className="small">evaluated {formatDateTime(entry.evaluatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>?붿껌 濡쒓렇</h2>
          <p className="small">
            珥?{stats.total}嫄?쨌 ?깃났 {stats.success}嫄?쨌 ?ㅽ뙣 {stats.fail}嫄?            {pendingLabel ? ` 쨌 吏꾪뻾以?${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">?꾩쭅 API ?몄텧 ?대젰???놁뒿?덈떎.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} 쨌{" "}
                  {log.status} 쨌 {log.at}
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin/approval-executions" className="btn btn-secondary">
              결재 실행 현황
            </Link>
            <Link href="/admin/approval-templates" className="btn btn-secondary">
              寃곗옱???쒗뵆由우쑝濡?            </Link>
            <Link href="/admin" className="btn btn-secondary">
              愿由ъ옄 ?덉쑝濡?            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

