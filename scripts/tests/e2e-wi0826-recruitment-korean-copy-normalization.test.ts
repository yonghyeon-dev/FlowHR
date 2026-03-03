import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const employeeWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const employeeView = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0826-recruitment-korean-copy-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /pageTitle: "채용 워크스페이스"/);
  assert.match(copy, /pageTitle: "채용"/);
  assert.match(copy, /organizationIdLabel: "조직 식별자"/);
  assert.match(copy, /candidateEmailLabel: "후보자 이메일"/);
  assert.match(copy, /submitted: "후보자 추천을 제출했습니다\."/);

  assert.match(
    employeeWorkspace,
    /같은 공고에 진행 중인 추천 후보가 이미 있습니다\./
  );
  assert.match(employeeView, /\{" \/ "\}/);

  assert.doesNotMatch(copy, /梨꾩슜|異붿쿇|議곗쭅|媛숈/);
  assert.doesNotMatch(employeeView, /쨌/);

  assert.match(workItem, /WI-0826/i);
  assert.match(workItem, /recruitment|korean|copy|normalization/i);
  assert.match(roadmap, /WI-0826/i);
}

run()
  .then(() => {
    console.log("e2e-wi0826-recruitment-korean-copy-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
