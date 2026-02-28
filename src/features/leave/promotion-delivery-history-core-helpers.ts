import type { PromotionDeliveryProvider } from "@/features/leave/promotion-delivery-helpers";
import type { DataAccess } from "@/features/shared/data-access";
import {
  toPromotionDispatchRecipients,
  toRecipientStatus,
  type PromotionDeliveryStatus,
  type PromotionTargetSnapshot
} from "@/features/leave/promotion-history-views";

type LeavePromotionDeliveryStore = DataAccess["leavePromotionDeliveries"];

export function resolvePromotionRecipientStats(targets: PromotionTargetSnapshot[]) {
  const recipients = toPromotionDispatchRecipients(targets);
  return {
    recipients,
    targetCount: targets.length,
    recipientCount: recipients.length,
    missingEmailCount: Math.max(targets.length - recipients.length, 0)
  };
}

export async function persistPromotionDeliveryHistory(
  store: LeavePromotionDeliveryStore,
  input: {
    organizationId: string;
    asOf: string;
    includeUpcoming: boolean;
    dryRun: boolean;
    channel: "webhook" | "email_template";
    provider: PromotionDeliveryProvider | null;
    status: PromotionDeliveryStatus;
    announcementTitle: string;
    announcementBody: string;
    targets: PromotionTargetSnapshot[];
    sentTargetCount: number;
    webhookSource: string | null;
    emailTemplateSource: string | null;
    emailTemplateId: string | null;
    dispatchedAt: Date | null;
    actorRole: string;
    actorId: string | null;
    retryOfDeliveryId?: string | null;
    retryCountByEmployeeId?: Record<string, number>;
    attempted: boolean;
    failureMessage?: string | null;
  }
) {
  const asOf = new Date(input.asOf);
  const stats = resolvePromotionRecipientStats(input.targets);

  const delivery = await store.create({
    organizationId: input.organizationId,
    asOf,
    includeUpcoming: input.includeUpcoming,
    dryRun: input.dryRun,
    channel: input.channel,
    provider: input.provider,
    status: input.status,
    announcementTitle: input.announcementTitle,
    announcementBody: input.announcementBody,
    targetCount: stats.targetCount,
    recipientCount: stats.recipientCount,
    missingEmailCount: stats.missingEmailCount,
    sentTargetCount: input.sentTargetCount,
    webhookSource: input.webhookSource,
    emailTemplateSource: input.emailTemplateSource,
    emailTemplateId: input.emailTemplateId,
    dispatchedAt: input.dispatchedAt,
    requestedByActorRole: input.actorRole,
    requestedByActorId: input.actorId,
    retryOfDeliveryId: input.retryOfDeliveryId ?? null
  });

  for (const target of input.targets) {
    const status = toRecipientStatus(target, {
      status: input.status,
      channel: input.channel,
      dryRun: input.dryRun,
      attempted: input.attempted,
      sentAt: input.dispatchedAt
    });
    await store.createRecipient({
      deliveryId: delivery.id,
      employeeId: target.employeeId,
      email: target.email,
      name: target.name,
      remainingDays: target.remainingDays,
      grantedDays: target.grantedDays,
      usedDays: target.usedDays,
      lastAccrualYear: target.lastAccrualYear,
      eligibleNow: target.eligibleNow,
      status,
      lastError: status === "FAILED" ? input.failureMessage ?? null : null,
      sentAt: status === "SENT" ? input.dispatchedAt : null,
      retryCount: input.retryOfDeliveryId
        ? Math.max(0, (input.retryCountByEmployeeId?.[target.employeeId] ?? 0) + 1)
        : 0
    });
  }

  return {
    deliveryId: delivery.id,
    recipientCount: stats.recipientCount,
    missingEmailCount: stats.missingEmailCount
  };
}

export function normalizeRecipientEmployeeIds(values?: string[]) {
  if (!values) {
    return [];
  }
  const deduped = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    deduped.add(normalized);
  }
  return [...deduped];
}
