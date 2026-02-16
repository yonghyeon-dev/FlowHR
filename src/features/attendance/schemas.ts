import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });
const attendanceState = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const attendanceCaptureChannel = z.enum(["MANUAL", "GPS", "QR", "WIFI", "DEVICE"]);

const captureMetadataCreateSchema = z
  .object({
    channel: attendanceCaptureChannel.default("MANUAL"),
    deviceId: z.string().min(1).max(120).optional(),
    attestationToken: z.string().min(1).max(256).optional(),
    ipAddress: z.string().ip().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    accuracyMeters: z.number().int().min(0).max(10000).optional()
  })
  .superRefine((value, context) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "latitude and longitude must be provided together",
        path: ["latitude"]
      });
    }

    if (value.channel === "GPS" && (!hasLatitude || !hasLongitude)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GPS capture requires latitude and longitude",
        path: ["channel"]
      });
    }
  });

const captureMetadataUpdateSchema = z
  .object({
    channel: attendanceCaptureChannel.optional(),
    deviceId: z.string().min(1).max(120).nullable().optional(),
    attestationToken: z.string().min(1).max(256).optional(),
    ipAddress: z.string().ip().nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    accuracyMeters: z.number().int().min(0).max(10000).nullable().optional()
  })
  .superRefine((value, context) => {
    const latitudeProvided = value.latitude !== undefined;
    const longitudeProvided = value.longitude !== undefined;

    if (latitudeProvided !== longitudeProvided) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "latitude and longitude must be provided together",
        path: ["latitude"]
      });
      return;
    }

    if (latitudeProvided && longitudeProvided) {
      const latitudeIsNumber = value.latitude !== null;
      const longitudeIsNumber = value.longitude !== null;
      if (latitudeIsNumber !== longitudeIsNumber) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "latitude and longitude must both be numbers or both be null",
          path: ["latitude"]
        });
      }
    }

    if (
      value.channel === "GPS" &&
      (value.latitude === undefined ||
        value.longitude === undefined ||
        value.latitude === null ||
        value.longitude === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GPS capture requires latitude and longitude",
        path: ["channel"]
      });
    }
  });

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  checkInAt: isoDateTime,
  checkOutAt: isoDateTime.optional(),
  breakMinutes: z.number().int().min(0).max(300).default(0),
  isHoliday: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  capture: captureMetadataCreateSchema.optional()
});

export const updateAttendanceSchema = z.object({
  checkInAt: isoDateTime.optional(),
  checkOutAt: isoDateTime.optional(),
  breakMinutes: z.number().int().min(0).max(300).optional(),
  isHoliday: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  capture: captureMetadataUpdateSchema.optional()
});

export const rejectAttendanceSchema = z.object({
  reason: z.string().min(1).max(500).optional()
});

export const listAttendanceQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional(),
  state: attendanceState.optional()
});

export const listAttendanceAggregatesQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});
