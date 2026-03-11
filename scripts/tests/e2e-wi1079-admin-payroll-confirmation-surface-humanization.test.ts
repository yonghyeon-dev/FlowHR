import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const panelSource = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminPayrollPanel.tsx"),
  "utf8"
);
const stateSource = readFileSync(
  path.join(process.cwd(), "src/app/admin/payroll-close/preview-builder/page-state.ts"),
  "utf8"
);

assert.match(
  panelSource,
  /confirmTarget:\s*"확정 대상 프리뷰"|confirmTarget:\s*"Preview to confirm"/,
  "payroll panel should expose a human-readable confirmation target label"
);
assert.doesNotMatch(
  panelSource,
  /최근 Run ID|Recent run ID/,
  "payroll panel should not expose raw run-id wording"
);
assert.match(
  panelSource,
  /previewedPayroll\.map\(\(run\) => \(/,
  "payroll panel should render confirmation targets from previewed payroll entries"
);
assert.match(
  stateSource,
  /if \(previewedPayroll\.length === 0\) \{[\s\S]*setLastPayrollRunId\(\"\"\)/,
  "preview-builder state should clear the selected confirmation target when no preview remains"
);
assert.match(
  stateSource,
  /previewedPayroll\.some\(\(run\) => run\.id === lastPayrollRunId\)/,
  "preview-builder state should keep confirmation target selection aligned with available preview entries"
);

console.log("e2e-wi1079-admin-payroll-confirmation-surface-humanization.test passed");
