import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function objectSectionByBrace(source: string, startToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing start token: ${startToken}`);
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`failed to close object section for token: ${startToken}`);
}

async function run() {
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const adminWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const templateBuilder = readUtf8("src", "components", "contracts", "ContractTemplateBuilder.tsx");
  const workItem = readUtf8("work-items", "WI-0395-contracts-korean-copy-and-error-fallback.md");
  const roadmap = readUtf8("ROADMAP.md");

  const adminAnchor = contractsCopy.indexOf("export const adminContractsCopyByLocale");
  assert.ok(adminAnchor >= 0, "missing admin contracts locale copy");
  const adminKo = objectSectionByBrace(contractsCopy, "ko: {", adminAnchor);
  assert.match(adminKo, /employeeIdLabel:\s*"직원 번호"/);
  assert.match(adminKo, /requiredTemplateAndEmployeeError:\s*"템플릿과 직원 번호를 입력해 주세요"/);
  assert.doesNotMatch(adminKo, /직원 ID/);

  const builderAnchor = contractsCopy.indexOf("export const contractTemplateBuilderCopyByLocale");
  assert.ok(builderAnchor >= 0, "missing contract template builder locale copy");
  const builderKo = objectSectionByBrace(contractsCopy, "ko: {", builderAnchor);
  assert.match(builderKo, /templateIdLabel:\s*"템플릿 번호"/);
  assert.doesNotMatch(builderKo, /템플릿 ID/);

  assert.match(contractsHttp, /readJson\(response: Response, fallbackMessage\?: string\)/);
  assert.match(contractsHttp, /function resolveContractsHttpFallbackMessage\(status: number\)/);
  assert.match(contractsHttp, /fallbackMessage \?\? resolveContractsHttpFallbackMessage\(response\.status\)/);
  assert.match(contractsHttp, /요청이 실패했습니다/);
  assert.match(contractsHttp, /request failed/);

  assert.match(adminWorkspace, /readJson\(response,\s*copy\.loadError\)/);
  assert.match(adminWorkspace, /readJson\(response,\s*copy\.templateCreateError\)/);
  assert.match(adminWorkspace, /readJson\(response,\s*copy\.draftCreateError\)/);
  assert.match(
    adminWorkspace,
    /readJson\(response,\s*`\$\{copy\.actionFailedPrefix\}: \$\{actionLabelByAction\[action\]\}`\)/
  );

  assert.match(employeeInbox, /readJson\(response,\s*copy\.loadError\)/);
  assert.match(employeeInbox, /readJson\(response,\s*copy\.respondError\)/);
  assert.match(employeeInbox, /readJson\(response,\s*copy\.evidenceLoadError\)/);

  assert.match(templateBuilder, /import \{ readJson \} from "@\/components\/contracts\/http";/);
  assert.match(templateBuilder, /readJson\(response,\s*copy\.templateCreateError\)/);
  assert.doesNotMatch(templateBuilder, /async function readJson\(response: Response\)/);

  assert.match(workItem, /WI-0395/i);
  assert.match(workItem, /전자계약함|원천징수|명세서/);
  assert.match(roadmap, /WI-0395/i);
}

run()
  .then(() => {
    console.log("e2e-wi0395-contracts-korean-copy-and-error-fallback.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
