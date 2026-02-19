"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type PromotionTarget = {
  employeeId: string;
  name: string | null;
  email: string | null;
  remainingDays: number;
  grantedDays: number;
  usedDays: number;
  lastAccrualYear: number | null;
  eligibleNow: boolean;
};

type PromotionPreviewResponse = {
  organizationId: string;
  asOf: string;
  policy: {
    enabled: boolean;
    thresholdDays: number;
    leadDays: number;
    messageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    activeEmployeeCount: number;
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
    sentTargetCount?: number;
  };
  targets: PromotionTarget[];
  announcementDraft: {
    title: string;
    body: string;
  };
};

type PromotionNotifyResponse = PromotionPreviewResponse & {
  summary: PromotionPreviewResponse["summary"] & {
    sentTargetCount: number;
  };
  delivery: {
    status: "dry_run" | "skipped_no_targets" | "dispatched";
    attempted: boolean;
    dryRun: boolean;
    provider: "discord" | "slack" | null;
    webhookSource: string | null;
    webhookConfigured: boolean;
    dispatchedAt: string | null;
  };
};

type LeavePolicyResponse = {
  policy: {
    organizationId: string;
    annualGrantDays: number;
    carryOverCapDays: number;
    allowHalfDay: boolean;
    allowHourly: boolean;
    hourlyIncrementMinutes: number;
    maxHoursPerRequest: number;
    minNoticeDays: number;
    maxConsecutiveDays: number | null;
    annualLeavePromotionEnabled: boolean;
    annualLeavePromotionThresholdDays: number;
    annualLeavePromotionLeadDays: number;
    annualLeavePromotionMessageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
};

type PolicyBase = {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: number;
  minNoticeDays: number;
  maxConsecutiveDays: number | null;
};

type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function AdminLeavePromotionPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [asOfInput, setAsOfInput] = useState(() => toLocalInputValue(new Date()));
  const [includeUpcoming, setIncludeUpcoming] = useState(true);

  const [policyBase, setPolicyBase] = useState<PolicyBase | null>(null);
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [promotionThresholdDays, setPromotionThresholdDays] = useState("5");
  const [promotionLeadDays, setPromotionLeadDays] = useState("30");
  const [promotionMessageTemplate, setPromotionMessageTemplate] = useState("");

  const [preview, setPreview] = useState<PromotionPreviewResponse | null>(null);
  const [notifyResult, setNotifyResult] = useState<PromotionNotifyResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

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

  function applyPromotionPolicyFields(policy: LeavePolicyResponse["policy"]) {
    setPromotionEnabled(policy.annualLeavePromotionEnabled);
    setPromotionThresholdDays(String(policy.annualLeavePromotionThresholdDays));
    setPromotionLeadDays(String(policy.annualLeavePromotionLeadDays));
    setPromotionMessageTemplate(policy.annualLeavePromotionMessageTemplate);
  }

  async function callApi(
    label: string,
    method: "GET" | "PUT" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

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

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadPolicySettings() {
    if (!organizationId.trim()) {
      return;
    }
    const { response, body } = await callApi(
      "연차 정책 조회",
      "GET",
      `/api/leave/policy?organizationId=${encodeURIComponent(organizationId.trim())}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as LeavePolicyResponse;
    if (!parsed.policy) {
      return;
    }

    setPolicyBase({
      annualGrantDays: parsed.policy.annualGrantDays,
      carryOverCapDays: parsed.policy.carryOverCapDays,
      allowHalfDay: parsed.policy.allowHalfDay,
      allowHourly: parsed.policy.allowHourly,
      hourlyIncrementMinutes: parsed.policy.hourlyIncrementMinutes,
      maxHoursPerRequest: parsed.policy.maxHoursPerRequest,
      minNoticeDays: parsed.policy.minNoticeDays,
      maxConsecutiveDays: parsed.policy.maxConsecutiveDays
    });
    applyPromotionPolicyFields(parsed.policy);
  }

  async function savePolicySettings() {
    if (!organizationId.trim()) {
      return;
    }
    if (!policyBase) {
      await loadPolicySettings();
    }

    const base = policyBase;
    if (!base) {
      return;
    }

    const threshold = Number(promotionThresholdDays.trim());
    const leadDays = Number(promotionLeadDays.trim());
    if (!Number.isFinite(threshold) || threshold <= 0) {
      setStatusMessage("Threshold는 0보다 커야 합니다.");
      return;
    }
    if (!Number.isInteger(leadDays) || leadDays < 0) {
      setStatusMessage("Lead days는 0 이상의 정수여야 합니다.");
      return;
    }

    const payload = {
      organizationId: organizationId.trim(),
      annualGrantDays: base.annualGrantDays,
      carryOverCapDays: base.carryOverCapDays,
      allowHalfDay: base.allowHalfDay,
      allowHourly: base.allowHourly,
      hourlyIncrementMinutes: base.hourlyIncrementMinutes,
      maxHoursPerRequest: base.maxHoursPerRequest,
      minNoticeDays: base.minNoticeDays,
      maxConsecutiveDays: base.maxConsecutiveDays,
      annualLeavePromotionEnabled: promotionEnabled,
      annualLeavePromotionThresholdDays: threshold,
      annualLeavePromotionLeadDays: leadDays,
      annualLeavePromotionMessageTemplate:
        promotionMessageTemplate.trim().length > 0 ? promotionMessageTemplate.trim() : null
    };

    const { response } = await callApi("연차 촉진 정책 저장", "PUT", "/api/leave/policy", payload);
    if (!response.ok) {
      return;
    }
    setStatusMessage("연차 촉진 정책을 저장했습니다.");
    await loadPolicySettings();
    await loadPreview();
    setTimeout(() => setStatusMessage(""), 2500);
  }

  async function loadPreview() {
    if (!organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({
      organizationId: organizationId.trim(),
      includeUpcoming: includeUpcoming ? "true" : "false"
    });
    if (asOfInput.trim()) {
      query.set("asOf", toIso(asOfInput));
    }

    const { response, body } = await callApi(
      "연차 촉진 프리뷰 조회",
      "GET",
      `/api/leave/policy/promotion-preview?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as PromotionPreviewResponse;
    setPreview(parsed);
    setNotifyResult(null);
    setPromotionEnabled(parsed.policy.enabled);
    setPromotionThresholdDays(String(parsed.policy.thresholdDays));
    setPromotionLeadDays(String(parsed.policy.leadDays));
    setPromotionMessageTemplate(parsed.policy.messageTemplate);
  }

  async function sendNotice(dryRun: boolean) {
    if (!organizationId.trim()) {
      return;
    }
    const payload = {
      organizationId: organizationId.trim(),
      asOf: asOfInput.trim() ? toIso(asOfInput) : undefined,
      includeUpcoming,
      dryRun
    };

    const { response, body } = await callApi(
      dryRun ? "연차 촉진 공지 드라이런" : "연차 촉진 공지 발송",
      "POST",
      "/api/leave/policy/promotion-notify",
      payload
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as PromotionNotifyResponse;
    setNotifyResult(parsed);
    setPreview({
      organizationId: parsed.organizationId,
      asOf: parsed.asOf,
      policy: parsed.policy,
      noticeWindow: parsed.noticeWindow,
      summary: parsed.summary,
      targets: parsed.targets,
      announcementDraft: parsed.announcementDraft
    });

    if (parsed.delivery.status === "dispatched") {
      setStatusMessage(`공지 발송 완료: ${parsed.summary.sentTargetCount}명 (${parsed.delivery.provider ?? "unknown"})`);
    } else if (parsed.delivery.status === "skipped_no_targets") {
      setStatusMessage("대상자가 없어 발송을 건너뛰었습니다.");
    } else {
      setStatusMessage("드라이런 완료: 실제 발송 없이 결과만 검증했습니다.");
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  async function copyDraft() {
    if (!preview) {
      return;
    }
    const content = `${preview.announcementDraft.title}\n\n${preview.announcementDraft.body}`;
    try {
      await navigator.clipboard.writeText(content);
      setStatusMessage("공지 초안을 클립보드에 복사했습니다.");
      setTimeout(() => setStatusMessage(""), 2500);
    } catch {
      setStatusMessage("클립보드 복사에 실패했습니다.");
      setTimeout(() => setStatusMessage(""), 2500);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>연차 촉진 공지</h1>
        <p>
          연차 촉진 대상자를 사전에 미리 확인하고, 드라이런 검증 후 Discord/Slack 웹훅으로 공지를 발송합니다.
          {showDevTools ? " 개발 모드에서는 헤더 기반 Actor 컨텍스트를 사용할 수 있습니다." : ""}
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>컨텍스트</h2>
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
          <div className="input-grid">
            <label>
              기준 시각
              <input
                type="datetime-local"
                value={asOfInput}
                onChange={(event) => setAsOfInput(event.target.value)}
              />
            </label>
            <label>
              예정 대상 포함
              <select
                value={includeUpcoming ? "true" : "false"}
                onChange={(event) => setIncludeUpcoming(event.target.value === "true")}
              >
                <option value="true">포함</option>
                <option value="false">제외</option>
              </select>
            </label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void loadPolicySettings()} disabled={!organizationId.trim()}>
              정책 불러오기
            </button>
            <button className="btn btn-primary" onClick={() => void loadPreview()} disabled={!organizationId.trim()}>
              프리뷰 조회
            </button>
          </div>
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>촉진 정책</h2>
          <label>
            촉진 기능
            <select
              value={promotionEnabled ? "true" : "false"}
              onChange={(event) => setPromotionEnabled(event.target.value === "true")}
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
          <label>
            잔여일 임계값
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={promotionThresholdDays}
              onChange={(event) => setPromotionThresholdDays(event.target.value)}
            />
          </label>
          <label>
            사전 공지 lead days
            <input
              type="number"
              min={0}
              step={1}
              value={promotionLeadDays}
              onChange={(event) => setPromotionLeadDays(event.target.value)}
            />
          </label>
          <label>
            공지 템플릿
            <textarea
              rows={6}
              value={promotionMessageTemplate}
              onChange={(event) => setPromotionMessageTemplate(event.target.value)}
              placeholder="{year} placeholders are supported"
            />
          </label>
          <p className="small">
            placeholders: {"{organizationId}"}, {"{year}"}, {"{thresholdDays}"}, {"{targetCount}"},
            {" {potentialTargetCount}"}, {" {eligibleNowCount}"}, {" {noticeWindowStart}"}, {" {noticeWindowEnd}"}
          </p>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void savePolicySettings()} disabled={!organizationId.trim()}>
              촉진 정책 저장
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>프리뷰 요약</h2>
          {!preview ? (
            <p className="small">프리뷰를 먼저 조회해 주세요.</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>Policy source</span>
                <strong>{preview.policy.source}</strong>
              </li>
              <li>
                <span>촉진 기능</span>
                <strong>{preview.policy.enabled ? "활성" : "비활성"}</strong>
              </li>
              <li>
                <span>임계값</span>
                <strong>{formatDays(preview.policy.thresholdDays)}일 이상</strong>
              </li>
              <li>
                <span>lead days</span>
                <strong>{preview.policy.leadDays}일</strong>
              </li>
              <li>
                <span>공지 윈도우</span>
                <strong>
                  {formatDateTime(preview.noticeWindow.startAt)} ~ {formatDateTime(preview.noticeWindow.endAt)}
                </strong>
              </li>
              <li>
                <span>윈도우 상태</span>
                <strong>{preview.noticeWindow.isOpen ? "OPEN" : "CLOSED"}</strong>
              </li>
              <li>
                <span>표시 대상</span>
                <strong>{preview.summary.displayTargetCount}명</strong>
              </li>
              <li>
                <span>즉시 대상</span>
                <strong>{preview.summary.eligibleNowCount}명</strong>
              </li>
              <li>
                <span>발송 대상</span>
                <strong>{preview.summary.sentTargetCount ?? 0}명</strong>
              </li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>발송 결과</h2>
          {!notifyResult ? (
            <p className="small">아직 발송 실행 이력이 없습니다.</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>status</span>
                <strong>{notifyResult.delivery.status}</strong>
              </li>
              <li>
                <span>dryRun</span>
                <strong>{notifyResult.delivery.dryRun ? "yes" : "no"}</strong>
              </li>
              <li>
                <span>attempted</span>
                <strong>{notifyResult.delivery.attempted ? "yes" : "no"}</strong>
              </li>
              <li>
                <span>provider</span>
                <strong>{notifyResult.delivery.provider ?? "-"}</strong>
              </li>
              <li>
                <span>webhook source</span>
                <strong>{notifyResult.delivery.webhookSource ?? "-"}</strong>
              </li>
              <li>
                <span>webhook configured</span>
                <strong>{notifyResult.delivery.webhookConfigured ? "yes" : "no"}</strong>
              </li>
              <li>
                <span>dispatched at</span>
                <strong>{formatDateTime(notifyResult.delivery.dispatchedAt)}</strong>
              </li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>대상자 목록 {preview ? `(${preview.targets.length})` : ""}</h2>
          {!preview || preview.targets.length === 0 ? (
            <p className="small">조건에 맞는 대상자가 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {preview.targets.map((target) => (
                <li key={target.employeeId}>
                  <span>
                    <strong>{target.employeeId}</strong>
                    {" / "}
                    {target.name ?? "-"}
                    {target.email ? ` (${target.email})` : ""}
                    <br />
                    <span className="small">
                      잔여 {formatDays(target.remainingDays)}일 (부여 {formatDays(target.grantedDays)} / 사용 {formatDays(target.usedDays)})
                      {" / "}lastAccrualYear {target.lastAccrualYear ?? "-"}
                    </span>
                  </span>
                  <span className={target.eligibleNow ? "ok" : "muted"}>
                    {target.eligibleNow ? "즉시 공지" : "예정 대상"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>공지 초안</h2>
          {!preview ? (
            <p className="small">프리뷰 조회 후 초안을 확인할 수 있습니다.</p>
          ) : (
            <>
              <label>
                제목
                <input value={preview.announcementDraft.title} readOnly />
              </label>
              <label>
                본문
                <textarea value={preview.announcementDraft.body} readOnly rows={8} />
              </label>
              <p className="small">Template updated: {formatDateTime(preview.policy.updatedAt)}</p>
              <div className="panel-actions">
                <button className="btn btn-secondary" onClick={() => void copyDraft()}>
                  초안 복사
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => void sendNotice(true)}
                  disabled={!organizationId.trim() || pendingLabel !== null}
                >
                  드라이런 실행
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => void sendNotice(false)}
                  disabled={!organizationId.trim() || pendingLabel !== null}
                >
                  실제 발송
                </button>
              </div>
            </>
          )}
        </article>

        <article className="panel">
          <h2>요청 로그</h2>
          <p className="small">
            총 {stats.total}건 / 성공 {stats.success}건 / 실패 {stats.fail}건
            {pendingLabel ? ` / 진행중: ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">아직 API 호출 이력이 없습니다.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin#leave-policy" className="btn btn-secondary">
              휴가 정책 섹션으로
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
