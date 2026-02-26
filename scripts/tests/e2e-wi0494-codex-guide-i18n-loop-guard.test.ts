import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const codexGuide = readUtf8("docs", "codex-guide.md");
  const workItem = readUtf8(
    "work-items",
    "WI-0494-codex-guide-i18n-loop-guard-and-functional-switch.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(codexGuide, /### 8\. i18n Phase 반복 금지/);
  assert.match(codexGuide, /전수 스윕 1회 \+ CI 회귀 가드/);
  assert.match(codexGuide, /신규 i18n 작업은 QA\/회귀 테스트에서 발견된 결함 수정만 허용/);
  assert.match(codexGuide, /### 9\. i18n 연속 WI 자동 중단 규칙/);
  assert.match(codexGuide, /i18n 성격 WI를 3개 이상 연속으로 진행하는 것/);
  assert.match(codexGuide, /i18n WI가 3개 연속되면 즉시 중단하고 기능 WI로 전환/);

  assert.match(workItem, /WI-0494/i);
  assert.match(workItem, /i18n|loop|guard|functional|switch/i);
  assert.match(roadmap, /WI-0494/i);
}

run()
  .then(() => {
    console.log("e2e-wi0494-codex-guide-i18n-loop-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
