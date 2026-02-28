import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollCloseConsole = readUtf8("src", "components", "payroll-close", "PayrollClosePeriodConsole.tsx");
  const payrollCloseCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const payrollCloseTypes = readUtf8("src", "components", "payroll-close", "types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0331-admin-payroll-close-locale-dynamic-ui-gap-fix-phase8.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollCloseConsole, /from "@\/components\/payroll-close\/copy"/);
  assert.match(payrollCloseConsole, /const \{ locale \} = useI18n\(\);/);
  assert.match(payrollCloseConsole, /const copy = payrollCloseCopyByLocale\[locale\];/);
  assert.match(payrollCloseConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(payrollCloseConsole, /copy\.title/);
  assert.match(payrollCloseConsole, /copy\.inputTitle/);
  assert.match(payrollCloseConsole, /copy\.runStatesTitle/);
  assert.match(payrollCloseConsole, /copy\.totalsDeltaTitle/);
  assert.match(payrollCloseConsole, /copy\.apiLogsTitle/);
  assert.match(payrollCloseConsole, /formatKrw\(result\.summary\.totalsKrw\.grossPayKrw, runtimeLocale\)/);
  assert.match(payrollCloseConsole, /formatKrw\(parsed\.summary\.settlementKrw\.remittanceDeltaKrw, runtimeLocale\)/);
  assert.match(payrollCloseConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(payrollCloseConsole, /copy\.okLabel/);
  assert.match(payrollCloseConsole, /copy\.failLabel/);
  assert.doesNotMatch(payrollCloseConsole, /<h1>Payroll Close Period<\/h1>/);
  assert.doesNotMatch(payrollCloseConsole, /<h2>Input<\/h2>/);
  assert.doesNotMatch(payrollCloseConsole, /No API call yet\./);

  assert.match(payrollCloseCopy, /export const payrollCloseCopyByLocale/);
  assert.match(payrollCloseCopy, /title: "급여 마감"/);
  assert.match(payrollCloseCopy, /title: "Payroll Close Period"/);
  assert.match(payrollCloseCopy, /previewAction: "마감 미리보기"/);
  assert.match(payrollCloseCopy, /previewAction: "Preview Close"/);
  assert.match(payrollCloseCopy, /okLabel: "성공"/);
  assert.match(payrollCloseCopy, /okLabel: "OK"/);

  assert.match(payrollCloseTypes, /export function formatKrw\(value: number, runtimeLocale: string\)/);

  assert.match(workItem, /WI-0331/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0331/i);
}

run()
  .then(() => {
    console.log("e2e-wi0331-admin-payroll-close-locale-dynamic-ui-gap-fix-phase8.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
