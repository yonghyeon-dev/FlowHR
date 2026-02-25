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
  return /^FlowHR$/.test(token) || /^EMP-\d+$/.test(token) || /^EMP$/.test(token);
}

async function run() {
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const contractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0401-korean-copy-residual-sweep-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const koSources = [
    { name: "withholding-receipt", source: withholdingConsole },
    { name: "payslip-receipts", source: payslipReceiptCopy },
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

  assert.match(contractsWorkspace, /aria-label=\{copy\.summaryKpiAria\}/);
  assert.doesNotMatch(contractsWorkspace, /aria-label="contract summary kpi"/);

  assert.match(workItem, /WI-0401/i);
  assert.match(workItem, /원천징수|명세서|전자계약/i);
  assert.match(roadmap, /WI-0401/i);
}

run()
  .then(() => {
    console.log("e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
