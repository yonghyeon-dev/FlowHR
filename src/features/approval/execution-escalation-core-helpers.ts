import type { ApprovalDomain, ApprovalExecutionEntity } from "@/features/shared/data-access";

export type ApprovalExecutionEscalationDecision = "REQUESTED" | "DRY_RUN";

export type ApprovalExecutionEscalationItem = {
  executionId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stalledHours: number;
  currentStageIndex: number;
  totalStages: number;
  decision: ApprovalExecutionEscalationDecision;
};

export type ApprovalEscalationWebhookProvider = "discord" | "slack";

export type ApprovalEscalationWebhookConfig = {
  url: string;
  provider: ApprovalEscalationWebhookProvider;
  source: string;
};

type ApprovalEscalationWebhookOverride = {
  url: string;
  provider: ApprovalEscalationWebhookProvider;
  source: string;
};

function resolveExecutionDomainPriority(domain: ApprovalDomain) {
  if (domain === "PAYROLL") {
    return 300;
  }
  if (domain === "LEAVE") {
    return 200;
  }
  return 100;
}

export function calculateExecutionStalledHours(execution: ApprovalExecutionEntity, asOf: Date) {
  return Math.max(0, (asOf.getTime() - execution.updatedAt.getTime()) / (60 * 60 * 1000));
}

function calculateExecutionPriorityScore(execution: ApprovalExecutionEntity, asOf: Date) {
  const pendingWeight = execution.state === "PENDING" ? 100_000 : execution.state === "REJECTED" ? 1_000 : 0;
  const stalledHours = calculateExecutionStalledHours(execution, asOf);
  const stalledWeight = Math.round(stalledHours * 100);
  const domainWeight = resolveExecutionDomainPriority(execution.domain);
  const stageWeight =
    execution.state === "PENDING"
      ? Math.max(0, execution.totalStages - execution.currentStageIndex + 1) * 10
      : 0;
  return pendingWeight + stalledWeight + domainWeight + stageWeight;
}

export function compareExecutionsByPriority(
  left: ApprovalExecutionEntity,
  right: ApprovalExecutionEntity,
  asOf: Date
) {
  const byPriority =
    calculateExecutionPriorityScore(right, asOf) - calculateExecutionPriorityScore(left, asOf);
  if (byPriority !== 0) {
    return byPriority;
  }

  const byUpdatedAt = left.updatedAt.getTime() - right.updatedAt.getTime();
  if (byUpdatedAt !== 0) {
    return byUpdatedAt;
  }

  return left.id.localeCompare(right.id);
}

export function toApprovalExecutionEscalationItems(input: {
  executions: ApprovalExecutionEntity[];
  asOf: Date;
  dryRun: boolean;
}): ApprovalExecutionEscalationItem[] {
  return input.executions.map((execution) => ({
    executionId: execution.id,
    domain: execution.domain,
    targetEntityType: execution.targetEntityType,
    targetEntityId: execution.targetEntityId,
    stalledHours: Math.round(calculateExecutionStalledHours(execution, input.asOf) * 10) / 10,
    currentStageIndex: execution.currentStageIndex,
    totalStages: execution.totalStages,
    decision: input.dryRun ? "DRY_RUN" : "REQUESTED"
  }));
}

function normalizeEnvValue(value: string | undefined) {
  return (value ?? "").trim();
}

function resolveApprovalEscalationWebhookProvider(
  webhookUrl: string,
  env: NodeJS.ProcessEnv = process.env
): ApprovalEscalationWebhookProvider {
  const configured = normalizeEnvValue(
    env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_PROVIDER ?? env.FLOWHR_ALERT_WEBHOOK_PROVIDER
  ).toLowerCase();
  if (configured === "discord" || configured === "slack") {
    return configured;
  }

  if (
    webhookUrl.includes("discord.com/api/webhooks/") ||
    webhookUrl.includes("discordapp.com/api/webhooks/")
  ) {
    return "discord";
  }
  if (webhookUrl.includes("hooks.slack.com/services/")) {
    return "slack";
  }
  return "slack";
}

export function resolveApprovalEscalationWebhookConfig(
  env: NodeJS.ProcessEnv = process.env,
  override?: ApprovalEscalationWebhookOverride | null
): ApprovalEscalationWebhookConfig | null {
  if (override) {
    return override;
  }

  const candidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL",
      value: normalizeEnvValue(env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_DISCORD_WEBHOOK",
      value: normalizeEnvValue(env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_SLACK_WEBHOOK",
      value: normalizeEnvValue(env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_SLACK_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_WEBHOOK_URL",
      value: normalizeEnvValue(env.FLOWHR_ALERT_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_ALERT_DISCORD_WEBHOOK",
      value: normalizeEnvValue(env.FLOWHR_ALERT_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_SLACK_WEBHOOK",
      value: normalizeEnvValue(env.FLOWHR_ALERT_SLACK_WEBHOOK)
    }
  ];

  const matched = candidates.find((candidate) => candidate.value.length > 0);
  if (!matched) {
    return null;
  }

  return {
    url: matched.value,
    provider: resolveApprovalEscalationWebhookProvider(matched.value, env),
    source: matched.source
  };
}

export async function sendApprovalEscalationWebhook(
  config: ApprovalEscalationWebhookConfig,
  message: string,
  fetcher: typeof fetch = fetch
) {
  const payload =
    config.provider === "discord"
      ? JSON.stringify({ content: message })
      : JSON.stringify({ text: message });

  const response = await fetcher(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: payload
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${config.provider} webhook request failed: ${response.status} ${body}`);
  }
}
