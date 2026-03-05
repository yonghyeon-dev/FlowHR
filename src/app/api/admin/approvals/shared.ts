import { z } from "zod";

import type { Actor } from "@/lib/actor";
import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

const MAX_BULK_ITEMS = 50;
const DEFAULT_PENDING_LIMIT = 50;
const MAX_PENDING_LIMIT = 200;

const approvalItemSchema = z.object({
  type: z.enum(["attendance", "leave"]),
  id: z.string().trim().min(1)
});

export const bulkApprovalSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"]),
    items: z.array(approvalItemSchema).min(1).max(MAX_BULK_ITEMS),
    reason: z.string().trim().min(1).max(1000).optional()
  })
  .superRefine((value, context) => {
    if (value.action === "REJECT" && !value.reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "reason is required when action is REJECT",
        path: ["reason"]
      });
    }
  });

export const pendingQuerySchema = z.object({
  type: z.enum(["attendance", "leave"]).optional(),
  limit: z.number().int().min(1).max(MAX_PENDING_LIMIT).default(DEFAULT_PENDING_LIMIT),
  offset: z.number().int().min(0).default(0)
});

export type BulkApprovalInput = z.infer<typeof bulkApprovalSchema>;
export type PendingQueryInput = z.infer<typeof pendingQuerySchema>;

export function parseOptionalInteger(value: string | null): number | string | undefined {
  if (value === null) {
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed)) {
    return value;
  }
  return parsed;
}

export async function requireAdminOrManager(request: Request, namespace: string) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, `${namespace}.unauthorized`)
    };
  }

  if (actor.role !== "admin" && actor.role !== "manager") {
    return {
      ok: false as const,
      response: fail(403, `${namespace}.forbidden`, {
        reason: "admin_or_manager_required"
      })
    };
  }

  return {
    ok: true as const,
    actor
  };
}

export function resolveOrganizationId(actor: Actor) {
  const organizationId = actor.organizationId?.trim() ?? "";
  return organizationId.length > 0 ? organizationId : undefined;
}

