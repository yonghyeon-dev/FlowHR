import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const rootNavigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const mobileLocale = readUtf8("apps", "mobile", "src", "lib", "mobileLocale.js");
  const workItem = readUtf8(
    "work-items",
    "WI-0400-mobile-root-navigator-locale-dynamic-title-baseline.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(rootNavigator, /import \{ resolveMobileLocale \} from "\.\.\/lib\/mobileLocale";/);
  assert.match(rootNavigator, /const locale = resolveMobileLocale\(\);/);
  assert.match(rootNavigator, /const appCopy = locale === "ko" \? copy\.ko : copy\.en;/);

  assert.match(rootNavigator, /splashTitle: "FlowHR 모바일"/);
  assert.match(rootNavigator, /splashTitle: "FlowHR Mobile"/);
  assert.match(rootNavigator, /approvalQueue: "승인 대기 큐"/);
  assert.match(rootNavigator, /approvalQueue: "Approval Queue"/);

  assert.match(rootNavigator, /options=\{\{ title: appCopy\.titles\.adminHome \}\}/);
  assert.match(rootNavigator, /options=\{\{ title: appCopy\.titles\.notificationCenter \}\}/);
  assert.match(rootNavigator, /options=\{\{ title: appCopy\.titles\.emailTemplates \}\}/);

  assert.match(mobileLocale, /export function resolveMobileLocale\(\)/);
  assert.match(mobileLocale, /normalized\.startsWith\("ko"\) \? "ko" : "en"/);

  assert.match(workItem, /WI-0400/i);
  assert.match(workItem, /mobile|locale|navigator|title|baseline/i);
  assert.match(roadmap, /WI-0400/i);
}

run()
  .then(() => {
    console.log("e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
