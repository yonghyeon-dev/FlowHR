import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const homePage = readUtf8("src", "app", "page.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const workItem = readUtf8("work-items", "WI-0356-home-locale-devtools-copy-gap-fix.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(messages, /"home\.employee\.openOverview"/);
  assert.match(messages, /"home\.employee\.openPayslips"/);
  assert.match(messages, /"home\.devtools\.adminConsoleLegacy"/);
  assert.match(messages, /"home\.devtools\.mvpConsole"/);
  assert.match(messages, /"home\.devtools\.schedulingCockpit"/);

  assert.match(homePage, /getRequestLocale/);
  assert.match(homePage, /const isKoLocale = locale === "ko"/);
  assert.match(homePage, /href="\/employee\/payslips"|href="\/employee\/payslips"/);
  assert.match(homePage, /showDevTools/);
  assert.match(homePage, /Developer tools remain on separate ops-only surfaces|개발자 도구는 별도 ops 표면에서만 노출됩니다/);

  assert.match(workItem, /WI-0356/i);
  assert.match(workItem, /home/i);
  assert.match(roadmap, /WI-0356/i);
}

run()
  .then(() => {
    console.log("e2e-wi0356-home-locale-devtools-copy-gap-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
