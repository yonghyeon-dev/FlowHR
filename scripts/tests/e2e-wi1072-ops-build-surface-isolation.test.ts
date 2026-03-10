import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readUtf8(path: string) {
  return readFileSync(path, "utf8");
}

const helper = readUtf8("src/app/ops/devtools.ts");
const opsLayout = readUtf8("src/app/ops/layout.tsx");
const leavePromotionPage = readUtf8("src/app/ops/leave-promotion/page.tsx");
const adminConsolePage = readUtf8("src/app/ops/admin-console/page.tsx");
const adminConsoleClient = readUtf8("src/app/ops/admin-console/page-client.tsx");
const mvpConsolePage = readUtf8("src/app/ops/mvp-console/page.tsx");
const mvpConsoleClient = readUtf8("src/app/ops/mvp-console/page-client.tsx");
const schedulingPage = readUtf8("src/app/ops/scheduling-cockpit/page.tsx");
const schedulingClient = readUtf8("src/app/ops/scheduling-cockpit/page-client.tsx");

assert.match(helper, /export function isOpsDevToolsEnabled\(\)/);
assert.match(opsLayout, /isOpsDevToolsEnabled/);
assert.match(leavePromotionPage, /isOpsDevToolsEnabled/);

assert.match(adminConsolePage, /await import\("\.\/page-client"\)/);
assert.match(mvpConsolePage, /await import\("\.\/page-client"\)/);
assert.match(schedulingPage, /await import\("\.\/page-client"\)/);

assert.match(adminConsolePage, /notFound\(\)/);
assert.match(mvpConsolePage, /notFound\(\)/);
assert.match(schedulingPage, /notFound\(\)/);

assert.match(adminConsoleClient, /^\uFEFF?"use client";/);
assert.match(mvpConsoleClient, /^\uFEFF?"use client";/);
assert.match(schedulingClient, /^\uFEFF?"use client";/);

console.log("ok - WI-1072 ops build surface isolation guard");
