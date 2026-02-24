import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const approvalTemplatesPage = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const pageSections = readUtf8("src", "app", "admin", "approval-templates", "page-sections.tsx");
  const pageTypes = readUtf8("src", "app", "admin", "approval-templates", "page-types.ts");
  const localeHelpers = readUtf8(
    "src",
    "app",
    "admin",
    "approval-templates",
    "page-locale-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0330-admin-approval-templates-locale-dynamic-ui-gap-fix-phase7.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalTemplatesPage, /from "@\/app\/admin\/approval-templates\/page-locale-helpers"/);
  assert.match(approvalTemplatesPage, /from "@\/app\/admin\/approval-templates\/page-sections"/);
  assert.match(approvalTemplatesPage, /from "@\/app\/admin\/approval-templates\/page-types"/);
  assert.match(approvalTemplatesPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(
    approvalTemplatesPage,
    /const copy = useMemo\(\(\) => resolveAdminApprovalTemplatesLocaleCopy\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(approvalTemplatesPage, /copy\.hero\.title/);
  assert.match(approvalTemplatesPage, /copy\.context\.organizationId/);
  assert.match(approvalTemplatesPage, /copy\.create\.title/);
  assert.match(approvalTemplatesPage, /copy\.domainLabels\[option\]/);
  assert.match(approvalTemplatesPage, /<ApprovalTemplatePreviewPanel/);
  assert.match(approvalTemplatesPage, /<ApprovalTemplateListPanel/);
  assert.match(approvalTemplatesPage, /<ApprovalTemplateLogsPanel/);
  assert.match(approvalTemplatesPage, /runGatePreview=\{\(\) => void runGatePreview\(\)\}/);
  assert.doesNotMatch(approvalTemplatesPage, /<p className="eyebrow">FlowHR Admin<\/p>/);
  assert.doesNotMatch(approvalTemplatesPage, /<h2>컨텍스트<\/h2>/);
  assert.doesNotMatch(approvalTemplatesPage, /Organization ID/);

  assert.match(pageSections, /export function ApprovalTemplatePreviewPanel/);
  assert.match(pageSections, /export function ApprovalTemplateListPanel/);
  assert.match(pageSections, /export function ApprovalTemplateLogsPanel/);
  assert.match(pageSections, /copy\.preview\.title/);
  assert.match(pageSections, /copy\.templateList\.title/);
  assert.match(pageSections, /copy\.logs\.title/);
  assert.match(pageSections, /formatApprovalTemplateDateTime\(template\.createdAt, runtimeLocale\)/);
  assert.match(pageSections, /formatApprovalTemplateDateTime\(template\.updatedAt, runtimeLocale\)/);
  assert.match(pageSections, /formatApprovalTemplateDateTime\(delegation\.startsAt, runtimeLocale\)/);
  assert.match(pageSections, /formatApprovalTemplateDateTime\(delegation\.endsAt, runtimeLocale\)/);
  assert.match(pageSections, /formatApprovalTemplateKrw\(gatePreview\.payrollGrossPayKrw, runtimeLocale\)/);
  assert.match(pageSections, /copy\.logs\.okBadge/);
  assert.match(pageSections, /copy\.logs\.failBadge/);

  assert.match(pageTypes, /export type ApprovalDomain = "ATTENDANCE" \| "LEAVE" \| "PAYROLL"/);
  assert.match(pageTypes, /export type ApprovalLineTemplateDto = \{/);
  assert.match(pageTypes, /export type ApprovalGatePreviewDto = \{/);
  assert.match(pageTypes, /export type ApiLog = \{/);

  assert.match(
    localeHelpers,
    /export function resolveAdminApprovalTemplatesLocaleCopy\(isKoLocale: boolean\)/
  );
  assert.match(localeHelpers, /title: "Approval line templates"/);
  assert.match(localeHelpers, /toPolicy: "Go to approval\/delegation policy"/);
  assert.match(localeHelpers, /toAdmin: "Back to admin home"/);
  assert.match(localeHelpers, /domainLabels: \{/);
  assert.match(localeHelpers, /ATTENDANCE: "Attendance"/);
  assert.match(localeHelpers, /LEAVE: "Leave"/);
  assert.match(localeHelpers, /PAYROLL: "Payroll"/);
  assert.match(
    localeHelpers,
    /formatApprovalTemplateDateTime\(value: string, runtimeLocale: string\)/
  );
  assert.match(
    localeHelpers,
    /formatApprovalTemplateKrw\(\s*value: number \| null \| undefined,\s*runtimeLocale: string\s*\)/
  );

  assert.match(workItem, /WI-0330/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0330/i);
}

run()
  .then(() => {
    console.log("e2e-wi0330-admin-approval-templates-locale-dynamic-ui-gap-fix-phase7.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
