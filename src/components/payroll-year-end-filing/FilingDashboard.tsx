"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { isAdminPayrollSource } from "@/app/admin/source-context";
import { buildFilingOpsStepHref, summarizeFilingWorkflowGates } from "@/components/payroll-year-end-filing/filing-workflow-helpers";
import { FILING_STEP_DEFINITIONS, type FilingWorkflowStep } from "@/components/payroll-year-end-filing/filing-types";
import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import { useFilingWorkflow } from "@/contexts/FilingWorkflowContext";
import { useI18n } from "@/lib/i18n/provider";

type FilingDashboardProps = {
  title?: string;
};

const filingStepLabels: Record<
  FilingWorkflowStep,
  {
    ko: string;
    en: string;
    descriptionKo: string;
    descriptionEn: string;
  }
> = {
  alert: {
    ko: "알림 대응",
    en: "Alert response",
    descriptionKo: "신고 경고와 담당자 우선순위를 먼저 정리합니다.",
    descriptionEn: "Triage filing alerts and owner priorities first."
  },
  checklist: {
    ko: "체크리스트",
    en: "Checklist",
    descriptionKo: "필수 선행 항목을 확인하고 미완료 항목을 줄입니다.",
    descriptionEn: "Review blockers and close mandatory checklist gaps."
  },
  review: {
    ko: "검토 인수인계",
    en: "Review handoff",
    descriptionKo: "검토 결과와 인수인계 메모를 같은 작업 흐름에서 정리합니다.",
    descriptionEn: "Capture review notes and handoff evidence in one flow."
  },
  "close-off": {
    ko: "마감 서명",
    en: "Close-off sign-off",
    descriptionKo: "마감 패키지와 승인 상태를 마지막으로 점검합니다.",
    descriptionEn: "Close the package and confirm sign-off readiness."
  },
  delivery: {
    ko: "전달 확인",
    en: "Delivery confirmation",
    descriptionKo: "전달 패키지와 수신 확인 상태를 같은 문맥에서 추적합니다.",
    descriptionEn: "Track delivery package and handover confirmation together."
  },
  archive: {
    ko: "보관 증빙",
    en: "Archive evidence",
    descriptionKo: "보관 자료와 예외 정리 상태를 검토합니다.",
    descriptionEn: "Review archive evidence and exception closure state."
  },
  report: {
    ko: "최종 보고",
    en: "Final report",
    descriptionKo: "최종 배포와 보고 상태를 마무리합니다.",
    descriptionEn: "Wrap up publication and final reporting status."
  }
};

export default function FilingDashboard({ title = "Filing Workflow Dashboard" }: FilingDashboardProps) {
  const workflow = useFilingWorkflow();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const showPayrollSource = isAdminPayrollSource(source);
  const gateSummary = summarizeFilingWorkflowGates(workflow.gates);
  const currentStepLabel = filingStepLabels[workflow.currentStep];
  const stationTitle = isKoLocale ? "신고 워크플로우 스테이션" : title;
  const stationDescription = isKoLocale
    ? "신고 후속 작업을 단계별로 이어서 처리하는 급여 레인 운영 보드입니다."
    : "A payroll-lane operating board for step-by-step filing follow-up.";

  return (
    <section className="panel workspace-section-card filing-workflow-station-card" id="filing-workflow-dashboard">
      <div className={styles.stationHero}>
        <div className={styles.stationCopy}>
          <p className="eyebrow">{showPayrollSource ? "payroll lane filing ops" : "filing ops"}</p>
          <h2>{stationTitle}</h2>
          <p className="small muted">{stationDescription}</p>
        </div>
        <div className={styles.stationSummary} aria-label={isKoLocale ? "신고 워크플로우 요약" : "Filing workflow summary"}>
          <div className={styles.stationSummaryCard}>
            <span>{isKoLocale ? "현재 단계" : "Current step"}</span>
            <strong>{isKoLocale ? currentStepLabel.ko : currentStepLabel.en}</strong>
          </div>
          <div className={styles.stationSummaryCard}>
            <span>{isKoLocale ? "준비 게이트" : "Ready gates"}</span>
            <strong>
              {gateSummary.ready}/{gateSummary.total}
            </strong>
          </div>
          <div className={styles.stationSummaryCard}>
            <span>{isKoLocale ? "경고 수준" : "Alert level"}</span>
            <strong>{workflow.metadata.level === "critical" ? (isKoLocale ? "주의" : "Critical") : isKoLocale ? "관찰" : "Watch"}</strong>
          </div>
        </div>
      </div>
      <p className="small workspace-source-banner">
        {showPayrollSource
          ? isKoLocale
            ? "급여 레인에서 이어진 신고 단계입니다. 단계 이동과 되돌아가기가 같은 급여 레인 문맥을 유지합니다."
            : "This filing step sequence stays attached to the payroll lane context."
          : isKoLocale
            ? "신고 단계를 단계별 운영 보드로 확인합니다."
            : "Review filing workflow steps in a dedicated operating board."}
      </p>

      <div className={styles.digestGrid} aria-label="filing workflow step cards">
        {FILING_STEP_DEFINITIONS.map((step) => (
          <div
            key={step.step}
            className={`${styles.digestRow} ${
              workflow.currentStep === step.step ? styles.digestRowActive : ""
            }`}
          >
            <div className={styles.digestHeader}>
              <p className="small">
                <strong>{isKoLocale ? filingStepLabels[step.step].ko : filingStepLabels[step.step].en}</strong>
              </p>
              <span className={styles.digestBadge}>
                {workflow.currentStep === step.step
                  ? isKoLocale
                    ? "현재"
                    : "Current"
                  : isKoLocale
                    ? "다음 단계"
                    : "Next"}
              </span>
            </div>
            <p className="small">
              {isKoLocale
                ? filingStepLabels[step.step].descriptionKo
                : filingStepLabels[step.step].descriptionEn}
            </p>
            <Link
              className="btn btn-secondary btn-small"
              href={buildFilingOpsStepHref({
                step: step.step,
                metadata: workflow.metadata,
                gates: workflow.gates,
                source
              })}
            >
              {workflow.currentStep === step.step
                ? isKoLocale
                  ? "현재 단계 보기"
                  : `Open ${step.title}`
                : isKoLocale
                  ? "이 단계 열기"
                  : `Open ${step.title}`}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
