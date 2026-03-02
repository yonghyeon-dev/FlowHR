import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const workItem = readUtf8("work-items", "WI-0808-employee-notices-initial-auto-load.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(board, /import \{ useEffect, useMemo, useState \} from "react";/);
  assert.match(board, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(board, /exhaustive-deps -- one-shot auto-load intentionally keys off session readiness only/);
  assert.match(board, /useEffect\(\(\) => \{ if \(autoLoadAttempted \|\| \(!organizationId\.trim\(\) && !usesBearerToken\)\) return; setAutoLoadAttempted\(true\); void loadNotices\(\); \}, \[autoLoadAttempted, organizationId, usesBearerToken\]\);/);
  assert.match(workItem, /WI-0808/i);
  assert.match(workItem, /employee|notices|initial|auto|load/i);
  assert.match(roadmap, /WI-0808/i);
}

run();
console.log("e2e-wi0808-employee-notices-initial-auto-load.test passed");
