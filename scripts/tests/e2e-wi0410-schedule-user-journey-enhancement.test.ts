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
  const scheduleBoard = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const scheduleBoardView = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoardView.tsx");
  const scheduleCopy = readUtf8("src", "components", "scheduling", "copy.ts");
  const scheduleHelpers = readUtf8("src", "components", "scheduling", "helpers.ts");
  const workItem = readUtf8("work-items", "WI-0410-schedule-user-journey-enhancement.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(scheduleBoard, /import EmployeeScheduleBoardView from "@\/components\/scheduling\/EmployeeScheduleBoardView";/);
  assert.match(scheduleBoard, /buildCurrentWeekDateRange/);
  assert.match(scheduleBoard, /buildNextWeekDateRange/);
  assert.match(scheduleBoard, /statusFilter/);
  assert.match(scheduleBoard, /holidayFilter/);
  assert.match(scheduleBoard, /resolveScheduleTimeStatus/);
  assert.match(scheduleBoard, /nextSchedule/);

  assert.match(scheduleBoardView, /copy\.statusFilterLabel/);
  assert.match(scheduleBoardView, /copy\.holidayFilterLabel/);
  assert.match(scheduleBoardView, /copy\.nextShiftTitle/);
  assert.match(scheduleBoardView, /copy\.listFilteredEmpty/);
  assert.match(scheduleBoardView, /copy\.summaryUpcomingShifts/);
  assert.match(scheduleBoardView, /copy\.summaryInProgressShifts/);
  assert.match(scheduleBoardView, /copy\.summaryCompletedShifts/);

  assert.match(scheduleCopy, /currentWeekAction/);
  assert.match(scheduleCopy, /nextWeekAction/);
  assert.match(scheduleCopy, /statusFilterLabel/);
  assert.match(scheduleCopy, /holidayFilterLabel/);
  assert.match(scheduleCopy, /nextShiftTitle/);
  assert.match(scheduleCopy, /statusUpcoming/);
  assert.match(scheduleCopy, /statusInProgress/);
  assert.match(scheduleCopy, /statusCompleted/);
  assert.match(scheduleCopy, /currentWeekAction:\s*"이번 주"/);
  assert.match(scheduleCopy, /nextWeekAction:\s*"Next week"/);

  assert.match(scheduleHelpers, /export type ScheduleStatusFilter/);
  assert.match(scheduleHelpers, /export type ScheduleHolidayFilter/);
  assert.match(scheduleHelpers, /export function buildCurrentWeekDateRange/);
  assert.match(scheduleHelpers, /export function buildNextWeekDateRange/);
  assert.match(scheduleHelpers, /export function resolveScheduleTimeStatus/);

  assert.ok(
    countLines(scheduleBoard) <= 300,
    `EmployeeScheduleBoard.tsx must stay <= 300 lines (current: ${countLines(scheduleBoard)})`
  );
  assert.ok(
    countLines(scheduleBoardView) <= 300,
    `EmployeeScheduleBoardView.tsx must stay <= 300 lines (current: ${countLines(scheduleBoardView)})`
  );

  assert.match(workItem, /WI-0410/i);
  assert.match(workItem, /schedule|journey|filter|next shift/i);
  assert.match(roadmap, /WI-0410/i);
}

run()
  .then(() => {
    console.log("e2e-wi0410-schedule-user-journey-enhancement.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
