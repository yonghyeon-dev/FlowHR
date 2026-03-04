import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

import { Permissions, defaultRolePermissions } from "../src/lib/rbac";

export const DEFAULT_SEED_ORGANIZATION_ID = "org_flowhr_demo";
export const DEFAULT_SEED_ORGANIZATION_NAME = "FlowHR Demo Org (for development)";

export type SeedOrganizationRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SeedRoleRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SeedRoleDefinition = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

type SeedOrganizationUpsertInput = {
  id: string;
  name: string;
  isOnboardingComplete: boolean;
};

type SeedRoleUpsertInput = {
  id: string;
  name: string;
  description: string;
};

export type SeedStore = {
  findOrganizationByName(name: string): Promise<SeedOrganizationRecord | null>;
  upsertOrganization(input: SeedOrganizationUpsertInput): Promise<SeedOrganizationRecord>;
  findRoleById(roleId: string): Promise<SeedRoleRecord | null>;
  upsertRole(input: SeedRoleUpsertInput): Promise<SeedRoleRecord>;
  listRolePermissions(roleId: string): Promise<string[]>;
  replaceRolePermissions(roleId: string, permissions: string[]): Promise<void>;
};

export type SeedResult = {
  organizationId: string;
  roleIds: string[];
  rolesCreated: string[];
  rolesUpdated: string[];
};

const allPermissions = dedupeAndSort(Object.values(Permissions));

export const DEFAULT_SEED_ROLES: readonly SeedRoleDefinition[] = [
  {
    id: "super_admin",
    name: "SUPER_ADMIN",
    description: "Super administrator with full platform permissions.",
    permissions: allPermissions
  },
  {
    id: "admin",
    name: "ADMIN",
    description: "Organization administrator with full FlowHR permissions.",
    permissions: allPermissions
  },
  {
    id: "manager",
    name: "MANAGER",
    description: "Department manager permissions for approvals and team operations.",
    permissions: [...defaultRolePermissions.manager]
  },
  {
    id: "employee",
    name: "EMPLOYEE",
    description: "Self-service employee permissions.",
    permissions: [...defaultRolePermissions.employee]
  }
];

function dedupeAndSort(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))].sort(
    (left, right) => left.localeCompare(right)
  );
}

function isDirectExecution() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return pathToFileURL(entry).href === import.meta.url;
}

export function createPrismaSeedStore(prisma: PrismaClient): SeedStore {
  return {
    async findOrganizationByName(name) {
      return prisma.organization.findFirst({
        where: { name },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
    },

    async upsertOrganization(input) {
      return prisma.organization.upsert({
        where: { id: input.id },
        create: {
          id: input.id,
          name: input.name,
          isOnboardingComplete: input.isOnboardingComplete
        },
        update: {
          name: input.name
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
    },

    async findRoleById(roleId) {
      return prisma.role.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });
    },

    async upsertRole(input) {
      return prisma.role.upsert({
        where: { id: input.id },
        create: {
          id: input.id,
          name: input.name,
          description: input.description
        },
        update: {
          name: input.name,
          description: input.description
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });
    },

    async listRolePermissions(roleId) {
      const rows = await prisma.rolePermission.findMany({
        where: { roleId },
        select: { permission: true },
        orderBy: { permission: "asc" }
      });
      return rows.map((row) => row.permission);
    },

    async replaceRolePermissions(roleId, permissions) {
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });

      if (permissions.length === 0) {
        return;
      }

      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permission
        })),
        skipDuplicates: true
      });
    }
  };
}

export async function seedFlowHrDefaults(store: SeedStore): Promise<SeedResult> {
  const existingOrg = await store.findOrganizationByName(DEFAULT_SEED_ORGANIZATION_NAME);
  const organizationId = existingOrg?.id ?? DEFAULT_SEED_ORGANIZATION_ID;
  const organization = await store.upsertOrganization({
    id: organizationId,
    name: DEFAULT_SEED_ORGANIZATION_NAME,
    isOnboardingComplete: false
  });

  const rolesCreated: string[] = [];
  const rolesUpdated: string[] = [];

  for (const roleDefinition of DEFAULT_SEED_ROLES) {
    const desiredPermissions = dedupeAndSort(roleDefinition.permissions);
    const existingRole = await store.findRoleById(roleDefinition.id);

    await store.upsertRole({
      id: roleDefinition.id,
      name: roleDefinition.name,
      description: roleDefinition.description
    });

    if (existingRole) {
      rolesUpdated.push(roleDefinition.id);
    } else {
      rolesCreated.push(roleDefinition.id);
    }

    const currentPermissions = dedupeAndSort(await store.listRolePermissions(roleDefinition.id));
    const samePermissions =
      currentPermissions.length === desiredPermissions.length &&
      currentPermissions.every((permission, index) => permission === desiredPermissions[index]);

    if (!samePermissions) {
      await store.replaceRolePermissions(roleDefinition.id, desiredPermissions);
    }
  }

  return {
    organizationId: organization.id,
    roleIds: DEFAULT_SEED_ROLES.map((role) => role.id),
    rolesCreated,
    rolesUpdated
  };
}

/**
 * Default admin user setup instructions (comment only):
 * 1) Create the first auth user in your identity provider (for example: Supabase Auth).
 * 2) Set user app metadata with the bootstrap organization and admin role:
 *    - organization_id: <seeded organization id>
 *    - role: "admin" (or "super_admin" if your policy allows it)
 *    - actor_id: <matching Employee.id when employee linkage is used>
 * 3) After first login, rotate to your standard invitation/onboarding flow.
 */
export async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedFlowHrDefaults(createPrismaSeedStore(prisma));
    console.log(
      `[seed] organization=${result.organizationId} roles=${result.roleIds.length} created=${result.rolesCreated.length} updated=${result.rolesUpdated.length}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  });
}
