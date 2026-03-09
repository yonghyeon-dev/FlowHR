import {
  formatApprovalDomainLabel,
  formatApprovalEntityTypeLabel
} from "@/lib/product-language";
import type { ApprovalExecutionEscalationItem } from "@/features/approval/execution-escalation-core-helpers";

function resolvePublicBaseUrl() {
  const candidates = [
    process.env.FLOWHR_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL
  ];

  for (const candidate of candidates) {
    const normalized = candidate?.trim();
    if (!normalized) {
      continue;
    }
    return normalized.startsWith("http") ? normalized : `https://${normalized}`;
  }
  return null;
}

function buildApprovalExecutionActionLink() {
  const baseUrl = resolvePublicBaseUrl();
  return baseUrl ? `${baseUrl.replace(/\/+$/, "")}/admin/approval-executions` : null;
}

function formatExecutionSummary(item: ApprovalExecutionEscalationItem, index: number) {
  const domainLabel = formatApprovalDomainLabel(item.domain, "ko-KR");
  const entityLabel = formatApprovalEntityTypeLabel(item.targetEntityType, "ko-KR");
  const stageLabel = `${item.currentStageIndex}/${item.totalStages} 단계`;
  return `${index + 1}. ${domainLabel} · ${entityLabel} · ${item.stalledHours.toFixed(1)}시간 지연 · ${stageLabel} 승인 대기`;
}

export function buildApprovalExecutionEscalationMessage(input: {
  organizationId: string;
  requestedAt: string;
  asOf: string;
  stalledHoursMin: number;
  notificationChannel: string;
  dryRun: boolean;
  items: ApprovalExecutionEscalationItem[];
}) {
  const title = input.dryRun
    ? "[FlowHR] 결재 지연 알림 점검"
    : "[FlowHR] 결재 지연 알림";
  const actionLink = buildApprovalExecutionActionLink();
  const lines = [
    title,
    input.dryRun
      ? "운영자 안내 발송 전 점검 결과입니다."
      : "승인 대기 건이 오래 정체되어 확인이 필요합니다.",
    `- 점검 시각: ${input.asOf}`,
    `- 요청 시각: ${input.requestedAt}`,
    `- 지연 기준: ${input.stalledHoursMin}시간 이상`,
    `- 확인 대상: ${input.items.length}건`,
    "- 권장 조치: 관리자 결재 현황에서 승인 대기 건을 확인해 주세요."
  ];

  if (actionLink) {
    lines.push(`- 바로가기: ${actionLink}`);
  }

  lines.push("- 대상 목록:");
  for (const [index, item] of input.items.slice(0, 50).entries()) {
    lines.push(`  - ${formatExecutionSummary(item, index)}`);
  }
  if (input.items.length > 50) {
    lines.push(`  - 그 외 ${input.items.length - 50}건`);
  }
  return lines.join("\n");
}
