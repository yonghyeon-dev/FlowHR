import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminContractsPage = readUtf8("src", "app", "admin", "contracts", "page.tsx");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    adminContractsPage,
    /contractTemplateRows/,
    "admin contracts page should define contract template rows"
  );
  assert.match(
    adminContractsPage,
    /filteredContractTemplates/,
    "admin contracts page should compute filtered contract templates"
  );
  assert.match(
    adminContractsPage,
    /contractSignatureReadinessCards/,
    "admin contracts page should compute contract signature readiness cards"
  );
  assert.match(
    adminContractsPage,
    /runContractReadinessAction/,
    "admin contracts page should expose readiness action handler"
  );

  assert.match(
    adminContractsPage,
    /id="contract-template-library"/,
    "admin contracts page should expose contract template library section"
  );
  assert.match(
    adminContractsPage,
    /id="contract-signature-readiness"/,
    "admin contracts page should expose contract signature readiness section"
  );

  assert.match(
    adminContractsPage,
    /aria-label="contract template list"/,
    "admin contracts page should render contract template list"
  );
  assert.match(
    adminContractsPage,
    /aria-label="contract signature readiness list"/,
    "admin contracts page should render contract signature readiness list"
  );

  assert.match(
    adminLayout,
    /\/admin\/contracts/,
    "admin nav should include contracts route"
  );
  assert.match(
    adminLayout,
    /\/admin\/contracts#contract-template-library/,
    "admin nav should include contract template library anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/contracts#contract-signature-readiness/,
    "admin nav should include contract signature readiness anchor"
  );

  assert.match(
    globalCss,
    /\.panel-contract-template-library/,
    "contract template library panel style should exist"
  );
  assert.match(
    globalCss,
    /\.contract-template-list/,
    "contract template list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-contract-signature-readiness/,
    "contract signature readiness panel style should exist"
  );
  assert.match(
    globalCss,
    /\.contract-signature-readiness-list/,
    "contract signature readiness list style should exist"
  );
  assert.match(
    globalCss,
    /#contract-template-library \.contract-template-list/,
    "responsive rule for contract template list should exist"
  );
  assert.match(
    globalCss,
    /#contract-signature-readiness \.contract-signature-readiness-list/,
    "responsive rule for contract signature readiness list should exist"
  );
}

run();
console.log("e2e-wi0174-admin-contracts-ux-baseline.test passed");
