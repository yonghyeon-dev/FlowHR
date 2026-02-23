import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeTypes = readUtf8("src", "app", "employee", "page-types.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0301-employee-admin-locale-dynamic-ui-gap-fix-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /const \{ locale \} = useI18n\(\);/);
  assert.match(employeePage, /const requestStatusLabels = useMemo\(/);
  assert.match(employeePage, /const listBadgeLabels = useMemo\(/);
  assert.match(employeePage, /const toRequestStatusLabel = useCallback\(/);
  assert.match(employeePage, /const toLeaveTypeLabel = useCallback\(/);

  assert.match(employeePage, /\{toRequestStatusLabel\(row\.status\)\}/);
  assert.match(employeePage, /\{toRequestStatusLabel\(item\.status\)\}/);
  assert.match(employeePage, /\{toRequestStatusLabel\(record\.state\)\}/);
  assert.match(employeePage, /\{toRequestStatusLabel\(request\.state\)\}/);
  assert.match(employeePage, /\{listBadgeLabels\.empty\}/);
  assert.match(employeePage, /\{listBadgeLabels\.applied\}/);
  assert.match(employeePage, /\{schedule\.isHoliday \? listBadgeLabels\.holiday : listBadgeLabels\.work\}/);
  assert.match(employeePage, /\{log\.ok \? listBadgeLabels\.success : listBadgeLabels\.fail\}/);

  assert.doesNotMatch(employeePage, />EMPTY</);
  assert.doesNotMatch(employeePage, />APPLIED</);
  assert.doesNotMatch(employeePage, /schedule\.isHoliday \? "HOLIDAY" : "WORK"/);
  assert.doesNotMatch(employeePage, /log\.ok \? "OK" : "FAIL"/);
  assert.doesNotMatch(employeePage, /check\.pass \? "PASS" : "FAIL"/);

  assert.match(
    employeeTypes,
    /status: "PENDING" \| "APPROVED" \| "REJECTED" \| "CANCELED";/
  );

  assert.match(adminPage, /const inviteRoleLabels = useMemo\(/);
  assert.match(adminPage, /const inviteDeliveryModeLabels = useMemo\(/);
  assert.match(adminPage, /const toInviteRoleLabel = \(role: string\) =>/);
  assert.match(adminPage, /const toInviteDeliveryModeLabel = \(mode: string\) =>/);

  assert.match(adminPage, /<option value="employee">\{inviteRoleLabels\.employee\}<\/option>/);
  assert.match(adminPage, /<option value="manager">\{inviteRoleLabels\.manager\}<\/option>/);
  assert.match(adminPage, /<option value="admin">\{inviteRoleLabels\.admin\}<\/option>/);
  assert.match(adminPage, /<option value="link">\{inviteDeliveryModeLabels\.link\}<\/option>/);
  assert.match(adminPage, /<option value="email">\{inviteDeliveryModeLabels\.email\}<\/option>/);

  assert.doesNotMatch(adminPage, /<option value="employee">employee<\/option>/);
  assert.doesNotMatch(adminPage, /<option value="manager">manager<\/option>/);
  assert.doesNotMatch(adminPage, /<option value="admin">admin<\/option>/);
  assert.doesNotMatch(adminPage, /<option value="link">link<\/option>/);
  assert.doesNotMatch(adminPage, /<option value="email">email<\/option>/);

  assert.match(adminPage, /role=\s*\{toInviteRoleLabel\(inviteResult\.role\)\}/);
  assert.match(adminPage, /delivery=\s*\{toInviteDeliveryModeLabel\(inviteResult\.deliveryMode\)\}/);

  assert.match(workItem, /WI-0301/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0301/i);
}

run()
  .then(() => {
    console.log("e2e-wi0301-employee-admin-locale-dynamic-ui-gap-fix-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
