import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0781-admin-dashboard-korean-runtime-copy-normalization.md");
  const pageSource = readUtf8("src", "app", "admin", "page.tsx");
  const hubSource = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const copySource = readUtf8("src", "app", "admin", "page-focus-copy.ts");

  assert.match(roadmap, /WI-0781/);
  assert.match(workItem, /Admin Dashboard Korean Runtime Copy Normalization/i);

  assert.match(pageSource, /관리자 대시보드/);
  assert.match(pageSource, /핵심 지표와 대기 업무를 확인하고, 각 전용 워크스페이스로 이동해 작업하세요/);
  assert.match(pageSource, /출퇴근 승인 대기/);
  assert.match(pageSource, /휴가 승인 대기/);
  assert.match(pageSource, /급여 프리뷰 대기/);
  assert.match(hubSource, /공지\/복리후생\/채용/);

  assert.match(copySource, /우선순위 대기열/);
  assert.match(copySource, /가장 위험한 대기 업무부터 확인하고 전용 워크스페이스로 바로 이동하세요/);
  assert.match(copySource, /긴급/);
  assert.match(copySource, /주의/);
  assert.match(copySource, /안정/);

  assert.ok(!pageSource.includes("??쒕낫??"));
  assert.ok(!copySource.includes("?곗꽑?쒖쐞 ?湲곗뿴"));
}

run()
  .then(() => {
    console.log("e2e-wi0781-admin-dashboard-korean-runtime-copy-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
