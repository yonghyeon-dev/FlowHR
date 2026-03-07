import type { DataAccess, OrganizationEntity } from "@/features/shared/data-access";

type EnsureOrganizationRecordInput = {
  dataAccess: DataAccess;
  organizationId: string;
  organizationName?: string | null;
  email?: string | null;
};

function readTrimmedString(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function resolveRecoveredOrganizationName(input: {
  organizationName?: string | null;
  email?: string | null;
  organizationId?: string | null;
}) {
  const explicitName = readTrimmedString(input.organizationName);
  if (explicitName) {
    return explicitName;
  }

  const email = readTrimmedString(input.email);
  if (email) {
    const [, domain = ""] = email.split("@");
    const normalizedDomain = domain.trim();
    if (normalizedDomain) {
      return normalizedDomain;
    }

    const [localPart = ""] = email.split("@");
    const normalizedLocalPart = localPart.trim();
    if (normalizedLocalPart) {
      return `${normalizedLocalPart} organization`;
    }
  }

  const organizationId = readTrimmedString(input.organizationId);
  if (organizationId) {
    return `Organization ${organizationId.slice(-8)}`;
  }

  return "Organization";
}

export async function ensureOrganizationRecord(
  input: EnsureOrganizationRecordInput
): Promise<OrganizationEntity> {
  const organizationId = input.organizationId.trim();
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const existing = await input.dataAccess.organizations.findById(organizationId);
  if (existing) {
    return existing;
  }

  return input.dataAccess.organizations.create({
    id: organizationId,
    name: resolveRecoveredOrganizationName({
      organizationName: input.organizationName,
      email: input.email,
      organizationId
    })
  });
}
