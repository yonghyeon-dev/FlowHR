import type {
  CreateInAppNotificationInput,
  DataAccess,
  InAppNotificationEntity
} from "@/features/shared/data-access";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationPayload = {
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  discord?: {
    embedTitle: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  };
};

type DispatchContext = {
  dataAccess: DataAccess;
};

type DispatchResult = {
  inApp: InAppNotificationEntity;
  discordSent: boolean;
};

// ---------------------------------------------------------------------------
// Discord webhook helper (fire-and-forget, never throws)
// ---------------------------------------------------------------------------

function resolveDiscordWebhook(): string | null {
  return (
    process.env.FLOWHR_DISCORD_NOTIFICATION_WEBHOOK?.trim() ||
    process.env.FLOWHR_ALERT_DISCORD_WEBHOOK?.trim() ||
    null
  );
}

async function postDiscordEmbed(payload: NotificationPayload): Promise<boolean> {
  const webhookUrl = resolveDiscordWebhook();
  if (!webhookUrl) return false;

  const discord = payload.discord;
  const body = discord
    ? {
        embeds: [
          {
            title: discord.embedTitle,
            description: payload.body,
            color: discord.color ?? 3447003,
            ...(discord.fields?.length ? { fields: discord.fields } : {}),
            footer: {
              text: `FlowHR | ${new Date().toISOString().slice(0, 16).replace("T", " ")}`
            }
          }
        ]
      }
    : { content: `**${payload.title}**\n${payload.body}` };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core dispatcher
// ---------------------------------------------------------------------------

export async function dispatchNotification(
  context: DispatchContext,
  payload: NotificationPayload
): Promise<DispatchResult> {
  const input: CreateInAppNotificationInput = {
    organizationId: payload.organizationId,
    recipientId: payload.recipientId,
    type: payload.type,
    title: payload.title,
    body: payload.body
  };

  const inApp = await context.dataAccess.inAppNotifications.create(input);
  const discordSent = await postDiscordEmbed(payload);

  return { inApp, discordSent };
}

// ---------------------------------------------------------------------------
// Domain-specific helpers
// ---------------------------------------------------------------------------

export async function notifyLeaveRequested(
  context: DispatchContext,
  opts: {
    organizationId: string;
    approverEmployeeId: string;
    requesterName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.approverEmployeeId,
    type: "LEAVE_REQUESTED",
    title: "휴가 신청",
    body: `${opts.requesterName}님이 ${opts.leaveType} 휴가를 신청했습니다. (${opts.startDate} ~ ${opts.endDate})`
  });
}

export async function notifyLeaveApproved(
  context: DispatchContext,
  opts: {
    organizationId: string;
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.employeeId,
    type: "LEAVE_APPROVED",
    title: "휴가 승인",
    body: `${opts.leaveType} 휴가가 승인되었습니다. (${opts.startDate} ~ ${opts.endDate})`
  });
}

export async function notifyLeaveRejected(
  context: DispatchContext,
  opts: {
    organizationId: string;
    employeeId: string;
    leaveType: string;
    reason: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.employeeId,
    type: "LEAVE_REJECTED",
    title: "휴가 반려",
    body: `${opts.leaveType} 휴가가 반려되었습니다. 사유: ${opts.reason}`
  });
}

export async function notifyAttendanceApproved(
  context: DispatchContext,
  opts: {
    organizationId: string;
    employeeId: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.employeeId,
    type: "ATTENDANCE_APPROVED",
    title: "근태 승인",
    body: "근태 기록이 승인되었습니다."
  });
}

export async function notifyAttendanceRejected(
  context: DispatchContext,
  opts: {
    organizationId: string;
    employeeId: string;
    reason: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.employeeId,
    type: "ATTENDANCE_REJECTED",
    title: "근태 반려",
    body: `근태 기록이 반려되었습니다. 사유: ${opts.reason}`
  });
}

export async function notifyPayslipReady(
  context: DispatchContext,
  opts: {
    organizationId: string;
    employeeId: string;
    periodLabel: string;
  }
): Promise<DispatchResult> {
  return dispatchNotification(context, {
    organizationId: opts.organizationId,
    recipientId: opts.employeeId,
    type: "PAYSLIP_READY",
    title: "급여명세서 도착",
    body: `${opts.periodLabel} 급여명세서가 발행되었습니다.`
  });
}
