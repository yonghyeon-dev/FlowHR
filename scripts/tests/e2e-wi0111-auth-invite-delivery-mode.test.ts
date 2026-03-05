import assert from "node:assert/strict";

import type { DataAccess } from "../../src/features/shared/data-access.ts";
import { ServiceError } from "../../src/features/shared/service-error.ts";
import {
  createAuthInvite,
  type SupabaseAdminAuthClient
} from "../../src/features/auth/service.ts";
import type { Actor } from "../../src/lib/actor.ts";

type AuditEntry = {
  action: string;
  payload?: Record<string, unknown>;
};

function createAuditDataAccess(sink: AuditEntry[]): DataAccess {
  return {
    audit: {
      append: async (entry: unknown) => {
        sink.push(entry as AuditEntry);
      }
    }
  } as unknown as DataAccess;
}

function createNoopSupabaseAdmin(): SupabaseAdminAuthClient {
  return {
    auth: {
      admin: {
        generateLink: async () => {
          throw new Error("generateLink should not be called");
        },
        inviteUserByEmail: async () => {
          throw new Error("inviteUserByEmail should not be called");
        },
        updateUserById: async () => {
          throw new Error("updateUserById should not be called");
        }
      }
    }
  };
}

function isServiceErrorWithStatus(status: number) {
  return (error: unknown) => error instanceof ServiceError && error.status === status;
}

async function testLinkDeliveryModeFlow() {
  const auditEntries: AuditEntry[] = [];
  const generateLinkCalls: Array<{
    type: "invite";
    email: string;
    options?: { redirectTo?: string; data?: Record<string, unknown> };
  }> = [];
  const updateCalls: Array<{ userId: string; appMetadata: Record<string, unknown> }> = [];

  const supabaseAdmin: SupabaseAdminAuthClient = {
    auth: {
      admin: {
        generateLink: async (input) => {
          generateLinkCalls.push(input);
          return {
            data: {
              user: {
                id: "USR-LINK-1001",
                app_metadata: {
                  existing_claim: "persisted"
                }
              },
              properties: {
                action_link: "https://flowhr.local/invite/link-token"
              }
            },
            error: null
          };
        },
        inviteUserByEmail: async () => {
          throw new Error("inviteUserByEmail must not run in link mode");
        },
        updateUserById: async (userId, attributes) => {
          updateCalls.push({ userId, appMetadata: attributes.app_metadata });
          return { error: null };
        }
      }
    }
  };

  const actor: Actor = {
    id: "ADM-INVITE-1001",
    role: "admin",
    organizationId: "ORG-INVITE-1001"
  };

  const invite = await createAuthInvite(
    {
      actor,
      dataAccess: createAuditDataAccess(auditEntries),
      supabaseAdmin
    },
    {
      email: "Link.User@Company.com",
      role: "manager",
      organizationId: "ORG-INVITE-1001",
      actorId: "EMP-1001",
      redirectTo: "https://flowhr.local/login"
    }
  );

  assert.equal(invite.deliveryMode, "link");
  assert.equal(invite.actionLink, "https://flowhr.local/invite/link-token");
  assert.equal(invite.email, "link.user@company.com");
  assert.equal(invite.role, "manager");
  assert.equal(invite.organizationId, "ORG-INVITE-1001");
  assert.equal(invite.actorId, "EMP-1001");

  assert.equal(generateLinkCalls.length, 1);
  assert.deepEqual(generateLinkCalls[0], {
    type: "invite",
    email: "link.user@company.com",
    options: {
      redirectTo: "https://flowhr.local/login",
      data: {
        organizationId: "ORG-INVITE-1001",
        organization_id: "ORG-INVITE-1001",
        role: "manager"
      }
    }
  });

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].userId, "USR-LINK-1001");
  assert.equal(updateCalls[0].appMetadata.role, "manager");
  assert.equal(updateCalls[0].appMetadata.organization_id, "ORG-INVITE-1001");
  assert.equal(updateCalls[0].appMetadata.actor_id, "EMP-1001");
  assert.equal(updateCalls[0].appMetadata.existing_claim, "persisted");

  assert.equal(auditEntries.length, 2);
  assert.equal(auditEntries[0].action, "auth.invite.generated");
  assert.equal(auditEntries[0].payload?.deliveryMode, "link");
  assert.equal(auditEntries[0].payload?.hasActionLink, true);
  assert.equal(auditEntries[1].action, "auth.user.claims.updated");
}

async function testEmailDeliveryModeFlow() {
  const auditEntries: AuditEntry[] = [];
  const inviteByEmailCalls: Array<{
    email: string;
    options?: { redirectTo?: string; data?: Record<string, unknown> };
  }> = [];
  const updateCalls: Array<{ userId: string; appMetadata: Record<string, unknown> }> = [];

  const supabaseAdmin: SupabaseAdminAuthClient = {
    auth: {
      admin: {
        generateLink: async () => {
          throw new Error("generateLink must not run in email mode");
        },
        inviteUserByEmail: async (email, options) => {
          inviteByEmailCalls.push({ email, options });
          return {
            data: {
              user: {
                id: "USR-EMAIL-1001",
                app_metadata: {
                  existing_claim: "persisted"
                }
              }
            },
            error: null
          };
        },
        updateUserById: async (userId, attributes) => {
          updateCalls.push({ userId, appMetadata: attributes.app_metadata });
          return { error: null };
        }
      }
    }
  };

  const actor: Actor = {
    id: "ADM-INVITE-1002",
    role: "admin",
    organizationId: "ORG-INVITE-1002"
  };

  const invite = await createAuthInvite(
    {
      actor,
      dataAccess: createAuditDataAccess(auditEntries),
      supabaseAdmin
    },
    {
      email: "Email.User@Company.com",
      role: "employee",
      organizationId: "ORG-INVITE-1002",
      redirectTo: "https://flowhr.local/login",
      deliveryMode: "email"
    }
  );

  assert.equal(invite.deliveryMode, "email");
  assert.equal(invite.actionLink, null);
  assert.equal(invite.email, "email.user@company.com");
  assert.equal(invite.role, "employee");
  assert.equal(invite.organizationId, "ORG-INVITE-1002");
  assert.equal(invite.actorId, null);

  assert.equal(inviteByEmailCalls.length, 1);
  assert.deepEqual(inviteByEmailCalls[0], {
    email: "email.user@company.com",
    options: {
      redirectTo: "https://flowhr.local/login",
      data: {
        organizationId: "ORG-INVITE-1002",
        organization_id: "ORG-INVITE-1002",
        role: "employee"
      }
    }
  });

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].userId, "USR-EMAIL-1001");
  assert.equal(updateCalls[0].appMetadata.role, "employee");
  assert.equal(updateCalls[0].appMetadata.organization_id, "ORG-INVITE-1002");
  assert.equal(updateCalls[0].appMetadata.existing_claim, "persisted");
  assert.equal(Object.hasOwn(updateCalls[0].appMetadata, "actor_id"), false);

  assert.equal(auditEntries.length, 2);
  assert.equal(auditEntries[0].action, "auth.invite.generated");
  assert.equal(auditEntries[0].payload?.deliveryMode, "email");
  assert.equal(auditEntries[0].payload?.hasActionLink, false);
}

async function testPermissionAndOrgValidation() {
  await assert.rejects(
    () =>
      createAuthInvite(
        {
          actor: null,
          dataAccess: createAuditDataAccess([]),
          supabaseAdmin: createNoopSupabaseAdmin()
        },
        {
          email: "nobody@example.com",
          redirectTo: "https://flowhr.local/login"
        }
      ),
    isServiceErrorWithStatus(401)
  );

  await assert.rejects(
    () =>
      createAuthInvite(
        {
          actor: {
            id: "MGR-1001",
            role: "manager",
            organizationId: "ORG-INVITE-1001"
          },
          dataAccess: createAuditDataAccess([]),
          supabaseAdmin: createNoopSupabaseAdmin()
        },
        {
          email: "nobody@example.com",
          redirectTo: "https://flowhr.local/login"
        }
      ),
    isServiceErrorWithStatus(403)
  );

  await assert.rejects(
    () =>
      createAuthInvite(
        {
          actor: {
            id: "ADM-1001",
            role: "admin",
            organizationId: "ORG-LEFT"
          },
          dataAccess: createAuditDataAccess([]),
          supabaseAdmin: createNoopSupabaseAdmin()
        },
        {
          email: "nobody@example.com",
          organizationId: "ORG-RIGHT",
          redirectTo: "https://flowhr.local/login"
        }
      ),
    isServiceErrorWithStatus(403)
  );
}

async function run() {
  await testLinkDeliveryModeFlow();
  await testEmailDeliveryModeFlow();
  await testPermissionAndOrgValidation();
  console.log("e2e-wi0111-auth-invite-delivery-mode.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
