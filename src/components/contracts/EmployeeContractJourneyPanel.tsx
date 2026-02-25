"use client";

import { useMemo } from "react";

import { toDateText } from "@/components/contracts/copy";
import { contractJourneyCopyByLocale } from "@/components/contracts/journey-copy";
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
  const locale = isKoLocale ? "ko" : "en";
  const copy = contractJourneyCopyByLocale[locale];

  const contractJourneySteps = useMemo(() => {
    if (!selected) {
      return [];
    }

    const stepLabels = [
      { id: "draft", label: copy.stepLabels.draft },
      { id: "approval", label: copy.stepLabels.approval },
      { id: "sent", label: copy.stepLabels.sent },
      { id: "response", label: copy.stepLabels.response }
    ] as const;

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

      let detail = "-";
      if (step.id === "response") {
        if (selected.respondedAt) {
          detail = toDateText(selected.respondedAt, runtimeLocale);
        } else if (selected.status === "SIGNED") {
          detail = copy.responseStatus.signed;
        } else if (selected.status === "REJECTED") {
          detail = copy.responseStatus.rejected;
        } else {
          detail = copy.responseStatus.empty;
        }
      } else if (step.id === "sent") {
        detail = toDateText(selected.updatedAt, runtimeLocale);
      }

      return {
        ...step,
        tone,
        detail
      };
    });
  }, [copy, runtimeLocale, selected]);

  const recoveryGuide = useMemo(() => {
    if (!selected) {
      return copy.recovery.noDocument;
    }
    if (selected.status === "SIGNED") {
      return copy.recovery.signed;
    }
    if (selected.status === "APPROVAL_REQUESTED") {
      return copy.recovery.approvalRequested;
    }
    if (selected.status === "SENT") {
      return copy.recovery.sent;
    }
    if (selected.status === "REJECTED") {
      return copy.recovery.rejected;
    }
    if (selected.status === "EXPIRED") {
      return copy.recovery.expired;
    }
    if (selected.status === "RENEWED") {
      return copy.recovery.renewed;
    }
    return copy.recovery.default;
  }, [copy, selected]);

  return (
    <>
      <section className="contract-journey-panel">
        <h3>{copy.timelineTitle}</h3>
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
        <h3>{copy.recoveryTitle}</h3>
        <p>{recoveryGuide}</p>
      </section>
    </>
  );
}
