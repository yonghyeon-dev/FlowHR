import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizePayslipReceiptRuntimeMessage } from "@/components/payslip-receipts/runtime-copy-helpers";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const runtimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0484-korean-runtime-mixed-language-suppression-payslip-receipts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const koFallback = "요청이 실패했습니다. 잠시 후 다시 시도해 주세요.";

  assert.equal(
    normalizePayslipReceiptRuntimeMessage("employee id required (직원)", "ko", koFallback),
    "직원 번호는 필수입니다."
  );
  assert.equal(
    normalizePayslipReceiptRuntimeMessage("Unhandled Error: 처리 실패", "ko", koFallback),
    koFallback
  );
  assert.equal(normalizePayslipReceiptRuntimeMessage("처리 실패", "ko", koFallback), "처리 실패");
  assert.equal(
    normalizePayslipReceiptRuntimeMessage("Unhandled Error: 처리 실패", "en", koFallback),
    "Unhandled Error: 처리 실패"
  );

  assert.match(runtimeHelpers, /resolveKnownKoRuntimeMessage\(normalized\)/);
  assert.match(runtimeHelpers, /return hasLatinText\(normalized\) \? koFallback : normalized;/);

  assert.match(workItem, /WI-0484/i);
  assert.match(workItem, /korean|runtime|mixed|payslip|receipt/i);
  assert.match(roadmap, /WI-0484/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0484-korean-runtime-mixed-language-suppression-payslip-receipts.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
