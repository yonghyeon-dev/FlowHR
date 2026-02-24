"use client";

import { useMemo } from "react";

import { toDateText } from "@/components/contracts/copy";
import type { EmployeeContractDocument } from "@/components/contracts/types";

type EmployeeContractJourneyPanelProps = {
  selected: EmployeeContractDocument | null;
  isKoLocale: boolean;
  runtimeLocale: string;
};

export function EmployeeContractJourneyPanel({
  selected,
  isKoLocale,
  runtimeLocale
}: EmployeeContractJourneyPanelProps) {
  const contractJourneySteps = useMemo(() => {
    if (!selected) {
      return [];
    }

    const stepLabels = isKoLocale
      ? [
          { id: "draft", label: "초안 생성" },
          { id: "approval", label: "승인 단계" },
          { id: "sent", label: "직원 발송" },
          { id: "response", label: "직원 응답" }
        ]
      : [
          { id: "draft", label: "Draft created" },
          { id: "approval", label: "Approval step" },
          { id: "sent", label: "Sent to employee" },
          { id: "response", label: "Employee response" }
        ];

    const statusLevel = (() => {
      if (selected.status === "DRAFT") {
        return 1;
      }
      if (selected.status === "APPROVAL_REQUESTED") {
        return 2;
      }
      if (selected.status === "SENT") {
        return 3;
      }
      return 4;
    })();

    return stepLabels.map((step, index) => {
      const level = index + 1;
      const isRejected = selected.status === "REJECTED" && step.id === "response";
      const isExpired = selected.status === "EXPIRED" && (step.id === "sent" || step.id === "response");
      const tone =
        isRejected || isExpired
          ? "risk"
          : level < statusLevel
            ? "done"
            : level === statusLevel
              ? "active"
              : "pending";
      return {
        ...step,
        tone,
        detail:
          step.id === "response"
            ? selected.respondedAt
              ? toDateText(selected.respondedAt, runtimeLocale)
              : selected.status === "SIGNED"
                ? isKoLocale
                  ? "서명 처리 완료"
                  : "Signed"
                : selected.status === "REJECTED"
                  ? isKoLocale
                    ? "거절 처리됨"
                    : "Rejected by employee"
                  : "-"
            : step.id === "sent"
              ? toDateText(selected.updatedAt, runtimeLocale)
              : "-"
      };
    });
  }, [isKoLocale, runtimeLocale, selected]);

  const recoveryGuide = useMemo(() => {
    if (!selected) {
      return isKoLocale
        ? "문서를 선택하면 상태별 후속 가이드를 확인할 수 있습니다."
        : "Select a document to view recovery guidance.";
    }

    if (selected.status === "SIGNED") {
      return isKoLocale
        ? "서명이 완료되었습니다. 증빙 파일을 내려받아 보관하세요."
        : "Signature completed. Download and archive evidence.";
    }
    if (selected.status === "APPROVAL_REQUESTED") {
      return isKoLocale
        ? "관리자 승인 대기 중입니다. 급한 건이면 관리자 큐에서 우선 처리 요청하세요."
        : "Waiting for admin approval. Ask admins to prioritize if urgent.";
    }
    if (selected.status === "SENT") {
      return isKoLocale
        ? "내용 확인 후 서명 또는 거절 사유를 입력해 응답하세요."
        : "Review document and respond with sign or reject reason.";
    }
    if (selected.status === "REJECTED") {
      return isKoLocale
        ? "거절 사유를 확인한 뒤 수정 계약서를 요청하세요."
        : "Review rejection reason and request a revised contract.";
    }
    if (selected.status === "EXPIRED") {
      return isKoLocale
        ? "만료된 문서입니다. 갱신본 재발송을 요청하세요."
        : "Document is expired. Request a renewed copy.";
    }
    if (selected.status === "RENEWED") {
      return isKoLocale
        ? "갱신된 문서가 준비되었습니다. 최신 버전을 선택해 응답하세요."
        : "Renewed version is available. Select latest document to respond.";
    }

    return isKoLocale
      ? "승인/발송 상태를 확인한 뒤 다음 단계로 진행하세요."
      : "Check approval/send status before proceeding to next step.";
  }, [isKoLocale, selected]);

  return (
    <>
      <section className="contract-journey-panel">
        <h3>{isKoLocale ? "서명 여정 타임라인" : "Signature journey timeline"}</h3>
        <ul className="contract-journey-list">
          {contractJourneySteps.map((step) => (
            <li key={step.id} className={`tone-${step.tone}`}>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="contract-recovery-guide">
        <h3>{isKoLocale ? "복구 가이드" : "Recovery guide"}</h3>
        <p>{recoveryGuide}</p>
      </section>
    </>
  );
}
