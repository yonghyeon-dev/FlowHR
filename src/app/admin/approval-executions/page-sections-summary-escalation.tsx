"use client";

import { formatDateTime } from "@/app/admin/approval-executions/page-helpers";
import type { EscalationResultDto, ApprovalExecutionSummary } from "@/app/admin/approval-executions/page-types";
import {
  formatApprovalDomainLabel,
  formatApprovalEntityTypeLabel,
  formatNotificationChannelLabel
} from "@/lib/product-language";

type SummaryPanelProps = {
  isKoLocale: boolean;
  summary: ApprovalExecutionSummary;
  asOfIso: string;
  runtimeLocale: string;
  stalledHoursMin: string;
};

export function ApprovalExecutionSummaryPanel({
  isKoLocale,
  summary,
  asOfIso,
  runtimeLocale,
  stalledHoursMin
}: SummaryPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "실행 요약" : "Execution summary"}</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <p>{isKoLocale ? "전체" : "Total"}</p>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "진행 중" : "In progress"}</p>
          <strong>{summary.pendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "정체 항목" : "Stalled items"}</p>
          <strong>{summary.stalledCount}</strong>
        </div>
        <div className="summary-card">
          <p>
            {isKoLocale ? "주의 항목" : "Watch queue"} ({">="} {summary.watchThresholdHours}h)
          </p>
          <strong>{summary.watchCount}</strong>
        </div>
        <div className="summary-card">
          <p>
            {isKoLocale ? "긴급 항목" : "Critical queue"} ({">="} {summary.criticalThresholdHours}h)
          </p>
          <strong>{summary.criticalCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "최대 정체 시간" : "Max stalled hours"}</p>
          <strong>{summary.maxStalledHours.toFixed(1)}h</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "급여 진행 중" : "Payroll pending"}</p>
          <strong>{summary.payrollPendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "휴가 진행 중" : "Leave pending"}</p>
          <strong>{summary.leavePendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "근태 진행 중" : "Attendance pending"}</p>
          <strong>{summary.attendancePendingCount}</strong>
        </div>
      </div>
      <p className="small">
        {isKoLocale ? "기준 시각" : "As of"} {formatDateTime(asOfIso, runtimeLocale)} /{" "}
        {isKoLocale ? "정체 기준" : "Stall threshold"} {stalledHoursMin || "0"}
        {isKoLocale ? "시간" : "h"}
      </p>
      <p className="small">
        {isKoLocale
          ? `위험 집중: 긴급 ${summary.criticalCount}건 / 주의 ${summary.watchCount}건`
          : `Risk focus: critical ${summary.criticalCount} / watch ${summary.watchCount}`}
      </p>
    </article>
  );
}

type EscalationResultPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  escalationResult: EscalationResultDto | null;
};

export function ApprovalExecutionEscalationResultPanel({
  isKoLocale,
  runtimeLocale,
  escalationResult
}: EscalationResultPanelProps) {
  const locale = isKoLocale ? "ko-KR" : "en-US";

  return (
    <article className="panel">
      <h2>{isKoLocale ? "에스컬레이션 결과" : "Escalation result"}</h2>
      {!escalationResult ? (
        <p className="small">{isKoLocale ? "아직 에스컬레이션 실행 이력이 없습니다." : "No escalation run yet."}</p>
      ) : (
        <>
          <ul className="simple-list">
            <li>
              <span>{isKoLocale ? "요청 시각" : "Requested at"}</span>
              <strong>{formatDateTime(escalationResult.requestedAt, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "실행 방식" : "Run mode"}</span>
              <strong>{escalationResult.dryRun ? (isKoLocale ? "미리보기" : "Dry run") : isKoLocale ? "실행" : "Dispatch"}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "후보 / 요청됨" : "Candidates / requested"}</span>
              <strong>
                {escalationResult.counts.candidates} / {escalationResult.counts.requested}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "웹훅 연결" : "Webhook configured"}</span>
              <strong>
                {escalationResult.policy.webhookConfigured ? (isKoLocale ? "연결됨" : "Configured") : isKoLocale ? "미연결" : "Not configured"}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "알림 채널" : "Notification channel"}</span>
              <strong>{formatNotificationChannelLabel(escalationResult.policy.notificationChannel, locale)}</strong>
            </li>
          </ul>
          <p className="small">
            {isKoLocale ? "정체 기준" : "Threshold"} {escalationResult.policy.stalledHoursMin}h /{" "}
            {isKoLocale ? "처리 한도" : "Limit"} {escalationResult.policy.limit}
          </p>
          {escalationResult.items.length > 0 ? (
            <ul className="simple-list">
              {escalationResult.items.map((item) => (
                <li key={item.executionId}>
                  <span>
                    <strong>{formatApprovalDomainLabel(item.domain, locale)}</strong> ·{" "}
                    {formatApprovalEntityTypeLabel(item.targetEntityType, locale)}
                    <br />
                    <span className="small">
                      {isKoLocale ? "정체" : "Stalled"} {item.stalledHours.toFixed(1)}h /{" "}
                      {isKoLocale ? "단계" : "Stage"} {item.currentStageIndex}/{item.totalStages}
                    </span>
                  </span>
                  <span className={item.decision === "REQUESTED" ? "ok" : "muted"}>
                    {item.decision === "REQUESTED"
                      ? isKoLocale
                        ? "요청됨"
                        : "Requested"
                      : isKoLocale
                        ? "미리보기"
                        : "Dry run"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </article>
  );
}
