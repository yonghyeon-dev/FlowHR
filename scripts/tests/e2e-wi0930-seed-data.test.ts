import assert from "node:assert/strict";

import {
  DEFAULT_SEED_ORGANIZATION_NAME,
  DEFAULT_SEED_ROLES,
  seedFlowHrDefaults,
  type SeedOrganizationRecord,
  type SeedRoleRecord,
  type SeedStore
} from "../../prisma/seed";

type InMemoryOrganization = SeedOrganizationRecord & {
  isOnboardingComplete: boolean;
};

class InMemorySeedStore implements SeedStore {
  private readonly organizations = new Map<string, InMemoryOrganization>();
  private readonly roles = new Map<string, SeedRoleRecord>();
  private readonly rolePermissions = new Map<string, Set<string>>();

  async findOrganizationByName(name: string): Promise<SeedOrganizationRecord | null> {
    for (const organization of this.organizations.values()) {
      if (organization.name === name) {
        return {
          id: organization.id,
          name: organization.name,
          createdAt: new Date(organization.createdAt.getTime()),
          updatedAt: new Date(organization.updatedAt.getTime())
        };
      }
    }
    return null;
  }

  async upsertOrganization(input: {
    id: string;
    name: string;
    isOnboardingComplete: boolean;
  }): Promise<SeedOrganizationRecord> {
    const now = new Date();
    const existing = this.organizations.get(input.id);
    if (existing) {
      const updated: InMemoryOrganization = {
        ...existing,
        name: input.name,
        updatedAt: now
      };
      this.organizations.set(input.id, updated);
      return {
        id: updated.id,
        name: updated.name,
        createdAt: new Date(updated.createdAt.getTime()),
        updatedAt: new Date(updated.updatedAt.getTime())
      };
    }

    const created: InMemoryOrganization = {
      id: input.id,
      name: input.name,
      isOnboardingComplete: input.isOnboardingComplete,
      createdAt: now,
      updatedAt: now
    };
    this.organizations.set(input.id, created);
    return {
      id: created.id,
      name: created.name,
      createdAt: new Date(created.createdAt.getTime()),
      updatedAt: new Date(created.updatedAt.getTime())
    };
  }

  async findRoleById(roleId: string): Promise<SeedRoleRecord | null> {
    const role = this.roles.get(roleId);
    if (!role) {
      return null;
    }
    return {
      ...role,
      createdAt: new Date(role.createdAt.getTime()),
      updatedAt: new Date(role.updatedAt.getTime())
    };
  }

  async upsertRole(input: { id: string; name: string; description: string }): Promise<SeedRoleRecord> {
    const now = new Date();
    const existing = this.roles.get(input.id);
    if (existing) {
      const updated: SeedRoleRecord = {
        ...existing,
        name: input.name,
        description: input.description,
        updatedAt: now
      };
      this.roles.set(input.id, updated);
      return {
        ...updated,
        createdAt: new Date(updated.createdAt.getTime()),
        updatedAt: new Date(updated.updatedAt.getTime())
      };
    }

    const created: SeedRoleRecord = {
      id: input.id,
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now
    };
    this.roles.set(input.id, created);
    return {
      ...created,
      createdAt: new Date(created.createdAt.getTime()),
      updatedAt: new Date(created.updatedAt.getTime())
    };
  }

  async listRolePermissions(roleId: string): Promise<string[]> {
    const permissions = this.rolePermissions.get(roleId);
    if (!permissions) {
      return [];
    }
    return [...permissions].sort((left, right) => left.localeCompare(right));
  }

  async replaceRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    const normalized = [...new Set(permissions)].sort((left, right) => left.localeCompare(right));
    this.rolePermissions.set(roleId, new Set(normalized));
  }

  organizationCount() {
    return this.organizations.size;
  }

  roleCount() {
    return this.roles.size;
  }
}

function dedupeAndSort(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

async function run() {
  const store = new InMemorySeedStore();

  const firstResult = await seedFlowHrDefaults(store);
  assert.equal(store.organizationCount(), 1, "seed should create one default organization");
  assert.ok(firstResult.organizationId.length > 0, "seed should return an organization id");
  assert.equal(store.roleCount(), DEFAULT_SEED_ROLES.length, "seed should create all default roles");

  const organization = await store.findOrganizationByName(DEFAULT_SEED_ORGANIZATION_NAME);
  assert.ok(organization, "default organization should exist");
  assert.equal(organization?.name, DEFAULT_SEED_ORGANIZATION_NAME);

  for (const role of DEFAULT_SEED_ROLES) {
    const persistedRole = await store.findRoleById(role.id);
    assert.ok(persistedRole, `role ${role.id} should exist`);
    assert.equal(persistedRole?.name, role.name, `role ${role.id} should use expected display name`);
    assert.deepEqual(
      await store.listRolePermissions(role.id),
      dedupeAndSort(role.permissions),
      `role ${role.id} should have the expected permissions`
    );
  }

  const roleCountAfterFirstRun = store.roleCount();
  const organizationCountAfterFirstRun = store.organizationCount();

  const secondResult = await seedFlowHrDefaults(store);
  assert.equal(secondResult.organizationId, firstResult.organizationId, "organization should be reused");
  assert.equal(store.roleCount(), roleCountAfterFirstRun, "running seed twice should not add duplicate roles");
  assert.equal(
    store.organizationCount(),
    organizationCountAfterFirstRun,
    "running seed twice should not add duplicate organizations"
  );

  for (const role of DEFAULT_SEED_ROLES) {
    assert.deepEqual(
      await store.listRolePermissions(role.id),
      dedupeAndSort(role.permissions),
      `role ${role.id} permissions should remain stable after second run`
    );
  }
}

run()
  .then(() => {
    console.log("e2e-wi0930-seed-data.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
