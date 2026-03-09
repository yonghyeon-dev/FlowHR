import { z } from "zod";

import type { OrganizationEntity, UpdateOrganizationInput } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const nullableNumber = z.union([z.number().finite(), z.null()]);

const putAttendanceSecuritySchema = z
  .object({
    gpsRequired: z.boolean(),
    geofenceEnabled: z.boolean(),
    geofenceLatitude: nullableNumber,
    geofenceLongitude: nullableNumber,
    geofenceRadiusMeters: z.union([z.number().int().positive().max(100000), z.null()])
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.geofenceLatitude !== null &&
      (value.geofenceLatitude < -90 || value.geofenceLatitude > 90)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceLatitude"],
        message: "latitude must be between -90 and 90"
      });
    }

    if (
      value.geofenceLongitude !== null &&
      (value.geofenceLongitude < -180 || value.geofenceLongitude > 180)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceLongitude"],
        message: "longitude must be between -180 and 180"
      });
    }

    if (!value.geofenceEnabled) {
      return;
    }

    if (value.geofenceLatitude === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceLatitude"],
        message: "latitude is required when geofence is enabled"
      });
    }

    if (value.geofenceLongitude === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceLongitude"],
        message: "longitude is required when geofence is enabled"
      });
    }

    if (value.geofenceRadiusMeters === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["geofenceRadiusMeters"],
        message: "radius is required when geofence is enabled"
      });
    }
  });

function toAttendanceSecurityResponse(organization: OrganizationEntity) {
  return {
    gpsRequired: organization.attendanceGpsRequired,
    geofenceEnabled: organization.attendanceGeofenceEnabled,
    geofenceLatitude: organization.attendanceGeofenceLatitude,
    geofenceLongitude: organization.attendanceGeofenceLongitude,
    geofenceRadiusMeters: organization.attendanceGeofenceRadiusMeters,
    updatedAt: organization.updatedAt.toISOString()
  };
}

function toUpdateOrganizationInput(
  payload: z.infer<typeof putAttendanceSecuritySchema>
): UpdateOrganizationInput {
  const gpsRequired = payload.geofenceEnabled ? true : payload.gpsRequired;
  return {
    attendanceGpsRequired: gpsRequired,
    attendanceGeofenceEnabled: payload.geofenceEnabled,
    attendanceGeofenceLatitude: payload.geofenceLatitude,
    attendanceGeofenceLongitude: payload.geofenceLongitude,
    attendanceGeofenceRadiusMeters: payload.geofenceRadiusMeters
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.attendanceSecurity");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.attendanceSecurity.organization_not_found");
  }

  return ok(toAttendanceSecurityResponse(organization));
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.attendanceSecurity");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = putAttendanceSecuritySchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.attendanceSecurity.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toUpdateOrganizationInput(parsed.data)
  );
  return ok(toAttendanceSecurityResponse(updated));
}
