import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const coreFiles = [
  ["src", "app", "admin", "page.tsx"],
  ["src", "components", "employee-guide", "copy.ts"],
  ["src", "components", "employee-guide", "EmployeeGuideSections.tsx"]
] as const;

const bannedMojibakePatterns = [
  /濡쒓렇/,
  /愿由ъ옄/,
  /吏곸썝 \?몄빋/,
  /\?깃났/,
  /\?ㅽ뙣/
];

async function run() {
  for (const parts of coreFiles) {
    const source = readUtf8(...parts);
    const name = parts.join("/");
    for (const pattern of bannedMojibakePatterns) {
      assert.doesNotMatch(source, pattern, `${name}: detected mojibake token (${pattern})`);
    }
  }

  const workItem = readUtf8("work-items", "WI-0639-core-korean-mojibake-regression-guard.md");
  const roadmap = readUtf8("ROADMAP.md");
  assert.match(workItem, /WI-0639/i);
  assert.match(roadmap, /WI-0639/i);
}

run()
  .then(() => {
    console.log("e2e-wi0639-core-korean-mojibake-regression-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
