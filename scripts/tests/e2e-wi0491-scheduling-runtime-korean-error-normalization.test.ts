import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractErrorMessage,
  normalizeSchedulingRuntimeMessage
} from "@/components/scheduling/helpers";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const schedulingHelpers = readUtf8("src", "components", "scheduling", "helpers.ts");
  const workItem = readUtf8("work-items", "WI-0491-scheduling-runtime-korean-error-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(
    normalizeSchedulingRuntimeMessage("employeeId is required for manager schedule list queries", true),
    "관리자 조회에서는 직원 식별자가 필요합니다."
  );
  assert.equal(
    normalizeSchedulingRuntimeMessage("employee can only list own schedules", true),
    "직원은 본인 일정만 조회할 수 있습니다."
  );
  assert.equal(
    normalizeSchedulingRuntimeMessage("overlapping schedule exists", true),
    "이미 겹치는 근무 일정이 존재합니다."
  );
  assert.equal(
    normalizeSchedulingRuntimeMessage("request failed: timeout", true),
    "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
  );
  assert.equal(
    normalizeSchedulingRuntimeMessage("Unhandled Error: 처리 실패", true),
    "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
  );
  assert.equal(
    normalizeSchedulingRuntimeMessage("employee can only list own schedules", false),
    "employee can only list own schedules"
  );

  assert.equal(extractErrorMessage({ error: "schedule not found" }, true), "근무 일정을 찾을 수 없습니다.");
  assert.equal(
    extractErrorMessage({ message: "schedule list requires permission" }, true),
    "권한이 없어 일정 요청을 처리할 수 없습니다."
  );
  assert.equal(extractErrorMessage(null, true), "오류 원인을 확인할 수 없습니다.");

  assert.match(schedulingHelpers, /export function normalizeSchedulingRuntimeMessage\(/);

  assert.ok(
    countLines(schedulingHelpers) <= 280,
    `scheduling/helpers.ts should stay <= 280 lines (current: ${countLines(schedulingHelpers)})`
  );

  assert.match(workItem, /WI-0491/i);
  assert.match(workItem, /scheduling|runtime|korean|error|normalization/i);
  assert.match(roadmap, /WI-0491/i);
}

run()
  .then(() => {
    console.log("e2e-wi0491-scheduling-runtime-korean-error-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
