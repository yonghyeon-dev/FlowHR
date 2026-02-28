import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const copy = readUtf8("src", "components", "employee-guide", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0637-employee-guide-korean-copy-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /title: "직원 인앱 가이드"/);
  assert.match(copy, /description: "첫 로그인 이후 근태 정정, 휴가 신청, 명세서 확인까지 핵심 흐름을 빠르게 안내합니다\."/);
  assert.match(copy, /okLabel: "성공"/);
  assert.match(copy, /failLabel: "실패"/);
  assert.match(copy, /attendanceRecords: "근태 기록 조회"/);

  assert.doesNotMatch(copy, /吏곸썝 \?몄빋 媛\?대뱶/);
  assert.doesNotMatch(copy, /\?깃났/);
  assert.doesNotMatch(copy, /\?ㅽ뙣/);

  assert.match(workItem, /WI-0637/i);
  assert.match(roadmap, /WI-0637/i);
}

run()
  .then(() => {
    console.log("e2e-wi0637-employee-guide-korean-copy-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
