import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const copySource = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const sectionsSource = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const workItem = readUtf8("work-items", "WI-0360-admin-kpi-locale-residual-cleanup.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copySource, /metricLabel: string;/);
  assert.match(copySource, /logSuccessLabel: string;/);
  assert.match(copySource, /logFailLabel: string;/);
  assert.match(copySource, /organizationIdLabel: "조직 ID"/);
  assert.match(copySource, /accessTokenLabel: "액세스 토큰 \(선택\)"/);

  assert.match(sectionsSource, /<th>\{copy\.metricLabel\}<\/th>/);
  assert.match(
    sectionsSource,
    /log\.ok \? copy\.logSuccessLabel : copy\.logFailLabel/
  );
  assert.doesNotMatch(sectionsSource, /<th>Metric<\/th>/);
  assert.doesNotMatch(sectionsSource, /log\.ok \? "OK" : "FAIL"/);

  assert.match(workItem, /WI-0360/i);
  assert.match(workItem, /admin-kpi/i);
  assert.match(roadmap, /WI-0360/i);
}

run()
  .then(() => {
    console.log("e2e-wi0360-admin-kpi-locale-residual-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
