import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPageHelpers = readUtf8("src", "app", "admin", "page-helpers.ts");
  const adminApiHelpers = readUtf8("src", "app", "admin", "page-api-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0374-admin-runtime-locale-and-api-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /import \{ performAdminApiCall \} from \"@\/app\/admin\/page-api-helpers\";/);
  assert.match(adminPage, /const runtimeLocale = isKoLocale \? "ko-KR" : "en-US";/);
  assert.match(adminPage, /const \{ response, body, log \} = await performAdminApiCall\(/);
  assert.match(adminPage, /setLogs\(\(prev\) => \[log, \.\.\.prev\]\);/);
  assert.match(adminPage, /formatDateTime=\{formatDateTimeByLocale\}/);
  assert.doesNotMatch(adminPage, /toLocaleString\("ko-KR"\)/);

  assert.match(adminPageHelpers, /export function formatDateTime\(value: string \| null, runtimeLocale: string\)/);
  assert.match(adminPageHelpers, /return parsed\.toLocaleString\(runtimeLocale\);/);

  assert.match(adminApiHelpers, /export async function performAdminApiCall/);
  assert.match(adminApiHelpers, /buildAdminRequestHeaders/);
  assert.match(adminApiHelpers, /at: new Date\(\)\.toLocaleString\(input\.runtimeLocale\),/);

  assert.match(workItem, /WI-0374/i);
  assert.match(workItem, /runtime locale/i);
  assert.match(roadmap, /WI-0374/i);
}

run()
  .then(() => {
    console.log("e2e-wi0374-admin-runtime-locale-and-api-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
