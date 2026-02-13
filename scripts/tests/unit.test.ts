import assert from "node:assert/strict";
import {
  calculateGrossPay,
  splitPayableMinutes,
  workedMinutes
} from "../../src/lib/payroll-rules.ts";

const checkIn = new Date("2026-02-02T09:00:00+09:00");
const checkOut = new Date("2026-02-02T18:00:00+09:00");
const worked = workedMinutes(checkIn, checkOut, 60);
assert.equal(worked, 480, "worked minutes should subtract break");

const split = splitPayableMinutes(570, false);
assert.deepEqual(
  split,
  { regular: 480, overtime: 90, night: 0, holiday: 0 },
  "split should cap regular time at 480 minutes"
);

const gross = calculateGrossPay(split, 12500);
assert.equal(gross, 128125, "gross pay should follow overtime multiplier");

console.log("unit.test passed");
