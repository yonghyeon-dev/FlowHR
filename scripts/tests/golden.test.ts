import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  calculateGrossPay,
  defaultMultipliers,
  derivePayableMinutes
} from "../../src/lib/payroll-rules.ts";

type AnyObject = Record<string, unknown>;

type ResolvedInput = {
  checkInAt: Date;
  checkOutAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  hourlyRate: number;
  multipliers: typeof defaultMultipliers;
};

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new Error(`invalid ${fieldName}`);
  }
  return value;
}

function requireNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number") {
    throw new Error(`invalid ${fieldName}`);
  }
  return value;
}

function resolveInput(raw: AnyObject): ResolvedInput {
  const original = (raw.original as AnyObject | undefined) ?? {};
  const correction = (raw.approved_correction as AnyObject | undefined) ?? {};
  const retroactive = (raw.retroactive_update as AnyObject | undefined) ?? {};

  let checkIn = (raw.check_in as string | undefined) ?? (original.check_in as string | undefined);
  let checkOut = (raw.check_out as string | undefined) ?? (original.check_out as string | undefined);

  if (typeof correction.corrected_check_in === "string") {
    checkIn = correction.corrected_check_in;
  }
  if (typeof retroactive.check_out === "string") {
    checkOut = retroactive.check_out;
  }

  const breakMinutes =
    (raw.break_minutes as number | undefined) ?? (original.break_minutes as number | undefined) ?? 0;
  const hourlyRate = requireNumber(raw.hourly_rate_krw, "hourly_rate_krw");

  const multipliers = {
    ...defaultMultipliers,
    ...((raw.multipliers as AnyObject | undefined) ?? {})
  };

  return {
    checkInAt: new Date(requireString(checkIn, "check_in")),
    checkOutAt: new Date(requireString(checkOut, "check_out")),
    breakMinutes,
    isHoliday: Boolean(raw.is_holiday),
    hourlyRate,
    multipliers
  };
}

const fixtureDir = path.resolve(process.cwd(), "qa", "golden", "fixtures");
const files = fs.readdirSync(fixtureDir).filter((name) => name.endsWith(".json"));
assert.ok(files.length > 0, "golden fixtures should exist");

for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8")) as {
    id: string;
    inputs: AnyObject;
    expected: {
      payable_minutes: Record<string, number>;
      gross_pay_krw: number;
    };
  };

  const input = resolveInput(payload.inputs);
  const split = derivePayableMinutes(
    input.checkInAt,
    input.checkOutAt,
    input.breakMinutes,
    input.isHoliday
  );
  const gross = calculateGrossPay(split, input.hourlyRate, input.multipliers);

  assert.deepEqual(
    split,
    payload.expected.payable_minutes,
    `payable minutes mismatch for fixture ${payload.id}`
  );
  assert.equal(gross, payload.expected.gross_pay_krw, `gross pay mismatch for fixture ${payload.id}`);
}

console.log(`golden.test passed (${files.length} fixtures)`);
