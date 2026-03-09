import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import {
  normalizeRecipientEmployeeIds,
  persistPromotionDeliveryHistory,
  resolvePromotionRecipientStats
} from "@/features/leave/promotion-delivery-history-core-helpers";
import { recordPromotionDispatchFailure } from "@/features/leave/promotion-dispatch-failure-helpers";
import {
  buildPromotionNoticeMessage,
  type PromotionDeliveryProvider,
  sendPromotionEmailTemplate,
  sendPromotionWebhook,
  resolvePromotionEmailTemplateConfig,
  resolvePromotionWebhookConfig
} from "@/features/leave/promotion-delivery-helpers";
import { resolveOperatorAlertWebhookConfig } from "@/features/people/operator-alert-settings";
import {
  toPromotionDeliveryRecipientView,
  toPromotionDeliverySummaryView,
  toPromotionTargetSnapshots,
  toPromotionTargetSnapshotsFromRecipients,
  toRetryCountByEmployeeId,
  type PromotionDeliveryRecipientView,
  type PromotionDeliveryStatus,
  type PromotionDeliverySummaryView
} from "@/features/leave/promotion-history-views";
import {
  SEOUL_OFFSET_MS,
  formatSeoulDay,
  fromSeoulDayIndex,
  renderPromotionMessageTemplate,
  resolvePolicyRules,
  resolveSeoulYearEnd,
  roundTo2,
  toSeoulDayIndex
} from "@/features/leave/policy-time-helpers";
import type {
  LeavePromotionDeliveryRecipientEntity
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";
import type {
  DispatchAnnualLeavePromotionNoticeInput,
  ListLeavePromotionDeliveriesInput,
  PreviewAnnualLeavePromotionInput,
  ReadLeavePromotionDeliveryInput,
  RetryLeavePromotionDeliveryInput,
  ServiceContext
} from "@/features/leave/service";

function resolveTargetOrganizationId(actor: Actor | null, inputOrganizationId?: string) {
  const candidate = (inputOrganizationId ?? actor?.organizationId ?? "").trim();
  if (!candidate) {
    throw new ServiceError(400, "organizationId is required");
  }
  return candidate;
}

function ensureTenantAccess(actor: Actor | null, organizationId: string) {
  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, organizationId, "organization not found");
}

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}
export async function previewAnnualLeavePromotionImpl(
  context: ServiceContext,
  input: PreviewAnnualLeavePromotionInput
): Promise<{
  organizationId: string;
  asOf: string;
  policy: {
    enabled: boolean;
    thresholdDays: number;
    leadDays: number;
    messageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    activeEmployeeCount: number;
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveBalanceReadAny,
    "leave promotion preview requires permission"
  );

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  const asOf = input.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) {
    throw new ServiceError(400, "asOf must be a valid datetime");
  }

  const stored = await context.dataAccess.leavePolicy.findByOrganizationId(organizationId);
  const policyRules = resolvePolicyRules(stored);

  const yearEnd = resolveSeoulYearEnd(asOf);
  const yearEndDayIndex = toSeoulDayIndex(yearEnd);
  const noticeWindowStartDayIndex = yearEndDayIndex - policyRules.annualLeavePromotionLeadDays;
  const noticeWindowStart = fromSeoulDayIndex(noticeWindowStartDayIndex);
  const noticeWindowEnd = new Date(fromSeoulDayIndex(yearEndDayIndex + 1).getTime() - 1);
  const asOfDayIndex = toSeoulDayIndex(asOf);
  const noticeWindowOpen =
    asOfDayIndex >= noticeWindowStartDayIndex && asOfDayIndex <= yearEndDayIndex;

  const employees = await context.dataAccess.employees.list({
    organizationId,
    active: true
  });

  const potentialTargets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }> = [];

  if (policyRules.annualLeavePromotionEnabled) {
    for (const employee of employees) {
      const balance = await context.dataAccess.leaveBalance.ensure(
        employee.id,
        policyRules.annualGrantDays
      );
      if (balance.remainingDays < policyRules.annualLeavePromotionThresholdDays) {
        continue;
      }
      potentialTargets.push({
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        remainingDays: roundTo2(balance.remainingDays),
        grantedDays: roundTo2(balance.grantedDays),
        usedDays: roundTo2(balance.usedDays),
        lastAccrualYear: balance.lastAccrualYear,
        eligibleNow: noticeWindowOpen
      });
    }
  }

  potentialTargets.sort((left, right) => {
    if (right.remainingDays !== left.remainingDays) {
      return right.remainingDays - left.remainingDays;
    }
    return left.employeeId.localeCompare(right.employeeId);
  });

  const displayTargets = potentialTargets.filter((target) => {
    if (target.eligibleNow) {
      return true;
    }
    return Boolean(input.includeUpcoming);
  });

  const eligibleNowCount = potentialTargets.filter((target) => target.eligibleNow).length;
  const seoulYear = new Date(asOf.getTime() + SEOUL_OFFSET_MS).getUTCFullYear();
  const announcementBody = renderPromotionMessageTemplate(
    policyRules.annualLeavePromotionMessageTemplate,
    {
      organizationId,
      year: seoulYear,
      thresholdDays: policyRules.annualLeavePromotionThresholdDays,
      targetCount: displayTargets.length,
      potentialTargetCount: potentialTargets.length,
      eligibleNowCount,
      noticeWindowStart: formatSeoulDay(noticeWindowStart),
      noticeWindowEnd: formatSeoulDay(noticeWindowEnd)
    }
  );

  await context.dataAccess.audit.append({
    action: "leave.promotion_preview_read",
    entityType: "LeavePolicy",
    entityId: stored?.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      asOf: asOf.toISOString(),
      includeUpcoming: Boolean(input.includeUpcoming),
      noticeWindowOpen,
      potentialTargetCount: potentialTargets.length,
      displayTargetCount: displayTargets.length
    }
  });

  return {
    organizationId,
    asOf: asOf.toISOString(),
    policy: {
      enabled: policyRules.annualLeavePromotionEnabled,
      thresholdDays: policyRules.annualLeavePromotionThresholdDays,
      leadDays: policyRules.annualLeavePromotionLeadDays,
      messageTemplate: policyRules.annualLeavePromotionMessageTemplate,
      source: stored ? "configured" : "default",
      updatedAt: stored?.updatedAt.toISOString() ?? null
    },
    noticeWindow: {
      startAt: noticeWindowStart.toISOString(),
      endAt: noticeWindowEnd.toISOString(),
      isOpen: noticeWindowOpen
    },
    summary: {
      activeEmployeeCount: employees.length,
      potentialTargetCount: potentialTargets.length,
      displayTargetCount: displayTargets.length,
      eligibleNowCount
    },
    targets: displayTargets,
    announcementDraft: {
      title: `Annual leave promotion notice (${seoulYear})`,
      body: announcementBody
    }
  };
}

export async function dispatchAnnualLeavePromotionNoticeImpl(
  context: ServiceContext,
  input: DispatchAnnualLeavePromotionNoticeInput
): Promise<{
  organizationId: string;
  asOf: string;
  policy: {
    enabled: boolean;
    thresholdDays: number;
    leadDays: number;
    messageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    activeEmployeeCount: number;
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
    sentTargetCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
  delivery: {
    deliveryId: string;
    status: "dry_run" | "skipped_no_targets" | "dispatched";
    attempted: boolean;
    dryRun: boolean;
    channel: "webhook" | "email_template";
    provider: PromotionDeliveryProvider | null;
    webhookSource: string | null;
    webhookConfigured: boolean;
    emailTemplateSource: string | null;
    emailTemplateConfigured: boolean;
    emailTemplateId: string | null;
    recipientCount: number;
    missingEmailCount: number;
    dispatchedAt: string | null;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave promotion notice dispatch requires permission"
  );

  const preview = await previewAnnualLeavePromotionImpl(context, {
    organizationId: input.organizationId,
    asOf: input.asOf,
    includeUpcoming: input.includeUpcoming
  });

  const dryRun = input.dryRun ?? false;
  const includeUpcoming = Boolean(input.includeUpcoming);
  const channel = input.deliveryChannel ?? "webhook";
  const requestedTemplateId = input.emailTemplateId?.trim() || "";
  const configuredTemplateId = (process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID ?? "").trim();
  const emailTemplateId = requestedTemplateId || configuredTemplateId || null;
  const targetSnapshots = toPromotionTargetSnapshots(preview.targets);
  const recipientStats = resolvePromotionRecipientStats(targetSnapshots);
  const targetCount = recipientStats.targetCount;
  const recipients = recipientStats.recipients;
  const recipientCount = recipientStats.recipientCount;
  const missingEmailCount = recipientStats.missingEmailCount;
  const organization = await context.dataAccess.organizations.findById(preview.organizationId);
  const webhook =
    channel === "webhook"
      ? resolvePromotionWebhookConfig(
          organization
            ? resolveOperatorAlertWebhookConfig({
                organization,
                flow: "leavePromotion"
              })
            : null
        )
      : null;
  const emailTemplateConfig =
    channel === "email_template" ? resolvePromotionEmailTemplateConfig() : null;
  const attempted = !dryRun && (channel === "webhook" ? targetCount > 0 : recipientCount > 0);

  const provider: PromotionDeliveryProvider | null =
    channel === "webhook"
      ? webhook?.provider ?? null
      : emailTemplateConfig
        ? "email_template"
        : null;

  if (channel === "email_template" && attempted && !emailTemplateId) {
    await recordPromotionDispatchFailure({
      dataAccess: context.dataAccess,
      actor,
      preview,
      includeUpcoming,
      dryRun,
      channel,
      provider,
      targetSnapshots,
      targetCount,
      recipientCount,
      missingEmailCount,
      attempted,
      emailTemplateId,
      webhookSource: null,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
      reason: "email_template_id_missing",
      failureMessage: "email_template_id_missing"
    });
    throw new ServiceError(
      400,
      "emailTemplateId is required for deliveryChannel=email_template (or set FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID)"
    );
  }

  if (channel === "webhook" && attempted && !webhook) {
    await recordPromotionDispatchFailure({
      dataAccess: context.dataAccess,
      actor,
      preview,
      includeUpcoming,
      dryRun,
      channel,
      provider,
      targetSnapshots,
      targetCount,
      recipientCount,
      missingEmailCount,
      attempted,
      emailTemplateId,
      webhookSource: null,
      emailTemplateSource: null,
      reason: "webhook_not_configured",
      failureMessage: "webhook_not_configured"
    });
    throw new ServiceError(
      503,
      "leave promotion webhook is not configured (save an operator alert webhook in admin settings or configure the FLOWHR_LEAVE_PROMOTION_* / FLOWHR_ALERT_* env fallback)"
    );
  }

  if (channel === "email_template" && attempted && !emailTemplateConfig) {
    await recordPromotionDispatchFailure({
      dataAccess: context.dataAccess,
      actor,
      preview,
      includeUpcoming,
      dryRun,
      channel,
      provider,
      targetSnapshots,
      targetCount,
      recipientCount,
      missingEmailCount,
      attempted,
      emailTemplateId,
      webhookSource: null,
      emailTemplateSource: null,
      reason: "email_template_not_configured",
      failureMessage: "email_template_not_configured"
    });
    throw new ServiceError(
      503,
      "leave promotion email template dispatch is not configured (set FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL and FLOWHR_LEAVE_PROMOTION_EMAIL_FROM)"
    );
  }

  const message = buildPromotionNoticeMessage({
    organizationId: preview.organizationId,
    asOf: preview.asOf,
    includeUpcoming,
    dryRun,
    noticeWindow: preview.noticeWindow,
    summary: preview.summary,
    targets: preview.targets,
    announcementDraft: preview.announcementDraft
  });

  let status: "dry_run" | "skipped_no_targets" | "dispatched" = "dry_run";
  let dispatchedAt: string | null = null;

  if (attempted) {
    try {
      if (channel === "webhook" && webhook) {
        await sendPromotionWebhook(webhook, message);
      } else if (channel === "email_template" && emailTemplateConfig && emailTemplateId) {
        await sendPromotionEmailTemplate(emailTemplateConfig, {
          templateId: emailTemplateId,
          from: emailTemplateConfig.from,
          subject: preview.announcementDraft.title,
          body: preview.announcementDraft.body,
          organizationId: preview.organizationId,
          asOf: preview.asOf,
          includeUpcoming,
          noticeWindow: preview.noticeWindow,
          summary: preview.summary,
          recipients
        });
      }
      status = "dispatched";
      dispatchedAt = new Date().toISOString();
    } catch (error) {
      await recordPromotionDispatchFailure({
        dataAccess: context.dataAccess,
        actor,
        preview,
        includeUpcoming,
        dryRun,
        channel,
        provider,
        targetSnapshots,
        targetCount,
        recipientCount,
        missingEmailCount,
        attempted,
        emailTemplateId,
        webhookSource: webhook?.source ?? null,
        emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
        reason: "dispatch_request_failed",
        failureMessage: error instanceof Error ? error.message : "unknown error"
      });
      if (channel === "webhook") {
        throw new ServiceError(502, "leave promotion webhook request failed");
      }
      throw new ServiceError(502, "leave promotion email template request failed");
    }
  } else if (!dryRun) {
    status = "skipped_no_targets";
  }

  const sentTargetCount =
    status === "dispatched" ? (channel === "webhook" ? targetCount : recipientCount) : 0;
  const persisted = await persistPromotionDeliveryHistory(context.dataAccess.leavePromotionDeliveries, {
    organizationId: preview.organizationId,
    asOf: preview.asOf,
    includeUpcoming,
    dryRun,
    channel,
    provider,
    status,
    announcementTitle: preview.announcementDraft.title,
    announcementBody: preview.announcementDraft.body,
    targets: targetSnapshots,
    sentTargetCount,
    webhookSource: webhook?.source ?? null,
    emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
    emailTemplateId,
    dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : null,
    actorRole: actor.role,
    actorId: actor.id,
    attempted
  });
  const action =
    status === "dispatched"
      ? "leave.promotion_notice.dispatched"
      : status === "skipped_no_targets"
        ? "leave.promotion_notice.skipped"
        : "leave.promotion_notice.dry_run";

  await context.dataAccess.audit.append({
    action,
    entityType: "LeavePolicy",
    organizationId: preview.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      asOf: preview.asOf,
      includeUpcoming,
      dryRun,
      targetCount,
      recipientCount,
      missingEmailCount,
      sentTargetCount,
      status,
      channel,
      provider,
      webhookSource: webhook?.source ?? null,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
      emailTemplateId
    }
  });

  if (status === "dispatched" && dispatchedAt) {
    try {
      await getEventPublisher(context).publish({
        name: "leave.promotion.notice.dispatched.v1",
        occurredAt: dispatchedAt,
        entityType: "LeavePolicy",
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          organizationId: preview.organizationId,
          deliveryId: persisted.deliveryId,
          asOf: preview.asOf,
          includeUpcoming,
          targetCount,
          recipientCount,
          missingEmailCount,
          channel,
          provider,
          webhookSource: webhook?.source ?? null,
          emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
          emailTemplateId,
          announcementTitle: preview.announcementDraft.title,
          noticeWindow: preview.noticeWindow,
          targetEmployeeIds:
            channel === "webhook"
              ? preview.targets.slice(0, 100).map((target) => target.employeeId)
              : recipients.slice(0, 100).map((target) => target.employeeId)
        }
      });
    } catch (error) {
      try {
        await context.dataAccess.audit.append({
          action: "leave.promotion_notice.event_publish_failed",
          entityType: "LeavePolicy",
          organizationId: preview.organizationId,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            asOf: preview.asOf,
            includeUpcoming,
            dispatchedAt,
            targetCount,
            recipientCount,
            missingEmailCount,
            channel,
            provider,
            webhookSource: webhook?.source ?? null,
            emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
            emailTemplateId,
            error: error instanceof Error ? error.message : "unknown error"
          }
        });
      } catch {
        // Non-blocking failure path: dispatch already completed.
      }
    }
  }

  return {
    organizationId: preview.organizationId,
    asOf: preview.asOf,
    policy: preview.policy,
    noticeWindow: preview.noticeWindow,
    summary: {
      activeEmployeeCount: preview.summary.activeEmployeeCount,
      potentialTargetCount: preview.summary.potentialTargetCount,
      displayTargetCount: preview.summary.displayTargetCount,
      eligibleNowCount: preview.summary.eligibleNowCount,
      sentTargetCount
    },
    targets: preview.targets,
    announcementDraft: preview.announcementDraft,
    delivery: {
      deliveryId: persisted.deliveryId,
      status,
      attempted,
      dryRun,
      channel,
      provider,
      webhookSource: webhook?.source ?? null,
      webhookConfigured: webhook !== null,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
      emailTemplateConfigured: emailTemplateConfig !== null,
      emailTemplateId,
      recipientCount,
      missingEmailCount,
      dispatchedAt
    }
  };
}

export async function listLeavePromotionDeliveriesImpl(
  context: ServiceContext,
  input: ListLeavePromotionDeliveriesInput
): Promise<{
  organizationId: string;
  deliveries: PromotionDeliverySummaryView[];
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave promotion delivery history list requires permission"
  );

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  if (input.limit !== undefined) {
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 200) {
      throw new ServiceError(400, "limit must be an integer between 1 and 200");
    }
  }

  const deliveries = await context.dataAccess.leavePromotionDeliveries.list({
    organizationId,
    channel: input.channel,
    status: input.status,
    retryOfDeliveryId: input.retryOfDeliveryId,
    limit: input.limit
  });

  await context.dataAccess.audit.append({
    action: "leave.promotion_delivery.list_read",
    entityType: "LeavePromotionDelivery",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      channel: input.channel ?? null,
      status: input.status ?? null,
      retryOfDeliveryId: input.retryOfDeliveryId ?? null,
      limit: input.limit ?? null,
      resultCount: deliveries.length
    }
  });

  return {
    organizationId,
    deliveries: deliveries.map(toPromotionDeliverySummaryView)
  };
}

export async function readLeavePromotionDeliveryImpl(
  context: ServiceContext,
  input: ReadLeavePromotionDeliveryInput
): Promise<{
  delivery: PromotionDeliverySummaryView & {
    announcementTitle: string;
    announcementBody: string;
  };
  recipients: PromotionDeliveryRecipientView[];
  sourceDelivery: PromotionDeliverySummaryView | null;
  retries: PromotionDeliverySummaryView[];
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave promotion delivery history detail requires permission"
  );

  const deliveryId = input.deliveryId.trim();
  if (!deliveryId) {
    throw new ServiceError(400, "deliveryId is required");
  }

  const delivery = await context.dataAccess.leavePromotionDeliveries.findById(deliveryId);
  if (!delivery) {
    throw new ServiceError(404, "leave promotion delivery not found");
  }
  if (input.organizationId && input.organizationId !== delivery.organizationId) {
    throw new ServiceError(404, "leave promotion delivery not found");
  }
  ensureTenantAccess(actor, delivery.organizationId);

  const recipients = await context.dataAccess.leavePromotionDeliveries.listRecipients({
    deliveryId: delivery.id
  });
  const retries = await context.dataAccess.leavePromotionDeliveries.list({
    organizationId: delivery.organizationId,
    retryOfDeliveryId: delivery.id,
    limit: 200
  });
  const sourceDelivery =
    delivery.retryOfDeliveryId === null
      ? null
      : await context.dataAccess.leavePromotionDeliveries.findById(delivery.retryOfDeliveryId);

  await context.dataAccess.audit.append({
    action: "leave.promotion_delivery.read",
    entityType: "LeavePromotionDelivery",
    entityId: delivery.id,
    organizationId: delivery.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      recipientCount: recipients.length,
      retryCount: retries.length,
      sourceDeliveryId: sourceDelivery?.id ?? null
    }
  });

  return {
    delivery: {
      ...toPromotionDeliverySummaryView(delivery),
      announcementTitle: delivery.announcementTitle,
      announcementBody: delivery.announcementBody
    },
    recipients: recipients.map(toPromotionDeliveryRecipientView),
    sourceDelivery: sourceDelivery ? toPromotionDeliverySummaryView(sourceDelivery) : null,
    retries: retries.map(toPromotionDeliverySummaryView)
  };
}

export async function retryLeavePromotionDeliveryImpl(
  context: ServiceContext,
  input: RetryLeavePromotionDeliveryInput
): Promise<{
  sourceDeliveryId: string;
  delivery: PromotionDeliverySummaryView & {
    attempted: boolean;
    emailTemplateConfigured: boolean;
  };
  recipients: PromotionDeliveryRecipientView[];
  retries: PromotionDeliverySummaryView[];
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave promotion delivery retry requires permission"
  );

  const deliveryId = input.deliveryId.trim();
  if (!deliveryId) {
    throw new ServiceError(400, "deliveryId is required");
  }

  const sourceDelivery = await context.dataAccess.leavePromotionDeliveries.findById(deliveryId);
  if (!sourceDelivery) {
    throw new ServiceError(404, "leave promotion delivery not found");
  }
  if (input.organizationId && input.organizationId !== sourceDelivery.organizationId) {
    throw new ServiceError(404, "leave promotion delivery not found");
  }
  ensureTenantAccess(actor, sourceDelivery.organizationId);

  if (sourceDelivery.channel !== "email_template") {
    throw new ServiceError(409, "retry is supported only for email-template promotion deliveries");
  }

  const sourceRecipients = await context.dataAccess.leavePromotionDeliveries.listRecipients({
    deliveryId: sourceDelivery.id
  });
  if (sourceRecipients.length === 0) {
    throw new ServiceError(409, "source delivery has no recipient snapshots");
  }

  const sourceRecipientsByEmployeeId = new Map<string, LeavePromotionDeliveryRecipientEntity>();
  for (const recipient of sourceRecipients) {
    sourceRecipientsByEmployeeId.set(recipient.employeeId, recipient);
  }
  const requestedEmployeeIds = normalizeRecipientEmployeeIds(input.recipientEmployeeIds);
  if (requestedEmployeeIds.length > 0) {
    const unknownEmployeeIds = requestedEmployeeIds.filter(
      (employeeId) => !sourceRecipientsByEmployeeId.has(employeeId)
    );
    if (unknownEmployeeIds.length > 0) {
      throw new ServiceError(400, "recipientEmployeeIds include unknown employee(s)", {
        unknownEmployeeIds
      });
    }
  }

  const selectedRecipients =
    requestedEmployeeIds.length > 0
      ? requestedEmployeeIds.flatMap((employeeId) => {
          const recipient = sourceRecipientsByEmployeeId.get(employeeId);
          return recipient ? [recipient] : [];
        })
      : sourceRecipients.filter((recipient) => recipient.status === "FAILED");
  const selectedTargets = toPromotionTargetSnapshotsFromRecipients(selectedRecipients);
  const selectedRecipientStats = resolvePromotionRecipientStats(selectedTargets);
  const dispatchRecipients = selectedRecipientStats.recipients;
  const selectedTargetCount = selectedRecipientStats.targetCount;
  const recipientCount = selectedRecipientStats.recipientCount;
  const missingEmailCount = selectedRecipientStats.missingEmailCount;

  const dryRun = input.dryRun ?? false;
  const attempted = !dryRun && recipientCount > 0;
  const requestedTemplateId = input.emailTemplateId?.trim() || "";
  const sourceTemplateId = sourceDelivery.emailTemplateId?.trim() || "";
  const configuredTemplateId = (process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID ?? "").trim();
  const emailTemplateId = requestedTemplateId || sourceTemplateId || configuredTemplateId || null;
  const emailTemplateConfig = resolvePromotionEmailTemplateConfig();
  const provider: PromotionDeliveryProvider | null = emailTemplateConfig ? "email_template" : null;
  const retryCountByEmployeeId = toRetryCountByEmployeeId(sourceRecipients);

  const persistBase = {
    organizationId: sourceDelivery.organizationId,
    asOf: sourceDelivery.asOf.toISOString(),
    includeUpcoming: sourceDelivery.includeUpcoming,
    dryRun,
    channel: "email_template" as const,
    provider,
    announcementTitle: sourceDelivery.announcementTitle,
    announcementBody: sourceDelivery.announcementBody,
    targets: selectedTargets,
    webhookSource: null,
    emailTemplateSource: emailTemplateConfig?.urlSource ?? sourceDelivery.emailTemplateSource,
    emailTemplateId,
    actorRole: actor.role,
    actorId: actor.id,
    retryOfDeliveryId: sourceDelivery.id,
    retryCountByEmployeeId,
    attempted
  };

  if (attempted && !emailTemplateId) {
    await persistPromotionDeliveryHistory(context.dataAccess.leavePromotionDeliveries, {
      ...persistBase,
      status: "failed",
      sentTargetCount: 0,
      dispatchedAt: null,
      failureMessage: "email_template_id_missing"
    });
    await context.dataAccess.audit.append({
      action: "leave.promotion_notice.retry_failed",
      entityType: "LeavePromotionDelivery",
      entityId: sourceDelivery.id,
      organizationId: sourceDelivery.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        reason: "email_template_id_missing",
        requestedEmployeeIds,
        selectedTargetCount,
        recipientCount,
        missingEmailCount
      }
    });
    throw new ServiceError(
      400,
      "emailTemplateId is required for retry (request body, source delivery, or FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID)"
    );
  }

  if (attempted && !emailTemplateConfig) {
    await persistPromotionDeliveryHistory(context.dataAccess.leavePromotionDeliveries, {
      ...persistBase,
      status: "failed",
      sentTargetCount: 0,
      dispatchedAt: null,
      failureMessage: "email_template_not_configured"
    });
    await context.dataAccess.audit.append({
      action: "leave.promotion_notice.retry_failed",
      entityType: "LeavePromotionDelivery",
      entityId: sourceDelivery.id,
      organizationId: sourceDelivery.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        reason: "email_template_not_configured",
        requestedEmployeeIds,
        selectedTargetCount,
        recipientCount,
        missingEmailCount
      }
    });
    throw new ServiceError(
      503,
      "leave promotion email template retry is not configured (set FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL and FLOWHR_LEAVE_PROMOTION_EMAIL_FROM)"
    );
  }

  let status: PromotionDeliveryStatus = "dry_run";
  let dispatchedAt: string | null = null;

  if (attempted && emailTemplateConfig && emailTemplateId) {
    try {
      await sendPromotionEmailTemplate(emailTemplateConfig, {
        templateId: emailTemplateId,
        from: emailTemplateConfig.from,
        subject: sourceDelivery.announcementTitle,
        body: sourceDelivery.announcementBody,
        organizationId: sourceDelivery.organizationId,
        asOf: sourceDelivery.asOf.toISOString(),
        includeUpcoming: sourceDelivery.includeUpcoming,
        recipients: dispatchRecipients
      });
      status = "dispatched";
      dispatchedAt = new Date().toISOString();
    } catch (error) {
      await context.dataAccess.audit.append({
        action: "leave.promotion_notice.retry_failed",
        entityType: "LeavePromotionDelivery",
        entityId: sourceDelivery.id,
        organizationId: sourceDelivery.organizationId,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          reason: "email_template_request_failed",
          requestedEmployeeIds,
          selectedTargetCount,
          recipientCount,
          missingEmailCount,
          emailTemplateSource: emailTemplateConfig.urlSource,
          emailTemplateId,
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
      await persistPromotionDeliveryHistory(context.dataAccess.leavePromotionDeliveries, {
        ...persistBase,
        status: "failed",
        sentTargetCount: 0,
        dispatchedAt: null,
        failureMessage: error instanceof Error ? error.message : "unknown error"
      });
      throw new ServiceError(502, "leave promotion email template retry request failed");
    }
  } else if (!dryRun) {
    status = "skipped_no_targets";
  }

  const sentTargetCount = status === "dispatched" ? recipientCount : 0;
  const persisted = await persistPromotionDeliveryHistory(context.dataAccess.leavePromotionDeliveries, {
    ...persistBase,
    status,
    sentTargetCount,
    dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : null
  });

  const action =
    status === "dispatched"
      ? "leave.promotion_notice.retry_dispatched"
      : status === "skipped_no_targets"
        ? "leave.promotion_notice.retry_skipped"
        : "leave.promotion_notice.retry_dry_run";
  await context.dataAccess.audit.append({
    action,
    entityType: "LeavePromotionDelivery",
    entityId: persisted.deliveryId,
    organizationId: sourceDelivery.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      sourceDeliveryId: sourceDelivery.id,
      requestedEmployeeIds,
      selectedTargetCount,
      recipientCount,
      missingEmailCount,
      sentTargetCount,
      status,
      dryRun,
      attempted,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? sourceDelivery.emailTemplateSource,
      emailTemplateId
    }
  });

  if (status === "dispatched" && dispatchedAt) {
    try {
      await getEventPublisher(context).publish({
        name: "leave.promotion.notice.dispatched.v1",
        occurredAt: dispatchedAt,
        entityType: "LeavePromotionDelivery",
        entityId: persisted.deliveryId,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          organizationId: sourceDelivery.organizationId,
          deliveryId: persisted.deliveryId,
          retryOfDeliveryId: sourceDelivery.id,
          asOf: sourceDelivery.asOf.toISOString(),
          includeUpcoming: sourceDelivery.includeUpcoming,
          targetCount: selectedTargetCount,
          recipientCount,
          missingEmailCount,
          channel: "email_template",
          provider,
          emailTemplateSource: emailTemplateConfig?.urlSource ?? sourceDelivery.emailTemplateSource,
          emailTemplateId,
          announcementTitle: sourceDelivery.announcementTitle,
          targetEmployeeIds: dispatchRecipients.slice(0, 100).map((recipient) => recipient.employeeId)
        }
      });
    } catch (error) {
      try {
        await context.dataAccess.audit.append({
          action: "leave.promotion_notice.retry_event_publish_failed",
          entityType: "LeavePromotionDelivery",
          entityId: persisted.deliveryId,
          organizationId: sourceDelivery.organizationId,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            sourceDeliveryId: sourceDelivery.id,
            dispatchedAt,
            error: error instanceof Error ? error.message : "unknown error"
          }
        });
      } catch {
        // Non-blocking failure path: retry dispatch already completed.
      }
    }
  }

  const persistedDelivery = await context.dataAccess.leavePromotionDeliveries.findById(persisted.deliveryId);
  if (!persistedDelivery) {
    throw new ServiceError(500, "retry delivery history persistence failed");
  }
  const persistedRecipients = await context.dataAccess.leavePromotionDeliveries.listRecipients({
    deliveryId: persisted.deliveryId
  });
  const retries = await context.dataAccess.leavePromotionDeliveries.list({
    organizationId: sourceDelivery.organizationId,
    retryOfDeliveryId: sourceDelivery.id,
    limit: 200
  });

  return {
    sourceDeliveryId: sourceDelivery.id,
    delivery: {
      ...toPromotionDeliverySummaryView(persistedDelivery),
      attempted,
      emailTemplateConfigured: emailTemplateConfig !== null
    },
    recipients: persistedRecipients.map(toPromotionDeliveryRecipientView),
    retries: retries.map(toPromotionDeliverySummaryView)
  };
}


