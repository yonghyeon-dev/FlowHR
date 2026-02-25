import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const searchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const pageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0449-payslips-korean-copy-token-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");
  const koPageCopyBlockMatch = pageCopy.match(
    /resolvePayslipPageCopy\(isKoLocale: boolean\): PayslipPageCopy\s*\{[\s\S]*?if \(isKoLocale\)\s*\{\s*return \{([\s\S]*?)\r?\n\s*\};/
  );
  assert.ok(koPageCopyBlockMatch, "ko page copy block is missing");
  const koPageCopyBlock = koPageCopyBlockMatch?.[1] ?? "";

  assert.match(searchSortCopy, /queryPlaceholder:\s*"예: 실행-2026-01, 확정, 2026.01"/);
  assert.doesNotMatch(searchSortCopy, /queryPlaceholder:\s*"예: RUN-2026-01, 확정, 2026.01"/);
  assert.match(pageCopy, /organizationIdPlaceholder:\s*"예: 조직-00001"/);
  assert.doesNotMatch(pageCopy, /organizationIdPlaceholder:\s*"예: ORG-00001"/);
  assert.match(pageCopy, /bearerPlaceholder:\s*"비어 있으면 세션 기반 액터 헤더 모드가 사용됩니다\."/);
  assert.doesNotMatch(koPageCopyBlock, /x-actor-\*/);

  assert.match(workItem, /WI-0449/i);
  assert.match(workItem, /payslip|korean|copy|normalization|token/i);
  assert.match(roadmap, /WI-0449/i);
}

run()
  .then(() => {
    console.log("e2e-wi0449-payslips-korean-copy-token-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
