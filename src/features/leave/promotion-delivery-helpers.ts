export type PromotionWebhookProvider = "discord" | "slack";
export type PromotionDeliveryProvider = PromotionWebhookProvider | "email_template";

export type PromotionWebhookConfig = {
  url: string;
  provider: PromotionWebhookProvider;
  source: string;
};

export type PromotionEmailTemplateConfig = {
  url: string;
  token: string | null;
  from: string;
  urlSource: string;
  tokenSource: string | null;
  fromSource: string;
};

function normalizeEnvValue(value: string | undefined) {
  return (value ?? "").trim();
}

export function resolvePromotionWebhookProvider(webhookUrl: string): PromotionWebhookProvider {
  const configured = normalizeEnvValue(
    process.env.FLOWHR_LEAVE_PROMOTION_WEBHOOK_PROVIDER ??
      process.env.FLOWHR_ALERT_WEBHOOK_PROVIDER
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

export function resolvePromotionWebhookConfig(): PromotionWebhookConfig | null {
  const candidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_WEBHOOK_URL",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_ALERT_DISCORD_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_SLACK_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_SLACK_WEBHOOK)
    }
  ];

  const matched = candidates.find((candidate) => candidate.value.length > 0);
  if (!matched) {
    return null;
  }

  return {
    url: matched.value,
    provider: resolvePromotionWebhookProvider(matched.value),
    source: matched.source
  };
}

export function resolvePromotionEmailTemplateConfig(): PromotionEmailTemplateConfig | null {
  const urlCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_TEMPLATE_URL",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_TEMPLATE_URL)
    }
  ];
  const fromCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_FROM",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_FROM",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_FROM)
    }
  ];
  const tokenCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_TEMPLATE_TOKEN",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_TEMPLATE_TOKEN)
    }
  ];

  const matchedUrl = urlCandidates.find((candidate) => candidate.value.length > 0);
  const matchedFrom = fromCandidates.find((candidate) => candidate.value.length > 0);
  if (!matchedUrl || !matchedFrom) {
    return null;
  }
  const matchedToken = tokenCandidates.find((candidate) => candidate.value.length > 0);

  return {
    url: matchedUrl.value,
    token: matchedToken?.value ?? null,
    from: matchedFrom.value,
    urlSource: matchedUrl.source,
    tokenSource: matchedToken?.source ?? null,
    fromSource: matchedFrom.source
  };
}

export function buildPromotionNoticeMessage(input: {
  organizationId: string;
  asOf: string;
  includeUpcoming: boolean;
  dryRun: boolean;
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
}) {
  const headline = input.dryRun
    ? "[FlowHR] 연차 촉진 공지 드라이런"
    : "[FlowHR] 연차 촉진 공지 발송";

  const lines = [
    headline,
    `- 조직: ${input.organizationId}`,
    `- 기준 시각(asOf): ${input.asOf}`,
    `- 공지 윈도우: ${input.noticeWindow.startAt} ~ ${input.noticeWindow.endAt}`,
    `- 윈도우 오픈: ${input.noticeWindow.isOpen ? "yes" : "no"}`,
    `- includeUpcoming: ${input.includeUpcoming ? "yes" : "no"}`,
    `- 대상자: 표시 ${input.summary.displayTargetCount}명 / 즉시 ${input.summary.eligibleNowCount}명 / 잠재 ${input.summary.potentialTargetCount}명`,
    "- 공지 제목:",
    input.announcementDraft.title,
    "- 공지 본문:",
    input.announcementDraft.body
  ];

  const sampleTargets = input.targets.slice(0, 30);
  if (sampleTargets.length > 0) {
    lines.push("- 대상자 샘플:");
    for (const target of sampleTargets) {
      const name = target.name?.trim() || "-";
      const email = target.email?.trim() || "-";
      lines.push(
        `  - ${target.employeeId} | ${name} | ${email} | remaining=${target.remainingDays} | ${target.eligibleNow ? "eligible" : "upcoming"}`
      );
    }
  }
  if (input.targets.length > sampleTargets.length) {
    lines.push(`  - ... and ${input.targets.length - sampleTargets.length} more target(s)`);
  }

  return lines.join("\n");
}

export async function sendPromotionWebhook(config: PromotionWebhookConfig, message: string) {
  const payload =
    config.provider === "discord"
      ? JSON.stringify({ content: message })
      : JSON.stringify({ text: message });

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: payload
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`${config.provider} webhook request failed: ${response.status} ${responseBody}`);
  }
}

export async function sendPromotionEmailTemplate(
  config: PromotionEmailTemplateConfig,
  payload: {
    templateId: string;
    from: string;
    subject: string;
    body: string;
    organizationId: string;
    asOf: string;
    includeUpcoming: boolean;
    noticeWindow?: { startAt: string; endAt: string; isOpen: boolean };
    summary?: { potentialTargetCount: number; displayTargetCount: number; eligibleNowCount: number };
    recipients: Array<{
      employeeId: string;
      email: string;
      name: string | null;
      remainingDays: number;
      grantedDays: number;
      usedDays: number;
      lastAccrualYear: number | null;
      eligibleNow: boolean;
    }>;
  }
) {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`email template request failed: ${response.status} ${responseBody}`);
  }
}
