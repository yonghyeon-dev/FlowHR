import { prisma } from "@/lib/prisma";
import { readActor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor || !hasAnyRole(actor, ["admin", "payroll_operator"])) {
    return fail(403, "payroll confirm requires admin or payroll_operator role");
  }

  const { runId } = await context.params;
  const run = await prisma.payrollRun.findUnique({
    where: { id: runId }
  });
  if (!run) {
    return fail(404, "payroll run not found");
  }

  const confirmed = await prisma.payrollRun.update({
    where: { id: runId },
    data: {
      state: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedBy: actor.id
    }
  });

  await writeAuditLog(prisma, {
    action: "payroll.confirmed",
    entityType: "PayrollRun",
    entityId: confirmed.id,
    actor
  });

  return ok({ run: confirmed });
}
