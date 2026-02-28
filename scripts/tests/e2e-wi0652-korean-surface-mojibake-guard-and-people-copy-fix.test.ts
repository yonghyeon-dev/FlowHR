import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const peopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const withholdingRuntimeLabels = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "runtime-label-helpers.ts"
  );
  const contractsRuntimeCopy = readUtf8("src", "components", "contracts", "runtime-copy-helpers.ts");
  const contractsInboxList = readUtf8("src", "components", "contracts", "EmployeeContractsInboxList.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0652-korean-surface-mojibake-guard-and-people-copy-fix.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(peopleView, /"조직도·인사 이력"/);
  assert.match(peopleView, /"조직도, 직원 비교, 인사 이력 카드를 한 화면에서 관리합니다\."/);
  assert.match(peopleView, /"디렉터리 조회"/);
  assert.match(peopleView, /"관리자 대시보드"/);
  assert.match(peopleView, /"부서"/);
  assert.match(peopleView, /"API 호출"/);
  assert.match(peopleView, /"성공"/);
  assert.match(peopleView, /"실패"/);
  assert.match(peopleView, /"요청 로그"/);
  assert.equal(peopleView.includes("조직???"), false);
  assert.equal(peopleView.includes("?�"), false);
  assert.doesNotMatch(peopleView, /\uFFFD/);

  assert.match(
    withholdingRuntimeLabels,
    /"preview receipt": "원천징수영수증 미리보기"/
  );
  assert.match(
    withholdingRuntimeLabels,
    /"load issued document": "원천징수영수증 문서 조회"/
  );
  assert.match(
    withholdingRuntimeLabels,
    /"load finalized settlement": "연말 확정 정산 조회"/
  );
  assert.match(withholdingRuntimeLabels, /return hasLatinText\(normalized\) \? "요청 실행" : normalized;/);
  assert.doesNotMatch(withholdingRuntimeLabels, /먯쿇|곸닔利|곕쭚|붿껌/);

  assert.match(contractsRuntimeCopy, /return `계약서 \$\{stableId\.slice\(0, 8\)\}`;/);
  assert.match(contractsRuntimeCopy, /const fallbackName = `계약-증빙-\$\{stableId\.slice\(0, 8\)\}\$\{extension\}`;/);
  assert.doesNotMatch(contractsRuntimeCopy, /怨꾩빟|利앸튃/);

  assert.match(contractsInboxList, /const unknownDocumentStatusLabelKo = "알 수 없는 상태";/);
  assert.match(contractsInboxList, /const unknownApprovalStatusLabelKo = "알 수 없는 승인 상태";/);

  assert.match(workItem, /WI-0652/i);
  assert.match(workItem, /korean|mojibake|people|contracts|withholding/i);
  assert.match(roadmap, /WI-0652/i);
}

run()
  .then(() => {
    console.log("e2e-wi0652-korean-surface-mojibake-guard-and-people-copy-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
