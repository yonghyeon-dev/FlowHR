import { Permissions } from "@/lib/rbac";
import {
  toKrwInteger,
  toRateNumber
} from "@/features/payroll/service-runtime-helpers";
import type { UpsertDeductionProfileInput } from "@/features/payroll/service-input-types";
import type {
  ListDeductionProfilesInput,
  UpsertDeductionProfileResult
} from "@/features/payroll/service-output-types";
import {
  type ServiceContext,
  getEventPublisher,
  requireDeductionProfilePermission
} from "@/features/payroll/service-context-helpers";
import type { DeductionProfileEntity } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import {
  ensureTenantMatch,
  resolveTenantScope
} from "@/features/shared/tenant-scope";

export async function readDeductionProfileFromHelper(
  context: ServiceContext,
  profileId: string
): Promise<DeductionProfileEntity> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  if (!profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const profile = await context.dataAccess.deductionProfiles.findById(profileId);
  if (!profile) {
    throw new ServiceError(404, "deduction profile not found");
  }
  ensureTenantMatch(tenantScope, profile.organizationId, "deduction profile not found");

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.read",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });

  return profile;
}

export async function upsertDeductionProfileFromHelper(
  context: ServiceContext,
  input: UpsertDeductionProfileInput
): Promise<UpsertDeductionProfileResult> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileWrite, "write");
  if (!input.profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }
  if (!input.name.trim()) {
    throw new ServiceError(400, "name is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const withholdingRate = toRateNumber(input.withholdingRate, "withholdingRate");
  const socialInsuranceRate = toRateNumber(input.socialInsuranceRate, "socialInsuranceRate");
  const fixedOtherDeductionKrw = toKrwInteger(
    input.fixedOtherDeductionKrw,
    "fixedOtherDeductionKrw"
  );

  const profile = await context.dataAccess.deductionProfiles.upsert({
    id: input.profileId,
    organizationId: tenantScope ?? null,
    name: input.name,
    mode: input.mode,
    withholdingRate,
    socialInsuranceRate,
    fixedOtherDeductionKrw,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.updated",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.deduction_profile.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "DeductionProfile",
    entityId: profile.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      organizationId: profile.organizationId,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  return { profile };
}

export async function listDeductionProfilesFromHelper(
  context: ServiceContext,
  input: ListDeductionProfilesInput
): Promise<DeductionProfileEntity[]> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  const tenantScope = resolveTenantScope(context.actor);
  return await context.dataAccess.deductionProfiles.list({
    organizationId: tenantScope ?? undefined,
    active: input.active,
    mode: input.mode
  });
}
