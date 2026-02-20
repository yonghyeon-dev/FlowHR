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

  assert.match(employeePage, /requestFeedbackStatusFilter/, "employee page should track feedback status filter");
  assert.match(employeePage, /timelineChannelFilter/, "employee page should track timeline channel filter");
  assert.match(employeePage, /timelineStatusFilter/, "employee page should track timeline status filter");
  assert.match(employeePage, /filteredMobileRequestTimeline/, "employee page should compute filtered mobile timeline");
  assert.match(employeePage, /attendancePreSubmitChecks/, "employee page should compute attendance pre-submit checks");
  assert.match(employeePage, /leavePreSubmitChecks/, "employee page should compute leave pre-submit checks");
  assert.match(employeePage, /leavePreSubmitValid/, "employee page should compute leave pre-submit validity");
  assert.match(employeePage, /id="request-timeline"/, "employee page should render request timeline panel");
  assert.match(
    employeePage,
    /aria-label="모바일 요청 이력 타임라인"/,
    "employee page should render mobile request timeline list"
  );
  assert.match(
    employeePage,
    /aria-label="출퇴근 제출 직전 검증"/,
    "employee page should render attendance pre-submit validation list"
  );
  assert.match(
    employeePage,
    /aria-label="휴가 제출 직전 검증"/,
    "employee page should render leave pre-submit validation list"
  );

  assert.match(employeeLayout, /\/employee#request-timeline/, "employee nav should include request timeline anchor");

  assert.match(globalCss, /\.panel-request-timeline/, "request timeline panel style should exist");
  assert.match(globalCss, /\.request-filter-row/, "feedback status filter row style should exist");
  assert.match(globalCss, /\.timeline-filter-grid/, "timeline filter grid style should exist");
  assert.match(globalCss, /\.mobile-request-timeline-list/, "mobile request timeline list style should exist");
  assert.match(globalCss, /\.pre-submit-check-list/, "pre-submit check list style should exist");
  assert.match(
    globalCss,
    /#request-timeline \.timeline-filter-grid/,
    "timeline filter grid should include mobile responsive style"
  );
}

run();
console.log("e2e-wi0136-employee-self-service-phase4-timeline-status-filter-pre-submit-feedback.test passed");
