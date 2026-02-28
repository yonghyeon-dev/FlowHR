import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0636-admin-dashboard-korean-copy-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /관리자 대시보드/);
  assert.match(adminPage, /핵심 지표와 대기 업무를 확인하고, 각 전용 워크스페이스로 이동해 작업하세요\./);
  assert.match(adminPage, /출퇴근 승인 대기/);
  assert.match(adminPage, /급여 프리뷰 대기/);
  assert.match(adminPage, /공지\/복리후생\/채용/);

  assert.doesNotMatch(adminPage, /濡쒓렇/);
  assert.doesNotMatch(adminPage, /愿由ъ옄/);
  assert.doesNotMatch(adminPage, /\?닿\?/);

  assert.match(workItem, /WI-0636/i);
  assert.match(roadmap, /WI-0636/i);
}

run()
  .then(() => {
    console.log("e2e-wi0636-admin-dashboard-korean-copy-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
