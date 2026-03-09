ALTER TABLE "Organization"
ADD COLUMN "attendanceGpsRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attendanceGeofenceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attendanceGeofenceLatitude" DOUBLE PRECISION,
ADD COLUMN "attendanceGeofenceLongitude" DOUBLE PRECISION,
ADD COLUMN "attendanceGeofenceRadiusMeters" INTEGER;
