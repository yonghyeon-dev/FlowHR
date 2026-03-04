import type { Actor } from "@/lib/actor";
import type { DataAccess } from "@/features/shared/data-access";
import {
  persistPromotionDeliveryHistory
} from "@/features/leave/promotion-delivery-history-core-helpers";
import type { PromotionDeliveryProvider } from "@/features/leave/promotion-delivery-helpers";
import type { PromotionTargetSnapshot } from "@/features/leave/promotion-history-views";

type PromotionDispatchPreviewSnapshot = {
  organizationId: string;
  asOf: string;
  announcementDraft: {
    title: string;
    body: string;
  };
};

type PromotionDispatchFailureAuditInput = {
  dataAccess: DataAccess;
  actor: Actor;
  preview: PromotionDispatchPreviewSnapshot;
  includeUpcoming: boolean;
  dryRun: boolean;
  channel: "webhook" | "email_template";
  provider: PromotionDeliveryProvider | null;
  targetSnapshots: PromotionTargetSnapshot[];
  targetCount: number;
  recipientCount: number;
  missingEmailCount: number;
  attempted: boolean;
  emailTemplateId: string | null;
  webhookSource: string | null;
  emailTemplateSource: string | null;
  reason: string;
  failureMessage: string;
};

export async function recordPromotionDispatchFailure(input: PromotionDispatchFailureAuditInput) {
  await persistPromotionDeliveryHistory(input.dataAccess.leavePromotionDeliveries, {
    organizationId: input.preview.organizationId,
    asOf: input.preview.asOf,
    includeUpcoming: input.includeUpcoming,
    dryRun: input.dryRun,
    channel: input.channel,
    provider: input.provider,
    status: "failed",
    announcementTitle: input.preview.announcementDraft.title,
    announcementBody: input.preview.announcementDraft.body,
    targets: input.targetSnapshots,
    sentTargetCount: 0,
    webhookSource: input.webhookSource,
    emailTemplateSource: input.emailTemplateSource,
    emailTemplateId: input.emailTemplateId,
    dispatchedAt: null,
    actorRole: input.actor.role,
    actorId: input.actor.id,
    attempted: input.attempted,
    failureMessage: input.failureMessage
  });

  await input.dataAccess.audit.append({
    action: "leave.promotion_notice.failed",
    entityType: "LeavePolicy",
    organizationId: input.preview.organizationId,
    actorRole: input.actor.role,
    actorId: input.actor.id,
    payload: {
      asOf: input.preview.asOf,
      includeUpcoming: input.includeUpcoming,
      dryRun: input.dryRun,
      targetCount: input.targetCount,
      recipientCount: input.recipientCount,
      missingEmailCount: input.missingEmailCount,
      channel: input.channel,
      provider: input.provider,
      webhookSource: input.webhookSource,
      emailTemplateSource: input.emailTemplateSource,
      emailTemplateId: input.emailTemplateId,
      reason: input.reason,
      error: input.failureMessage
    }
  });
}
