import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const leaveAccrualConsole = readUtf8(
    "src",
    "components",
    "leave-accrual",
    "LeaveAccrualAutoGrantConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0706-leave-accrual-ko-normalization-and-session-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(leaveAccrualConsole, /title: "연차 자동 부여 엔진"/);
  assert.match(
    leaveAccrualConsole,
    /description: "조직의 연차 정책을 기준으로 대상 연도의 자동 부여량을 계산하고 드라이런\/실행으로 반영합니다\."/
  );
  assert.match(leaveAccrualConsole, /backToAdminAction: "관리자 대시보드"/);
  assert.match(leaveAccrualConsole, /statusRequestFailed: "요청이 실패했습니다\. 로그를 확인해 주세요\."/);
  assert.doesNotMatch(leaveAccrualConsole, /\?곗감/);
  assert.doesNotMatch(leaveAccrualConsole, /\?몄뀡/);

  assert.match(
    leaveAccrualConsole,
    /\{showDevTools \? \(\s*<p className="small">[\s\S]*sessionOrganizationLabel[\s\S]*sessionAdminLabel[\s\S]*\) : null\}/
  );

  assert.match(workItem, /WI-0706/i);
  assert.match(workItem, /leave-accrual|ko|normalization|session|devtools/i);
  assert.match(roadmap, /WI-0706/i);
}

run()
  .then(() => {
    console.log("e2e-wi0706-leave-accrual-ko-normalization-and-session-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
