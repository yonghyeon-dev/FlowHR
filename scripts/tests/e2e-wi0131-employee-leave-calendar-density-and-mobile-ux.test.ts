import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(employeePage, /휴가 빠른 입력/, "employee leave panel should provide quick preset actions");
  assert.match(employeePage, /연차 잔여 시각화/, "employee leave calendar panel should include leave balance visualization");
  assert.match(employeePage, /캘린더 빠른 이동/, "employee leave calendar panel should provide month shortcuts");
  assert.match(employeePage, /leaveCalendarCells/, "employee leave calendar should compute dense day cells");
  assert.match(employeePage, /leave-calendar-grid/, "employee leave calendar should render monthly density grid");

  assert.match(globalCss, /\.leave-quick-actions/, "leave quick action styles should exist");
  assert.match(globalCss, /\.leave-balance-visual/, "leave balance visualization styles should exist");
  assert.match(globalCss, /\.leave-calendar-grid/, "leave calendar density grid styles should exist");
  assert.match(
    globalCss,
    /#leave-calendar \.leave-calendar-shortcuts/,
    "leave calendar shortcuts should include mobile responsive styles"
  );
}

run();
console.log("e2e-wi0131-employee-leave-calendar-density-and-mobile-ux.test passed");
