import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0782-login-role-based-auto-redirect.md");
  const loginPage = readUtf8("src", "app", "login", "page.tsx");

  assert.match(roadmap, /WI-0782/);
  assert.match(workItem, /Login Role-Based Auto Redirect/i);

  assert.match(loginPage, /useRouter/);
  assert.match(loginPage, /router\.replace\(target\)/);
  assert.match(loginPage, /role === "admin" \|\| role === "payroll_operator" \|\| role === "manager"/);
  assert.match(loginPage, /Session detected\. Redirecting to your role workspace\./);
  assert.match(loginPage, /세션이 확인되어 권한에 맞는 워크스페이스로 자동 이동합니다\./);
}

run()
  .then(() => {
    console.log("e2e-wi0782-login-role-based-auto-redirect.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
