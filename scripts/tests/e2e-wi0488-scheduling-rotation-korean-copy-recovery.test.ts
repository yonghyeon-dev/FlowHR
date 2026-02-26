import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function run() {
  const schedulingServiceSource = readUtf8("src", "features", "scheduling", "service.ts");
  const rotationBalanceTestSource = readUtf8(
    "scripts",
    "tests",
    "e2e-wi0057-scheduling-rotation-balance-report.test.ts"
  );
  const workItem = readUtf8("work-items", "WI-0488-scheduling-rotation-korean-copy-recovery.md");
  const roadmap = readUtf8("ROADMAP.md");

  const expectedMessages = [
    "조회 범위에 회전 일정이 없습니다.",
    "현재 범위에서 회전 부하가 균형적입니다.",
    "요일별 배치 편차가 큽니다. 회전 템플릿 순서를 조정하세요.",
    "요일별 계획 근로시간 편차가 큽니다. 템플릿 근무시간 또는 휴게시간을 조정하세요.",
    "활성 요일이 적어 편중 위험이 큽니다. 회전 적용 요일을 확장하세요.",
    "현재 회전 밸런스는 허용 범위입니다."
  ];

  for (const message of expectedMessages) {
    assert.match(schedulingServiceSource, new RegExp(escapeRegExp(message)));
  }

  assert.doesNotMatch(schedulingServiceSource, /議고쉶 踰붿쐞/);
  assert.doesNotMatch(schedulingServiceSource, /\?꾩옱 踰붿쐞/);
  assert.doesNotMatch(schedulingServiceSource, /\?붿씪蹂/);
  assert.doesNotMatch(schedulingServiceSource, /\?쒖꽦/);
  assert.doesNotMatch(schedulingServiceSource, /\?뚯쟾 諛몃윴/);

  assert.match(rotationBalanceTestSource, /요일별 배치 편차가 큽니다/);
  assert.match(rotationBalanceTestSource, /활성 요일이 적어 편중 위험이 큽니다/);

  assert.match(workItem, /WI-0488/i);
  assert.match(workItem, /scheduling|rotation|korean|copy/i);
  assert.match(roadmap, /WI-0488/i);
}

run()
  .then(() => {
    console.log("e2e-wi0488-scheduling-rotation-korean-copy-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
