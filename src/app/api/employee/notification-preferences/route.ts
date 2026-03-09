import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import {
  resolveEmployeeNotificationPreferenceResponse,
  toEmployeeNotificationPreferenceResetInput,
  toEmployeeNotificationPreferenceUpdateInput
} from "@/features/people/notification-preferences";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const updatePreferenceSchema = z
  .object({
    resetToDefaults: z.boolean().optional(),
    channels: z
      .object({
        email: z.boolean(),
        inApp: z.boolean()
      })
      .optional(),
    categories: z
      .object({
        leave: z.boolean(),
        attendance: z.boolean(),
        payroll: z.boolean()
      })
      .optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.resetToDefaults) {
      return;
    }
    if (!value.channels || !value.categories) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "channels and categories are required unless resetToDefaults is true"
      });
    }
  });

async function requireEmployee(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "employee.notification_preferences.unauthorized")
    };
  }
  if (actor.role !== "employee") {
    return {
      ok: false as const,
      response: fail(403, "employee.notification_preferences.forbidden")
    };
  }
  if (!actor.organizationId) {
    return {
      ok: false as const,
      response: fail(400, "employee.notification_preferences.organization_id_required")
    };
  }

  return {
    ok: true as const,
    actor
  };
}

async function loadEmployeeContext(actor: { id: string; organizationId: string }) {
  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(actor.id);
  if (!employee || employee.organizationId !== actor.organizationId) {
    return {
      ok: false as const,
      response: fail(404, "employee.notification_preferences.employee_not_found")
    };
  }

  const organization = await dataAccess.organizations.findById(actor.organizationId);
  if (!organization) {
    return {
      ok: false as const,
      response: fail(404, "employee.notification_preferences.organization_not_found")
    };
  }

  return {
    ok: true as const,
    dataAccess,
    employee,
    organization
  };
}

export async function GET(request: Request) {
  const auth = await requireEmployee(request);
  if (!auth.ok) {
    return auth.response;
  }
  const organizationId = auth.actor.organizationId as string;

  const context = await loadEmployeeContext({
    id: auth.actor.id,
    organizationId
  });
  if (!context.ok) {
    return context.response;
  }

  return ok(resolveEmployeeNotificationPreferenceResponse(context.employee, context.organization));
}

export async function PUT(request: Request) {
  const auth = await requireEmployee(request);
  if (!auth.ok) {
    return auth.response;
  }
  const organizationId = auth.actor.organizationId as string;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updatePreferenceSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const context = await loadEmployeeContext({
    id: auth.actor.id,
    organizationId
  });
  if (!context.ok) {
    return context.response;
  }

  const updateInput = parsed.data.resetToDefaults
    ? toEmployeeNotificationPreferenceResetInput()
    : toEmployeeNotificationPreferenceUpdateInput({
        channels: parsed.data.channels!,
        categories: parsed.data.categories!
      });

  const updated = await context.dataAccess.employees.update(context.employee.id, updateInput);
  return ok(resolveEmployeeNotificationPreferenceResponse(updated, context.organization));
}
