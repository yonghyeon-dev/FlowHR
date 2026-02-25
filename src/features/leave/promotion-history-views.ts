import type {
  LeavePromotionDeliveryEntity,
  LeavePromotionDeliveryRecipientEntity
} from "@/features/shared/data-access";

export type PromotionDeliveryStatus = "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
export type PromotionRecipientStatus = "PENDING" | "SENT" | "SKIPPED_NO_EMAIL" | "FAILED";

export type PromotionTargetSnapshot = {
  employeeId: string;
  name: string | null;
  email: string | null;
  remainingDays: number;
  grantedDays: number;
  usedDays: number;
  lastAccrualYear: number | null;
  eligibleNow: boolean;
};

export type PromotionDeliverySummaryView = {
  id: string;
  organizationId: string;
  asOf: string;
  includeUpcoming: boolean;
  dryRun: boolean;
  channel: "webhook" | "email_template";
  provider: string | null;
  status: PromotionDeliveryStatus;
  targetCount: number;
  recipientCount: number;
  missingEmailCount: number;
  sentTargetCount: number;
  webhookSource: string | null;
  emailTemplateSource: string | null;
  emailTemplateId: string | null;
  dispatchedAt: string | null;
  requestedByActorRole: string;
  requestedByActorId: string | null;
  retryOfDeliveryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PromotionDeliveryRecipientView = {
  id: string;
  deliveryId: string;
  employeeId: string;
  email: string | null;
  name: string | null;
  remainingDays: number;
  grantedDays: number;
  usedDays: number;
  lastAccrualYear: number | null;
  eligibleNow: boolean;
  status: PromotionRecipientStatus;
  lastError: string | null;
  sentAt: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
};

export function toPromotionTargetSnapshots(
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }>
): PromotionTargetSnapshot[] {
  return targets.map((target) => ({
    employeeId: target.employeeId,
    name: target.name,
    email: target.email,
    remainingDays: target.remainingDays,
    grantedDays: target.grantedDays,
    usedDays: target.usedDays,
    lastAccrualYear: target.lastAccrualYear,
    eligibleNow: target.eligibleNow
  }));
}

export function toPromotionTargetSnapshotsFromRecipients(
  recipients: LeavePromotionDeliveryRecipientEntity[]
): PromotionTargetSnapshot[] {
  return recipients.map((recipient) => ({
    employeeId: recipient.employeeId,
    name: recipient.name,
    email: recipient.email,
    remainingDays: recipient.remainingDays,
    grantedDays: recipient.grantedDays,
    usedDays: recipient.usedDays,
    lastAccrualYear: recipient.lastAccrualYear,
    eligibleNow: recipient.eligibleNow
  }));
}

export function toPromotionDispatchRecipients(targets: PromotionTargetSnapshot[]) {
  return targets.flatMap((target) => {
    const email = target.email?.trim() || "";
    if (!email) {
      return [];
    }
    return [
      {
        employeeId: target.employeeId,
        email,
        name: target.name,
        remainingDays: target.remainingDays,
        grantedDays: target.grantedDays,
        usedDays: target.usedDays,
        lastAccrualYear: target.lastAccrualYear,
        eligibleNow: target.eligibleNow
      }
    ];
  });
}

export function toPromotionDeliverySummaryView(
  delivery: LeavePromotionDeliveryEntity
): PromotionDeliverySummaryView {
  return {
    id: delivery.id,
    organizationId: delivery.organizationId,
    asOf: delivery.asOf.toISOString(),
    includeUpcoming: delivery.includeUpcoming,
    dryRun: delivery.dryRun,
    channel: delivery.channel,
    provider: delivery.provider,
    status: delivery.status,
    targetCount: delivery.targetCount,
    recipientCount: delivery.recipientCount,
    missingEmailCount: delivery.missingEmailCount,
    sentTargetCount: delivery.sentTargetCount,
    webhookSource: delivery.webhookSource,
    emailTemplateSource: delivery.emailTemplateSource,
    emailTemplateId: delivery.emailTemplateId,
    dispatchedAt: delivery.dispatchedAt ? delivery.dispatchedAt.toISOString() : null,
    requestedByActorRole: delivery.requestedByActorRole,
    requestedByActorId: delivery.requestedByActorId,
    retryOfDeliveryId: delivery.retryOfDeliveryId,
    createdAt: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt.toISOString()
  };
}

export function toPromotionDeliveryRecipientView(
  recipient: LeavePromotionDeliveryRecipientEntity
): PromotionDeliveryRecipientView {
  return {
    id: recipient.id,
    deliveryId: recipient.deliveryId,
    employeeId: recipient.employeeId,
    email: recipient.email,
    name: recipient.name,
    remainingDays: recipient.remainingDays,
    grantedDays: recipient.grantedDays,
    usedDays: recipient.usedDays,
    lastAccrualYear: recipient.lastAccrualYear,
    eligibleNow: recipient.eligibleNow,
    status: recipient.status,
    lastError: recipient.lastError,
    sentAt: recipient.sentAt ? recipient.sentAt.toISOString() : null,
    retryCount: recipient.retryCount,
    createdAt: recipient.createdAt.toISOString(),
    updatedAt: recipient.updatedAt.toISOString()
  };
}

export function toRetryCountByEmployeeId(
  sourceRecipients: LeavePromotionDeliveryRecipientEntity[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const recipient of sourceRecipients) {
    const current = map[recipient.employeeId] ?? 0;
    map[recipient.employeeId] = Math.max(current, recipient.retryCount);
  }
  return map;
}

export function toRecipientStatus(
  target: PromotionTargetSnapshot,
  input: {
    status: PromotionDeliveryStatus;
    channel: "webhook" | "email_template";
    dryRun: boolean;
    attempted: boolean;
    sentAt: Date | null;
  }
): PromotionRecipientStatus {
  const email = target.email?.trim() || "";
  if (!email) {
    return "SKIPPED_NO_EMAIL";
  }
  if (input.status === "failed" && input.attempted) {
    return "FAILED";
  }
  if (input.status === "dispatched") {
    return "SENT";
  }
  return "PENDING";
}
