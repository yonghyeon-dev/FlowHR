import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0242-mobile-email-template-engine-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const emailScreen = readUtf8("apps", "mobile", "src", "screens", "EmailTemplateScreen.js");
  const emailTemplates = readUtf8("apps", "mobile", "src", "lib", "emailTemplates.js");
  const emailStore = readUtf8("apps", "mobile", "src", "lib", "emailTemplateStore.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0242/);
  assert.match(workItem, /Mobile Email Template Engine Baseline/);

  assert.match(navigator, /EmailTemplateScreen/);
  assert.match(navigator, /name="EmailTemplates"/);
  assert.match(adminScreen, /템플릿 프리뷰 열기/);
  assert.match(emailScreen, /이메일 템플릿 프리뷰/);
  assert.match(emailScreen, /renderEmailTemplate/);
  assert.match(emailScreen, /savePreview/);

  assert.match(emailTemplates, /approval-request/);
  assert.match(emailTemplates, /approval-result/);
  assert.match(emailTemplates, /payslip-ready/);
  assert.match(emailTemplates, /renderEmailTemplate/);
  assert.match(emailStore, /flowhr\.mobile\.email-template\.preference\.v1/);
  assert.match(emailStore, /flowhr\.mobile\.email-template\.preview-history\.v1/);
  assert.match(readme, /Email template baseline/);

  assert.ok(
    countLines(emailScreen) <= 300,
    `EmailTemplateScreen.js should stay under 300 lines (current: ${countLines(emailScreen)})`
  );
  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const emailTemplatesModule = await import("../../apps/mobile/src/lib/emailTemplates.js");
  const { listEmailTemplates, renderEmailTemplate, getEmailTemplate, missingTemplateVariables } =
    emailTemplatesModule;

  const templates = listEmailTemplates();
  assert.ok(templates.length >= 3);
  assert.equal(templates.some((item: { id: string }) => item.id === "approval-request"), true);

  const template = getEmailTemplate("approval-request");
  const missing = missingTemplateVariables(template, {
    employeeName: "홍길동",
    organizationName: "",
    actionLabel: "휴가 신청",
    deepLink: ""
  });
  assert.deepEqual(missing, ["organizationName", "deepLink"]);

  const preview = renderEmailTemplate({
    templateId: "approval-request",
    locale: "en",
    variables: {
      employeeName: "Jane",
      organizationName: "FlowHR",
      actionLabel: "Leave Request",
      deepLink: "https://flowhr.app/employee"
    }
  });
  assert.match(preview.subject, /\[FlowHR\] Jane Leave Request approval request/);
  assert.match(preview.body, /https:\/\/flowhr\.app\/employee/);
}

run()
  .then(() => {
    console.log("e2e-wi0242-mobile-email-template-engine-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
