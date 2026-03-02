import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0783-login-korean-label-normalization.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const koBlockMatch = messages.match(/ko:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*en:\s*\{/);
  const koBlock = koBlockMatch?.[1] ?? "";

  assert.match(roadmap, /WI-0783/);
  assert.match(workItem, /Login Korean Label Normalization/i);

  assert.match(koBlock, /"login\.userId": "사용자 ID"/);
  assert.match(koBlock, /"login\.email": "이메일"/);
  assert.match(koBlock, /"login\.role": "역할"/);
  assert.match(koBlock, /"login\.organization": "조직"/);
  assert.match(koBlock, /"login\.actorIdOptional": "액터 ID\(선택\)"/);
  assert.match(koBlock, /"login\.password": "비밀번호"/);
}

run()
  .then(() => {
    console.log("e2e-wi0783-login-korean-label-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
