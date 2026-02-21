import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    employeePage,
    /attendanceCorrectionInsightCards/,
    "employee page should compute attendance correction insight cards"
  );
  assert.match(
    employeePage,
    /leaveBalanceForecastCards/,
    "employee page should compute leave balance forecast cards"
  );
  assert.match(
    employeePage,
    /leaveCalendarInsightCards/,
    "employee page should compute leave calendar insight cards"
  );

  assert.match(
    employeePage,
    /id="attendance-correction-insights"/,
    "employee page should expose attendance correction insights section"
  );
  assert.match(
    employeePage,
    /id="leave-balance-forecast"/,
    "employee page should expose leave balance forecast section"
  );
  assert.match(
    employeePage,
    /id="leave-calendar-insights"/,
    "employee page should expose leave calendar insights section"
  );

  assert.match(
    employeePage,
    /aria-label="attendance correction insight list"/,
    "employee page should render attendance correction insight list"
  );
  assert.match(
    employeePage,
    /aria-label="leave balance forecast list"/,
    "employee page should render leave balance forecast list"
  );
  assert.match(
    employeePage,
    /aria-label="leave calendar insight list"/,
    "employee page should render leave calendar insight list"
  );

  assert.match(
    employeePage,
    /jumpToSection\("attendance-correction-insights"\)/,
    "employee page mobile shortcut should jump to attendance correction insights"
  );
  assert.match(
    employeePage,
    /jumpToSection\("leave-balance-forecast"\)/,
    "employee page mobile shortcut should jump to leave balance forecast"
  );
  assert.match(
    employeePage,
    /jumpToSection\("leave-calendar-insights"\)/,
    "employee page mobile shortcut should jump to leave calendar insights"
  );

  assert.match(
    employeeLayout,
    /\/employee#attendance-correction-insights/,
    "employee nav should include attendance correction insights anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#leave-balance-forecast/,
    "employee nav should include leave balance forecast anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#leave-calendar-insights/,
    "employee nav should include leave calendar insights anchor"
  );

  assert.match(
    globalCss,
    /\.panel-attendance-correction-insights/,
    "attendance correction insights panel style should exist"
  );
  assert.match(
    globalCss,
    /\.attendance-correction-insight-list/,
    "attendance correction insight list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-leave-balance-forecast/,
    "leave balance forecast panel style should exist"
  );
  assert.match(
    globalCss,
    /\.leave-balance-forecast-list/,
    "leave balance forecast list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-leave-calendar-insights/,
    "leave calendar insights panel style should exist"
  );
  assert.match(
    globalCss,
    /\.leave-calendar-insight-list/,
    "leave calendar insight list style should exist"
  );

  assert.match(
    globalCss,
    /#attendance-correction-insights \.attendance-correction-insight-list/,
    "responsive rule for attendance correction insights should exist"
  );
  assert.match(
    globalCss,
    /#leave-balance-forecast \.leave-balance-forecast-list/,
    "responsive rule for leave balance forecast should exist"
  );
  assert.match(
    globalCss,
    /#leave-calendar-insights \.leave-calendar-insight-list/,
    "responsive rule for leave calendar insights should exist"
  );
}

run();
console.log(
  "e2e-wi0163-employee-self-service-ux-phase12-attendance-correction-leave-calendar-balance-visualization.test passed"
);
