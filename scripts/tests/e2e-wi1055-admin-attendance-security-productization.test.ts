import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const page = readUtf8("src", "app", "admin", "attendance-security", "page.tsx");
  const route = readUtf8("src", "app", "api", "admin", "attendance-security", "route.ts");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090002_wi1055_attendance_security_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "attendance-security", "page.tsx")));
  assert.ok(existsSync(join(process.cwd(), "src", "app", "api", "admin", "attendance-security", "route.ts")));
  assert.ok(existsSync(migrationPath), "attendance security migration must exist");

  assert.match(
    adminLayout,
    /href: "\/admin\/attendance-security"/,
    "admin nav should expose the attendance security page"
  );
  assert.match(
    workspaceHubs,
    /href: "\/admin\/attendance-security"/,
    "admin workspace hubs should expose the attendance security page"
  );
  assert.match(page, /path: "\/api\/admin\/attendance-security"/);
  assert.match(page, /pageTitle: "출퇴근 보안 설정"|pageTitle: "Attendance Security"/);
  assert.match(route, /attendanceGpsRequired/);
  assert.match(route, /attendanceGeofenceEnabled/);
  assert.match(route, /attendanceGeofenceLatitude/);
  assert.match(route, /attendanceGeofenceLongitude/);
  assert.match(route, /attendanceGeofenceRadiusMeters/);
  assert.match(route, /geofence is enabled/);
  assert.match(workItem, /Attendance security settings such as GPS\/geofence/i);
  assert.match(progress, /attendance security/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-admin-attendance-security-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
