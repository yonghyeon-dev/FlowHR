import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractStringLiterals(block: string) {
  const values: string[] = [];
  const regex = /:\s*"((?:\\"|[^"])*)"/g;
  let match = regex.exec(block);
  while (match) {
    values.push(match[1]);
    match = regex.exec(block);
  }
  return values;
}

async function run() {
  const source = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0477-korean-copy-residual-sweep-payroll-preset-preview.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(source, /ko:\s*defaultCopy/);
  assert.match(source, /presetModeOmittedLabel:\s*string/);
  assert.match(source, /copy\.presetModeOmittedLabel/);

  const koBlockMatch = source.match(/ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:\s*defaultCopy/);
  assert.ok(koBlockMatch, "ko copy block not found");
  const koBlock = koBlockMatch[1] ?? "";

  assert.match(koBlock, /title:\s*"프리셋 모드 샘플 페이로드 미리보기"/);
  assert.match(koBlock, /copyRequestButton:\s*"요청 페이로드 복사"/);
  assert.match(koBlock, /copyTemplateButton:\s*"템플릿 미리보기 복사"/);
  assert.match(koBlock, /copyCombinedButton:\s*"통합 미리보기 복사"/);
  assert.match(koBlock, /shareButton:\s*"미리보기 공유"/);
  assert.match(koBlock, /presetModeOmittedLabel:\s*"\(프리셋 모드에서는 생략\)"/);

  const literals = extractStringLiterals(koBlock);
  const hangulCount = literals.filter((value) => /[\uac00-\ud7a3]/.test(value)).length;
  assert.ok(hangulCount >= 10, `expected at least 10 Korean literals in ko block, got ${hangulCount}`);

  assert.match(workItem, /WI-0477/i);
  assert.match(workItem, /korean|copy|residual|payroll|preset|preview/i);
  assert.match(roadmap, /WI-0477/i);
}

run()
  .then(() => {
    console.log("e2e-wi0477-korean-copy-residual-sweep-payroll-preset-preview.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
