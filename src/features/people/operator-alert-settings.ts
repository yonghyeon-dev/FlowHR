import type {
  OrganizationEntity,
  UpdateOrganizationInput,
  WebhookProvider
} from "@/features/shared/data-access";

export type OperatorAlertSettingsSnapshot = {
  fallbackWebhook: {
    url: string | null;
    provider: WebhookProvider | null;
  };
  flows: {
    approvalEscalation: boolean;
    leavePromotion: boolean;
  };
};

export type OrganizationOperatorAlertWebhookConfig = {
  url: string;
  provider: WebhookProvider;
  source: "organization.operatorAlertWebhookUrl";
};

type OperatorAlertPayload = {
  fallbackWebhook: {
    url: string | null;
    provider: WebhookProvider | null;
  };
  flows: {
    approvalEscalation: boolean;
    leavePromotion: boolean;
  };
};

export function resolveOrganizationOperatorAlertSettings(
  organization: Pick<
    OrganizationEntity,
    | "operatorAlertWebhookUrl"
    | "operatorAlertWebhookProvider"
    | "approvalEscalationUseOperatorAlertWebhook"
    | "leavePromotionUseOperatorAlertWebhook"
  >
): OperatorAlertSettingsSnapshot {
  return {
    fallbackWebhook: {
      url: organization.operatorAlertWebhookUrl,
      provider: organization.operatorAlertWebhookProvider
    },
    flows: {
      approvalEscalation: organization.approvalEscalationUseOperatorAlertWebhook,
      leavePromotion: organization.leavePromotionUseOperatorAlertWebhook
    }
  };
}

export function toOrganizationOperatorAlertUpdateInput(
  payload: OperatorAlertPayload
): UpdateOrganizationInput {
  const url = payload.fallbackWebhook.url?.trim() ?? "";
  return {
    operatorAlertWebhookUrl: url.length > 0 ? url : null,
    operatorAlertWebhookProvider: url.length > 0 ? payload.fallbackWebhook.provider : null,
    approvalEscalationUseOperatorAlertWebhook: payload.flows.approvalEscalation,
    leavePromotionUseOperatorAlertWebhook: payload.flows.leavePromotion
  };
}

export function resolveOperatorAlertWebhookConfig(input: {
  organization: Pick<
    OrganizationEntity,
    | "operatorAlertWebhookUrl"
    | "operatorAlertWebhookProvider"
    | "approvalEscalationUseOperatorAlertWebhook"
    | "leavePromotionUseOperatorAlertWebhook"
  >;
  flow: "approvalEscalation" | "leavePromotion";
}): OrganizationOperatorAlertWebhookConfig | null {
  const enabled =
    input.flow === "approvalEscalation"
      ? input.organization.approvalEscalationUseOperatorAlertWebhook
      : input.organization.leavePromotionUseOperatorAlertWebhook;
  if (!enabled) {
    return null;
  }

  const url = input.organization.operatorAlertWebhookUrl?.trim() ?? "";
  const provider = input.organization.operatorAlertWebhookProvider;
  if (!url || !provider) {
    return null;
  }

  return {
    url,
    provider,
    source: "organization.operatorAlertWebhookUrl"
  };
}
