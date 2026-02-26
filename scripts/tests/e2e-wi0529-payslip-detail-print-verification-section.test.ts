import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const detailPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const localeTypes = readUtf8("src", "app", "employee", "payslips", "page-locale-types.ts");
  const localeCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0529-payslip-detail-print-verification-section.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(localeTypes, /printVerificationTitle: string;/);
  assert.match(localeTypes, /printVerificationExpectedNet: string;/);
  assert.match(localeTypes, /printVerificationActualNet: string;/);
  assert.match(localeTypes, /printVerificationResult: string;/);
  assert.match(localeTypes, /printVerificationPass: string;/);
  assert.match(localeTypes, /printVerificationFail: string;/);

  assert.match(localeCopy, /printVerificationTitle: "출력 검증"/);
  assert.match(localeCopy, /printVerificationTitle: "Print verification"/);
  assert.match(localeCopy, /printVerificationExpectedNet:/);
  assert.match(localeCopy, /printVerificationActualNet:/);
  assert.match(localeCopy, /printVerificationResult:/);

  assert.match(detailPanel, /const expectedNetPayKrw = selectedRun/);
  assert.match(detailPanel, /const isNetPayBalanced = selectedRun/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationTitle/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationExpectedNet/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationActualNet/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationResult/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationPass/);
  assert.match(detailPanel, /pageCopy\.detail\.printVerificationFail/);

  assert.ok(
    countLines(detailPanel) <= 240,
    `page-view-detail-panel.tsx should stay <= 240 lines (current: ${countLines(detailPanel)})`
  );

  assert.match(workItem, /WI-0529/i);
  assert.match(workItem, /payslip|print|verification|detail/i);
  assert.match(roadmap, /WI-0529/i);
}

run()
  .then(() => {
    console.log("e2e-wi0529-payslip-detail-print-verification-section.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
