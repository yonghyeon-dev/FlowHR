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
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const sideEffectHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-side-effect-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0691-scheduling-anomaly-summary-side-effect-input-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /buildScheduleAnomalySummarySideEffectInput\(\{/);
  assert.match(schedulingService, /emitAnomalySummarySideEffects\(sideEffectContext, summarySideEffectInput\)/);
  assert.match(sideEffectHelpers, /export function buildScheduleAnomalySummarySideEffectInput\(/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0691/i);
  assert.match(workItem, /scheduling|anomaly|summary|side-effect|input|helper|extraction/i);
  assert.match(roadmap, /WI-0691/i);
}

run()
  .then(() => {
    console.log("e2e-wi0691-scheduling-anomaly-summary-side-effect-input-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
