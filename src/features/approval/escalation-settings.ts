import type {
  OrganizationEntity,
  UpdateOrganizationInput
} from "@/features/shared/data-access";

export const DEFAULT_APPROVAL_ESCALATION_STALLED_HOURS_MIN = 24;
export const DEFAULT_APPROVAL_ESCALATION_LIMIT = 50;
export const DEFAULT_APPROVAL_ESCALATION_NOTIFICATION_CHANNEL =
  "approval-stalled-queue";

type ApprovalEscalationSettingsOrganization = Pick<
  OrganizationEntity,
  | "approvalEscalationDefaultStalledHoursMin"
  | "approvalEscalationDefaultLimit"
  | "approvalEscalationDefaultNotificationChannel"
>;

export type ApprovalEscalationSettingsSnapshot = {
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
  };
};

export type ApprovalEscalationSettingsPayload = ApprovalEscalationSettingsSnapshot;

export function resolveOrganizationApprovalEscalationSettings(
  organization: ApprovalEscalationSettingsOrganization | null | undefined
): ApprovalEscalationSettingsSnapshot {
  return {
    policy: {
      stalledHoursMin:
        organization?.approvalEscalationDefaultStalledHoursMin ??
        DEFAULT_APPROVAL_ESCALATION_STALLED_HOURS_MIN,
      limit:
        organization?.approvalEscalationDefaultLimit ??
        DEFAULT_APPROVAL_ESCALATION_LIMIT,
      notificationChannel:
        organization?.approvalEscalationDefaultNotificationChannel?.trim() ||
        DEFAULT_APPROVAL_ESCALATION_NOTIFICATION_CHANNEL
    }
  };
}

export function toOrganizationApprovalEscalationUpdateInput(
  payload: ApprovalEscalationSettingsPayload
): UpdateOrganizationInput {
  return {
    approvalEscalationDefaultStalledHoursMin: payload.policy.stalledHoursMin,
    approvalEscalationDefaultLimit: payload.policy.limit,
    approvalEscalationDefaultNotificationChannel:
      payload.policy.notificationChannel.trim()
  };
}
