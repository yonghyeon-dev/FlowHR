import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const derivedHook = readUtf8(
    "src",
    "app",
    "employee",
    "page-request-checklist-derived-state.ts"
  );

  const workItem = readUtf8(
    "work-items",
    "WI-0430-employee-request-checklist-derived-hook-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(derivedHook, /export function useEmployeeRequestChecklistDerivedState\(/);
  assert.match(derivedHook, /buildRequestFeedbackRows/);
  assert.match(derivedHook, /buildRequestSearchRows/);
  assert.match(derivedHook, /buildRequestFailureCauses/);
  assert.match(derivedHook, /buildIntegratedSubmitChecklistCards/);
  assert.match(derivedHook, /latestFailureCauseMessage = requestFailureCauses\[0\]\?\.message \?\? "";/);

  assert.match(employeePage, /useEmployeeRequestChecklistDerivedState/);
  assert.match(employeePage, /requestFeedbackNoReasonProvided: defaultsCopy\.noReasonProvided/);
  assert.match(employeePage, /const requestFailureDefaultsCopy = \{/);
  assert.match(employeePage, /requestFailureDefaultsCopy,/);
  assert.match(employeePage, /correctionValidationCopy/);
  assert.match(employeePage, /submitChecklistCardCopy/);

  const lineCount = employeePage.split(/\r?\n/).length;
  assert.ok(lineCount <= 800, `expected employee page <= 800 lines, got ${lineCount}`);

  assert.match(workItem, /WI-0430/i);
  assert.match(workItem, /employee|request|checklist|derived|hook|extraction|decomposition/i);
  assert.match(roadmap, /WI-0430/i);
}

run()
  .then(() => {
    console.log("e2e-wi0430-employee-request-checklist-derived-hook-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
