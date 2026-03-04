import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function assertProductModeGate(page: string, pagePath: string) {
  assert.match(
    page,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/,
    `${pagePath}: allowHeaderActorFallback gate must exist`
  );
  assert.match(
    page,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/,
    `${pagePath}: requiresLoginSession gate must exist`
  );
  assert.match(page, /else if \(allowHeaderActorFallback\)/, `${pagePath}: actor header fallback must be gated`);
  assert.match(page, /\/login/, `${pagePath}: login guidance must exist`);
}

async function run() {
  const policyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const templatesPage = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const historyPage = readUtf8("src", "app", "admin", "approval-history", "page.tsx");

  const policyLocale = readUtf8("src", "app", "admin", "approval-policy", "page-locale-helpers.ts");
  const templatesLocale = readUtf8("src", "app", "admin", "approval-templates", "page-locale-helpers.ts");
  const historyLocale = readUtf8("src", "app", "admin", "approval-history", "page-locale-helpers.ts");

  const workItem = readUtf8("work-items", "WI-0881-admin-approval-product-mode-cleanup.md");
  const roadmap = readUtf8("ROADMAP.md");

  assertProductModeGate(policyPage, "approval-policy/page.tsx");
  assertProductModeGate(templatesPage, "approval-templates/page.tsx");
  assertProductModeGate(historyPage, "approval-history/page.tsx");

  assert.match(policyPage, /Work conditions/);
  assert.match(policyPage, /Advanced options/);
  assert.match(policyPage, /Related workspaces/);

  assert.match(templatesPage, /Work conditions/);
  assert.match(templatesPage, /Advanced options/);
  assert.match(templatesPage, /Related workspaces/);

  assert.match(historyPage, /Work conditions/);
  assert.match(historyPage, /Advanced options/);
  assert.match(historyPage, /Related workspaces/);

  assert.match(policyLocale, /FlowHR 관리자/);
  assert.match(policyLocale, /결재\/위임 정책/);
  assert.match(policyLocale, /작업 조건/);

  assert.match(templatesLocale, /결재 라인 템플릿/);
  assert.match(templatesLocale, /게이트 프리뷰/);
  assert.match(templatesLocale, /작업 조건/);

  assert.match(historyLocale, /결재 단계 이력/);
  assert.match(historyLocale, /게이트 평가 결과/);
  assert.match(historyLocale, /작업 조건/);

  assert.match(workItem, /WI-0881/i);
  assert.match(workItem, /product-mode|devtools|approval-policy|approval-templates|approval-history|locale/i);
  assert.match(roadmap, /WI-0881/i);
}

run()
  .then(() => {
    console.log("e2e-wi0881-admin-approval-product-mode-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
