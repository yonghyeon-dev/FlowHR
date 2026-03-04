import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const createOnboardingTasksSchema = z.object({
  employeeId: z.string().trim().min(1)
});

const listOnboardingTasksQuerySchema = z.object({
  employeeId: z.string().trim().min(1)
});

const defaultTaskTitles = [
  "근로계약서 서명",
  "급여계좌 등록",
  "4대보험 가입 확인",
  "사내 시스템 계정 발급",
  "부서 OT 참석"
] as const;

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return { ok: false as const, response: fail(401, "admin.onboarding.tasks.unauthorized") };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.onboarding.tasks.forbidden", { reason: "admin_required" })
    };
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = listOnboardingTasksQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const tasks = await getRuntimeDataAccess().onboardingTasks.listByEmployee(parsed.data.employeeId);
  return ok({ tasks });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createOnboardingTasksSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const tasks = await Promise.all(
    defaultTaskTitles.map((title) =>
      dataAccess.onboardingTasks.create({
        employeeId: parsed.data.employeeId,
        title,
        status: "PENDING"
      })
    )
  );

  return ok({ tasks }, 201);
}
