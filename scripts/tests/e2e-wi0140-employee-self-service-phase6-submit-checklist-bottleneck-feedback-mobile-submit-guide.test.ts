import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    employeePage,
    /integratedSubmitChecklistCards/,
    "employee page should compute integrated submit checklist cards"
  );
  assert.match(
    employeePage,
    /requestBottleneckFeedbackCards/,
    "employee page should compute request bottleneck feedback cards"
  );
  assert.match(employeePage, /mobileSubmitGuideCards/, "employee page should compute mobile submit guide cards");
  assert.match(employeePage, /id="submit-checklist"/, "employee page should expose submit checklist section");
  assert.match(
    employeePage,
    /id="request-bottleneck-feedback"/,
    "employee page should expose request bottleneck feedback section"
  );
  assert.match(employeePage, /id="mobile-submit-guide"/, "employee page should expose mobile submit guide section");
  assert.match(
    employeePage,
    /aria-label="integrated submit checklist"/,
    "employee page should render integrated submit checklist list"
  );
  assert.match(
    employeePage,
    /aria-label="request bottleneck feedback list"/,
    "employee page should render request bottleneck feedback list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile submit guide list"/,
    "employee page should render mobile submit guide list"
  );

  assert.match(employeeLayout, /\/employee#submit-checklist/, "employee nav should include submit checklist anchor");
  assert.match(
    employeeLayout,
    /\/employee#request-bottleneck-feedback/,
    "employee nav should include request bottleneck feedback anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-submit-guide/,
    "employee nav should include mobile submit guide anchor"
  );

  assert.match(globalCss, /\.panel-submit-checklist/, "submit checklist panel style should exist");
  assert.match(globalCss, /\.submit-checklist-grid/, "submit checklist grid style should exist");
  assert.match(globalCss, /\.panel-request-bottleneck-feedback/, "bottleneck feedback panel style should exist");
  assert.match(globalCss, /\.request-bottleneck-list/, "bottleneck feedback list style should exist");
  assert.match(globalCss, /\.panel-mobile-submit-guide/, "mobile submit guide panel style should exist");
  assert.match(globalCss, /\.mobile-submit-guide-list/, "mobile submit guide list style should exist");
  assert.match(
    globalCss,
    /#submit-checklist \.submit-checklist-grid/,
    "submit checklist responsive rule should exist"
  );
  assert.match(
    globalCss,
    /#request-bottleneck-feedback \.request-bottleneck-list/,
    "bottleneck feedback responsive rule should exist"
  );
  assert.match(
    globalCss,
    /#mobile-submit-guide \.mobile-submit-guide-list/,
    "mobile submit guide responsive rule should exist"
  );
}

run();
console.log("e2e-wi0140-employee-self-service-phase6-submit-checklist-bottleneck-feedback-mobile-submit-guide.test passed");
