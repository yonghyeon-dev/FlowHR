import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractKoBlocks(source: string) {
  const blocks: string[] = [];
  let searchIndex = 0;
  while (searchIndex < source.length) {
    const start = source.indexOf("ko: {", searchIndex);
    if (start < 0) {
      break;
    }
    let depth = 0;
    let end = -1;
    for (let index = start; index < source.length; index += 1) {
      const char = source[index];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }
    assert.ok(end > start, "failed to close ko locale block");
    blocks.push(source.slice(start, end));
    searchIndex = end;
  }
  return blocks;
}

function collectAsciiTokensFromStringLiterals(source: string) {
  const tokens = new Set<string>();
  const literalRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match: RegExpExecArray | null;
  while ((match = literalRegex.exec(source)) !== null) {
    const literal = match[1];
    const tokenMatches = literal.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? [];
    for (const token of tokenMatches) {
      tokens.add(token);
    }
  }
  return Array.from(tokens);
}

function isAllowedKoAsciiToken(token: string) {
  return /^FlowHR$/.test(token) || /^EMP-\d+$/.test(token) || /^EMP$/.test(token) || /^u[0-9A-Fa-f]{4}$/.test(token);
}

async function run() {
  const withholdingCopyRuntime = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const payslipHelpers = readUtf8("src", "app", "employee", "payslips", "page-helpers.ts");
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipDetailPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0526-korean-residual-sweep-withholding-payslip-contracts-one-shot.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const koSources = [
    { name: "withholding-receipt", source: withholdingCopyRuntime },
    { name: "contracts-copy", source: contractsCopy }
  ];

  for (const target of koSources) {
    const koBlocks = extractKoBlocks(target.source);
    assert.ok(koBlocks.length > 0, `expected at least one ko block in ${target.name}`);
    const disallowed = new Set<string>();
    for (const block of koBlocks) {
      const tokens = collectAsciiTokensFromStringLiterals(block);
      for (const token of tokens) {
        if (!isAllowedKoAsciiToken(token)) {
          disallowed.add(token);
        }
      }
    }
    assert.deepEqual(
      Array.from(disallowed),
      [],
      `${target.name} ko copy should not include residual English tokens`
    );
  }

  assert.match(
    contractsHttp,
    /\uC694\uCCAD\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4 \(\$\{status\}\)/
  );

  assert.match(
    payslipHelpers,
    /export function minutesToHours\(minutes: number, isKoLocale = false\)/
  );
  assert.match(payslipHelpers, /const unitLabel = isKoLocale \? "\uC2DC\uAC04" : "h";/);
  assert.match(
    payslipFilterPanel,
    /minutesToHours\(aggregate\.totals\.regular, isKoLocale\)/
  );
  assert.match(
    payslipDetailPanel,
    /minutesToHours\(aggregate\.totals\.regular, isKoLocale\)/
  );

  assert.match(workItem, /WI-0526/i);
  assert.match(workItem, /korean|residual|one-shot|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0526/i);
}

run()
  .then(() => {
    console.log("e2e-wi0526-korean-residual-sweep-withholding-payslip-contracts-one-shot.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
