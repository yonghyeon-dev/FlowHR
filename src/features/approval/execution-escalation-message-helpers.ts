import type { ApprovalExecutionEscalationItem } from "@/features/approval/execution-escalation-core-helpers";

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
    ? "[FlowHR] approval execution escalation dry-run"
    : "[FlowHR] approval execution escalation";
  const lines = [
    title,
    `- organizationId: ${input.organizationId}`,
    `- requestedAt: ${input.requestedAt}`,
    `- asOf: ${input.asOf}`,
    `- stalledHoursMin: ${input.stalledHoursMin}`,
    `- notificationChannel: ${input.notificationChannel}`,
    `- candidateCount: ${input.items.length}`,
    "- candidates:"
  ];

  for (const item of input.items.slice(0, 50)) {
    lines.push(
      `  - ${item.executionId} | ${item.domain} | ${item.targetEntityType}:${item.targetEntityId} | stalled=${item.stalledHours.toFixed(1)}h | stage=${item.currentStageIndex}/${item.totalStages}`
    );
  }
  if (input.items.length > 50) {
    lines.push(`  - ... and ${input.items.length - 50} more`);
  }
  return lines.join("\n");
}
