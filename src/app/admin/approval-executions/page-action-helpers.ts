import { toIso } from "@/app/admin/approval-executions/page-helpers";
import type {
  ApprovalDomain,
  ApprovalExecutionDto,
  EscalationResultDto
} from "@/app/admin/approval-executions/page-types";

type ApiCallResult = {
  response: {
    ok: boolean;
  };
  body: unknown;
};

type CallApi = (
  label: string,
  method: "GET" | "POST",
  path: string,
  payload?: Record<string, unknown>
) => Promise<ApiCallResult>;

type ActionContext = {
  isKoLocale: boolean;
  callApi: CallApi;
  showTransientStatus: (message: string) => void;
  reloadExecutions: () => Promise<void>;
};

type EscalationContext = {
  isKoLocale: boolean;
  organizationId: string;
  domain: ApprovalDomain | "";
  stalledHoursMin: string;
  limit: string;
  asOfInput: string;
  notificationChannel: string;
  callApi: CallApi;
  showTransientStatus: (message: string) => void;
  setEscalationResult: (value: EscalationResultDto) => void;
};

function readApiErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }
  const parsed = body as { error?: unknown; message?: unknown };
  if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
    return parsed.error.trim();
  }
  if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
    return parsed.message.trim();
  }
  return null;
}

function isBenefitRequestExecution(execution: ApprovalExecutionDto) {
  return execution.targetEntityType === "BENEFIT_REQUEST";
}

function resolveExecutionActionPath(
  execution: ApprovalExecutionDto,
  action: "approve" | "reject"
): string | null {
  if (isBenefitRequestExecution(execution)) {
    return `/api/benefits/requests/${execution.targetEntityId}/decision`;
  }
  if (execution.domain === "LEAVE") {
    return action === "approve"
      ? `/api/leave/requests/${execution.targetEntityId}/approve`
      : `/api/leave/requests/${execution.targetEntityId}/reject`;
  }
  if (execution.domain === "ATTENDANCE") {
    return action === "approve"
      ? `/api/attendance/records/${execution.targetEntityId}/approve`
      : `/api/attendance/records/${execution.targetEntityId}/reject`;
  }
  if (execution.domain === "PAYROLL" && action === "approve") {
    return `/api/payroll/runs/${execution.targetEntityId}/confirm`;
  }
  return null;
}

function resolveApproveLabel(execution: ApprovalExecutionDto, isKoLocale: boolean) {
  if (isBenefitRequestExecution(execution)) {
    return isKoLocale ? "복리후생 요청 승인" : "Approve benefit request";
  }
  if (execution.domain === "LEAVE") {
    return isKoLocale ? "휴가 요청 승인" : "Approve leave request";
  }
  if (execution.domain === "PAYROLL") {
    return isKoLocale ? "급여 실행 확정" : "Confirm payroll run";
  }
  return isKoLocale ? "출퇴근 기록 승인" : "Approve attendance record";
}

function resolveRejectLabel(execution: ApprovalExecutionDto, isKoLocale: boolean) {
  if (isBenefitRequestExecution(execution)) {
    return isKoLocale ? "복리후생 요청 반려" : "Reject benefit request";
  }
  if (execution.domain === "LEAVE") {
    return isKoLocale ? "휴가 요청 반려" : "Reject leave request";
  }
  return isKoLocale ? "출퇴근 기록 반려" : "Reject attendance record";
}

export async function runApproveExecutionAction(
  execution: ApprovalExecutionDto,
  context: ActionContext
) {
  const path = resolveExecutionActionPath(execution, "approve");
  if (!path) {
    return;
  }

  const isBenefitExecution = isBenefitRequestExecution(execution);
  const { response, body } = await context.callApi(
    resolveApproveLabel(execution, context.isKoLocale),
    "POST",
    path,
    isBenefitExecution ? { decision: "APPROVED" } : undefined
  );
  if (!response.ok) {
    const errorMessage = readApiErrorMessage(body);
    context.showTransientStatus(
      errorMessage ??
        (context.isKoLocale
          ? "승인 요청을 처리하지 못했습니다."
          : "Failed to process approval request.")
    );
    return;
  }

  context.showTransientStatus(
    context.isKoLocale
      ? "승인 처리 후 목록을 갱신했습니다."
      : "Approval completed and queue reloaded."
  );
  await context.reloadExecutions();
}

export async function runRejectExecutionAction(
  execution: ApprovalExecutionDto,
  reason: string,
  context: ActionContext
) {
  const normalizedReason = reason.trim();
  if (normalizedReason.length === 0) {
    context.showTransientStatus(
      context.isKoLocale ? "반려 사유를 입력해 주세요." : "Rejection reason is required."
    );
    return;
  }

  const path = resolveExecutionActionPath(execution, "reject");
  if (!path) {
    return;
  }

  const isBenefitExecution = isBenefitRequestExecution(execution);
  const { response, body } = await context.callApi(
    resolveRejectLabel(execution, context.isKoLocale),
    "POST",
    path,
    isBenefitExecution
      ? {
          decision: "REJECTED",
          reviewNote: normalizedReason
        }
      : {
          reason: normalizedReason
        }
  );
  if (!response.ok) {
    const errorMessage = readApiErrorMessage(body);
    context.showTransientStatus(
      errorMessage ??
        (context.isKoLocale
          ? "반려 요청을 처리하지 못했습니다."
          : "Failed to process rejection request.")
    );
    return;
  }

  context.showTransientStatus(
    context.isKoLocale
      ? "반려 처리 후 목록을 갱신했습니다."
      : "Rejection completed and queue reloaded."
  );
  await context.reloadExecutions();
}

export async function runEscalationAction(dryRun: boolean, context: EscalationContext) {
  const payload = {
    organizationId: context.organizationId.trim(),
    domain: context.domain || undefined,
    stalledHoursMin: context.stalledHoursMin.trim()
      ? Number(context.stalledHoursMin.trim())
      : undefined,
    limit: context.limit.trim() ? Number(context.limit.trim()) : undefined,
    asOf: context.asOfInput.trim() ? toIso(context.asOfInput) : undefined,
    dryRun,
    notificationChannel: context.notificationChannel.trim() || undefined
  };

  const { response, body } = await context.callApi(
    dryRun
      ? context.isKoLocale
        ? "정체 에스컬레이션 드라이런"
        : "Escalation dry run"
      : context.isKoLocale
        ? "정체 에스컬레이션 실행"
        : "Escalation dispatch",
    "POST",
    "/api/approval/executions/escalate",
    payload
  );

  if (!response.ok || !body || typeof body !== "object") {
    return;
  }

  const parsed = body as EscalationResultDto;
  context.setEscalationResult(parsed);
  if (parsed.dryRun) {
    context.showTransientStatus(
      context.isKoLocale
        ? `드라이런 완료: 후보 ${parsed.counts.candidates}건`
        : `Dry run complete: ${parsed.counts.candidates} candidate(s)`
    );
    return;
  }
  if (parsed.counts.requested > 0) {
    context.showTransientStatus(
      context.isKoLocale
        ? `에스컬레이션 전송 완료: ${parsed.counts.requested}건`
        : `Escalation sent: ${parsed.counts.requested} item(s)`
    );
    return;
  }
  context.showTransientStatus(
    context.isKoLocale
      ? "에스컬레이션 후보가 없어 전송을 건너뛰었습니다."
      : "No escalation candidate found, dispatch skipped."
  );
}
