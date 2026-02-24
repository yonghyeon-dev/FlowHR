import type { Dispatch, SetStateAction } from "react";

import {
  buildAdminValidationFailureLog,
  createEmployeeFromHelper,
  createInviteFromHelper,
  createOrganizationFromHelper,
  createScheduleFromHelper,
  deleteScheduleFromHelper,
  listEmployeesFromHelper,
  listOrganizationsFromHelper,
  listSchedulesFromHelper,
  type AdminCallApi
} from "@/app/admin/page-action-helpers";
import type {
  ApiLog,
  EmployeeSummary,
  InviteDeliveryMode,
  InviteResultDto,
  InviteRole,
  OrganizationSummary,
  WorkScheduleDto
} from "@/app/admin/page-types";

type StringSetter = Dispatch<SetStateAction<string>>;
type QueryBuilder = (params: Record<string, string | undefined>) => string;

export type BuildAdminDirectoryActionsInput = {
  callApi: AdminCallApi;
  buildQuery: QueryBuilder;
  toIso: (value: string) => string;
  runtimeLocale: string;
  organizationId: string;
  organizationName: string;
  setOrganizationId: StringSetter;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeActive: boolean;
  setEmployeeId: StringSetter;
  setEmployees: Dispatch<SetStateAction<EmployeeSummary[]>>;
  setAccrualEmployeeId: StringSetter;
  setScheduleEmployeeId: StringSetter;
  setInviteActorId: StringSetter;
  inviteEmail: string;
  inviteRole: InviteRole;
  inviteDeliveryMode: InviteDeliveryMode;
  inviteActorId: string;
  setInviteResult: Dispatch<SetStateAction<InviteResultDto | null>>;
  periodStart: string;
  periodEnd: string;
  scheduleEmployeeId: string;
  scheduleStartAt: string;
  scheduleEndAt: string;
  scheduleBreakMinutes: string;
  scheduleIsHoliday: boolean;
  scheduleNotes: string;
  setSchedules: Dispatch<SetStateAction<WorkScheduleDto[]>>;
  setOrganizations: Dispatch<SetStateAction<OrganizationSummary[]>>;
  setLogs: Dispatch<SetStateAction<ApiLog[]>>;
  confirmScheduleDelete: (scheduleId: string) => boolean;
};

export function buildAdminDirectoryActions(input: BuildAdminDirectoryActionsInput) {
  async function listEmployees() {
    const nextEmployees = await listEmployeesFromHelper({
      callApi: input.callApi,
      organizationId: input.organizationId,
      buildQuery: input.buildQuery
    });
    if (!nextEmployees) {
      return;
    }
    input.setEmployees(nextEmployees);
  }

  async function createEmployee() {
    const result = await createEmployeeFromHelper({
      callApi: input.callApi,
      employeeId: input.employeeId,
      organizationId: input.organizationId,
      employeeName: input.employeeName,
      employeeEmail: input.employeeEmail,
      employeeActive: input.employeeActive
    });
    if (!result.ok) {
      return;
    }
    if (result.createdEmployeeId) {
      input.setEmployeeId(result.createdEmployeeId);
      input.setAccrualEmployeeId(result.createdEmployeeId);
      input.setScheduleEmployeeId(result.createdEmployeeId);
      input.setInviteActorId(result.createdEmployeeId);
    }
    await listEmployees();
  }

  async function createInvite() {
    input.setInviteResult(null);
    const nextInviteResult = await createInviteFromHelper({
      callApi: input.callApi,
      inviteEmail: input.inviteEmail,
      inviteRole: input.inviteRole,
      inviteDeliveryMode: input.inviteDeliveryMode,
      organizationId: input.organizationId,
      inviteActorId: input.inviteActorId
    });
    if (nextInviteResult) {
      input.setInviteResult(nextInviteResult);
    }
  }

  async function listSchedules() {
    const nextSchedules = await listSchedulesFromHelper({
      callApi: input.callApi,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      scheduleEmployeeId: input.scheduleEmployeeId,
      toIso: input.toIso,
      buildQuery: input.buildQuery
    });
    if (!nextSchedules) {
      return;
    }
    input.setSchedules(nextSchedules);
  }

  async function createSchedule() {
    const created = await createScheduleFromHelper({
      callApi: input.callApi,
      scheduleEmployeeId: input.scheduleEmployeeId,
      scheduleStartAt: input.scheduleStartAt,
      scheduleEndAt: input.scheduleEndAt,
      scheduleBreakMinutes: input.scheduleBreakMinutes,
      scheduleIsHoliday: input.scheduleIsHoliday,
      scheduleNotes: input.scheduleNotes,
      toIso: input.toIso
    });
    if (!created) {
      return;
    }
    await listSchedules();
  }

  async function deleteSchedule(scheduleId: string) {
    const trimmedId = scheduleId.trim();
    if (!trimmedId) {
      return;
    }
    const okToDelete = input.confirmScheduleDelete(trimmedId);
    if (!okToDelete) {
      return;
    }

    const deleted = await deleteScheduleFromHelper({
      callApi: input.callApi,
      scheduleId: trimmedId
    });
    if (!deleted) {
      return;
    }
    input.setSchedules((prev) => prev.filter((item) => item.id !== trimmedId));
  }

  async function listOrganizations() {
    const nextOrganizations = await listOrganizationsFromHelper({
      callApi: input.callApi
    });
    if (!nextOrganizations) {
      return;
    }
    input.setOrganizations(nextOrganizations);
  }

  async function createOrganization() {
    const name = input.organizationName.trim();
    if (!name) {
      input.setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "조직 생성",
          error: "조직 이름이 필요합니다.",
          runtimeLocale: input.runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    const createdId = await createOrganizationFromHelper({
      callApi: input.callApi,
      organizationName: input.organizationName
    });
    if (createdId) {
      input.setOrganizationId(createdId);
    }
    await listOrganizations();
  }

  return {
    listEmployees,
    createEmployee,
    createInvite,
    listSchedules,
    createSchedule,
    deleteSchedule,
    listOrganizations,
    createOrganization
  };
}
