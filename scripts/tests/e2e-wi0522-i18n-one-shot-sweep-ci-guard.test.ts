import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const FORBIDDEN_MOJIBAKE_TOKENS = [
  "議곗쭅",
  "吏곸썝",
  "鍮꾪솢",
  "?꾨줈???낅뜲?댄듃",
  "??/span>"
];

const KOREAN_SURFACE_PATHS = [
  ["src", "components", "withholding-receipt", "copy-runtime.ts"],
  ["src", "app", "employee", "payslips", "page-locale-copy.ts"],
  ["src", "components", "contracts", "copy.ts"],
  ["apps", "mobile", "src", "navigation", "RootNavigator.js"],
  ["apps", "mobile", "src", "screens", "LoginScreen.js"],
  ["apps", "mobile", "src", "screens", "AdminHomeScreen.js"],
  ["apps", "mobile", "src", "screens", "EmployeeHomeScreen.js"]
];

function assertNoMojibake(pathParts: string[]) {
  const source = readUtf8(...pathParts);
  for (const token of FORBIDDEN_MOJIBAKE_TOKENS) {
    assert.equal(
      source.includes(token),
      false,
      `${pathParts.join("/")} should not contain mojibake token: ${token}`
    );
  }
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0522-i18n-one-shot-sweep-and-ci-guard.md");
  const codexGuide = readUtf8("docs", "codex-guide.md");

  assert.match(workItem, /WI-0522/i);
  assert.match(workItem, /i18n|one-shot|sweep|ci|guard/i);
  assert.match(roadmap, /WI-0522/i);

  assert.match(codexGuide, /I18N One-Shot Guard \(WI-0522\)/);
  assert.match(codexGuide, /single sweep/i);
  assert.match(codexGuide, /three times in a row/i);

  for (const pathParts of KOREAN_SURFACE_PATHS) {
    assertNoMojibake(pathParts);
  }

  const recentRoadmapBlock =
    roadmap.includes("WI-0510") ? roadmap.slice(roadmap.indexOf("WI-0510")) : roadmap;
  assert.doesNotMatch(
    recentRoadmapBlock,
    /korean[^\n]*(phase\s*[2-9]|upgrade-[2-9]|hardening-plus)/i
  );
}

run()
  .then(() => {
    console.log("e2e-wi0522-i18n-one-shot-sweep-ci-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
