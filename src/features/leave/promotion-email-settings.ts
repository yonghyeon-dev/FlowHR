import type {
  OrganizationEntity,
  UpdateOrganizationInput
} from "@/features/shared/data-access";
import type { PromotionEmailTemplateOverride } from "@/features/leave/promotion-delivery-helpers";

export type LeavePromotionEmailSettingsSnapshot = {
  emailTemplate: {
    url: string | null;
    from: string | null;
    defaultTemplateId: string | null;
    tokenConfigured: boolean;
  };
};

export type LeavePromotionEmailSettingsPayload = {
  emailTemplate: {
    url: string | null;
    from: string | null;
    defaultTemplateId: string | null;
    token: string | null;
    clearToken: boolean;
  };
};

type LeavePromotionEmailSettingsOrganization = Pick<
  OrganizationEntity,
  | "leavePromotionEmailTemplateUrl"
  | "leavePromotionEmailFrom"
  | "leavePromotionEmailTemplateToken"
  | "leavePromotionEmailTemplateId"
>;

export function resolveOrganizationLeavePromotionEmailSettings(
  organization: LeavePromotionEmailSettingsOrganization
): LeavePromotionEmailSettingsSnapshot {
  return {
    emailTemplate: {
      url: organization.leavePromotionEmailTemplateUrl,
      from: organization.leavePromotionEmailFrom,
      defaultTemplateId: organization.leavePromotionEmailTemplateId,
      tokenConfigured: (organization.leavePromotionEmailTemplateToken?.trim() ?? "").length > 0
    }
  };
}

export function toOrganizationLeavePromotionEmailUpdateInput(input: {
  organization: LeavePromotionEmailSettingsOrganization;
  payload: LeavePromotionEmailSettingsPayload;
}): UpdateOrganizationInput {
  const url = input.payload.emailTemplate.url?.trim() ?? "";
  const from = input.payload.emailTemplate.from?.trim() ?? "";
  const defaultTemplateId = input.payload.emailTemplate.defaultTemplateId?.trim() ?? "";
  const token = input.payload.emailTemplate.token?.trim() ?? "";
  const existingToken = input.organization.leavePromotionEmailTemplateToken ?? null;

  return {
    leavePromotionEmailTemplateUrl: url.length > 0 ? url : null,
    leavePromotionEmailFrom: from.length > 0 ? from : null,
    leavePromotionEmailTemplateId: defaultTemplateId.length > 0 ? defaultTemplateId : null,
    leavePromotionEmailTemplateToken: input.payload.emailTemplate.clearToken
      ? null
      : token.length > 0
        ? token
        : existingToken
  };
}

export function resolveOrganizationPromotionEmailTemplateOverride(
  organization: LeavePromotionEmailSettingsOrganization
): PromotionEmailTemplateOverride | null {
  const url = organization.leavePromotionEmailTemplateUrl?.trim() ?? "";
  const from = organization.leavePromotionEmailFrom?.trim() ?? "";
  const token = organization.leavePromotionEmailTemplateToken?.trim() ?? "";
  const defaultTemplateId = organization.leavePromotionEmailTemplateId?.trim() ?? "";

  if (!url && !from && !token && !defaultTemplateId) {
    return null;
  }

  return {
    url: url || null,
    from: from || null,
    token: token || null,
    defaultTemplateId: defaultTemplateId || null,
    urlSource: "organization.leavePromotionEmailTemplateUrl",
    fromSource: "organization.leavePromotionEmailFrom",
    tokenSource: "organization.leavePromotionEmailTemplateToken",
    defaultTemplateIdSource: "organization.leavePromotionEmailTemplateId"
  };
}
