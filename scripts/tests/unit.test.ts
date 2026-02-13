import assert from "node:assert/strict";
import { calculateGrossPay, derivePayableMinutes, workedMinutes } from "../../src/lib/payroll-rules.ts";

const checkIn = new Date("2026-02-02T09:00:00+09:00");
const checkOut = new Date("2026-02-02T18:00:00+09:00");
const worked = workedMinutes(checkIn, checkOut, 60);
assert.equal(worked, 480, "worked minutes should subtract break");

const split = derivePayableMinutes(
  new Date("2026-02-10T09:00:00+09:00"),
  new Date("2026-02-10T19:30:00+09:00"),
  60,
  false
);
assert.deepEqual(
  split,
  { regular: 480, overtime: 90, night: 0, holiday: 0 },
  "split should cap regular time at 480 minutes"
);

const gross = calculateGrossPay(split, 12500);
assert.equal(gross, 128125, "gross pay should follow overtime multiplier");

const overnightSplit = derivePayableMinutes(
  new Date("2026-02-03T22:00:00+09:00"),
  new Date("2026-02-04T06:00:00+09:00"),
  60,
  false
);
assert.deepEqual(overnightSplit, {
  regular: 180,
  overtime: 0,
  night: 240,
  holiday: 0
});
assert.equal(calculateGrossPay(overnightSplit, 13000), 123500);

const holidaySplit = derivePayableMinutes(
  new Date("2026-02-09T09:00:00+09:00"),
  new Date("2026-02-09T20:00:00+09:00"),
  60,
  true
);
assert.deepEqual(holidaySplit, {
  regular: 0,
  overtime: 120,
  night: 0,
  holiday: 480
});
assert.equal(calculateGrossPay(holidaySplit, 14000), 231000);

console.log("unit.test passed");
