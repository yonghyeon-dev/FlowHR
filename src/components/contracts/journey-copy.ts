import type { FlowLocale } from "@/lib/i18n/locales";

type ContractJourneyStepLabels = {
  draft: string;
  approval: string;
  sent: string;
  response: string;
};

type ContractJourneyRecoveryLabels = {
  noDocument: string;
  signed: string;
  approvalRequested: string;
  sent: string;
  rejected: string;
  expired: string;
  renewed: string;
  default: string;
};

type ContractJourneyResponseStatusLabels = {
  signed: string;
  rejected: string;
  empty: string;
};

export type ContractJourneyCopy = {
  timelineTitle: string;
  recoveryTitle: string;
  stepLabels: ContractJourneyStepLabels;
  responseStatus: ContractJourneyResponseStatusLabels;
  recovery: ContractJourneyRecoveryLabels;
};

export const contractJourneyCopyByLocale: Record<FlowLocale, ContractJourneyCopy> = {
  ko: {
    timelineTitle: "서명 여정 타임라인",
    recoveryTitle: "복구 가이드",
    stepLabels: {
      draft: "초안 생성",
      approval: "승인 단계",
      sent: "직원 발송",
      response: "직원 응답"
    },
    responseStatus: {
      signed: "서명 처리 완료",
      rejected: "거절 처리",
      empty: "-"
    },
    recovery: {
      noDocument: "문서를 선택하면 상태별 후속 가이드를 확인할 수 있습니다.",
      signed: "서명이 완료되었습니다. 증빙 파일을 내려받아 보관해 주세요.",
      approvalRequested: "관리자 승인 대기 중입니다. 급한 건이면 관리자 큐에 우선 처리를 요청해 주세요.",
      sent: "내용 확인 후 서명 또는 거절 사유를 입력해 응답해 주세요.",
      rejected: "거절 사유를 확인한 뒤 수정 계약서를 요청해 주세요.",
      expired: "만료된 문서입니다. 갱신본 발송을 요청해 주세요.",
      renewed: "갱신 문서가 준비되었습니다. 최신 문서를 선택해 응답해 주세요.",
      default: "승인/발송 상태를 확인한 뒤 다음 단계로 진행해 주세요."
    }
  },
  en: {
    timelineTitle: "Signature journey timeline",
    recoveryTitle: "Recovery guide",
    stepLabels: {
      draft: "Draft created",
      approval: "Approval step",
      sent: "Sent to employee",
      response: "Employee response"
    },
    responseStatus: {
      signed: "Signed",
      rejected: "Rejected by employee",
      empty: "-"
    },
    recovery: {
      noDocument: "Select a document to view recovery guidance.",
      signed: "Signature completed. Download and archive evidence.",
      approvalRequested: "Waiting for admin approval. Ask admins to prioritize if urgent.",
      sent: "Review document and respond with sign or reject reason.",
      rejected: "Review rejection reason and request a revised contract.",
      expired: "Document is expired. Request a renewed copy.",
      renewed: "Renewed version is available. Select latest document to respond.",
      default: "Check approval/send status before proceeding to next step."
    }
  }
};
