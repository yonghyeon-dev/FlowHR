import type { EmployeeEntity, OrganizationEntity, UpdateEmployeeInput, UpdateOrganizationInput } from "@/features/shared/data-access";

export type NotificationPreferenceChannels = {
  email: boolean;
  inApp: boolean;
};

export type NotificationPreferenceCategories = {
  leave: boolean;
  attendance: boolean;
  payroll: boolean;
};

export type NotificationPreferenceSnapshot = {
  channels: NotificationPreferenceChannels;
  categories: NotificationPreferenceCategories;
};

export type NotificationPreferenceResponse = NotificationPreferenceSnapshot & {
  defaults: NotificationPreferenceSnapshot;
  hasCustomPreferences: boolean;
  updatedAt: string | null;
};

export function resolveOrganizationNotificationDefaults(
  organization: OrganizationEntity
): NotificationPreferenceSnapshot {
  return {
    channels: {
      email: organization.notificationDefaultEmailEnabled,
      inApp: organization.notificationDefaultInAppEnabled
    },
    categories: {
      leave: organization.notificationDefaultLeaveEnabled,
      attendance: organization.notificationDefaultAttendanceEnabled,
      payroll: organization.notificationDefaultPayrollEnabled
    }
  };
}

export function resolveEmployeeNotificationPreferenceResponse(
  employee: EmployeeEntity,
  organization: OrganizationEntity
): NotificationPreferenceResponse {
  const defaults = resolveOrganizationNotificationDefaults(organization);
  const hasCustomPreferences =
    employee.notificationEmailEnabled !== null ||
    employee.notificationInAppEnabled !== null ||
    employee.notificationLeaveEnabled !== null ||
    employee.notificationAttendanceEnabled !== null ||
    employee.notificationPayrollEnabled !== null;

  return {
    channels: {
      email: employee.notificationEmailEnabled ?? defaults.channels.email,
      inApp: employee.notificationInAppEnabled ?? defaults.channels.inApp
    },
    categories: {
      leave: employee.notificationLeaveEnabled ?? defaults.categories.leave,
      attendance: employee.notificationAttendanceEnabled ?? defaults.categories.attendance,
      payroll: employee.notificationPayrollEnabled ?? defaults.categories.payroll
    },
    defaults,
    hasCustomPreferences,
    updatedAt: hasCustomPreferences ? employee.updatedAt.toISOString() : null
  };
}

export function toOrganizationNotificationDefaultUpdateInput(
  snapshot: NotificationPreferenceSnapshot
): UpdateOrganizationInput {
  return {
    notificationDefaultEmailEnabled: snapshot.channels.email,
    notificationDefaultInAppEnabled: snapshot.channels.inApp,
    notificationDefaultLeaveEnabled: snapshot.categories.leave,
    notificationDefaultAttendanceEnabled: snapshot.categories.attendance,
    notificationDefaultPayrollEnabled: snapshot.categories.payroll
  };
}

export function toEmployeeNotificationPreferenceUpdateInput(
  snapshot: NotificationPreferenceSnapshot
): UpdateEmployeeInput {
  return {
    notificationEmailEnabled: snapshot.channels.email,
    notificationInAppEnabled: snapshot.channels.inApp,
    notificationLeaveEnabled: snapshot.categories.leave,
    notificationAttendanceEnabled: snapshot.categories.attendance,
    notificationPayrollEnabled: snapshot.categories.payroll
  };
}

export function toEmployeeNotificationPreferenceResetInput(): UpdateEmployeeInput {
  return {
    notificationEmailEnabled: null,
    notificationInAppEnabled: null,
    notificationLeaveEnabled: null,
    notificationAttendanceEnabled: null,
    notificationPayrollEnabled: null
  };
}
