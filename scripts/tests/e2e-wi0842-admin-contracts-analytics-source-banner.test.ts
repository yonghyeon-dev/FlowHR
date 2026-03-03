import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0842-admin-contracts-analytics-source-banner.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const analyticsSource = searchParams\.get\("source"\)/);
  assert.match(workspace, /analyticsSource === "admin-analytics"/);
  assert.match(workspace, /copy\.analyticsSourceBanner/);
  assert.match(workspace, /copy\.analyticsSourceFocusLabel/);
  assert.match(copy, /analyticsSourceBanner: "Opened from admin analytics"/);
  assert.match(copy, /analyticsSourceBanner: "관리자 분석 화면에서 이동했습니다"/);

  assert.match(workItem, /WI-0842/i);
  assert.match(workItem, /contracts|analytics|source|banner/i);
  assert.match(roadmap, /WI-0842/i);
}

run();
console.log("e2e-wi0842-admin-contracts-analytics-source-banner.test passed");
