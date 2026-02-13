import { PrismaClient } from "@prisma/client";
import { Actor } from "@/lib/actor";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string;
  actor: Actor;
  payload?: unknown;
};

export async function writeAuditLog(prisma: PrismaClient, input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorRole: input.actor.role,
      actorId: input.actor.id,
      payload: input.payload as object | undefined
    }
  });
}
