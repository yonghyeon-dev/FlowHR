import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminContractsPage = readUtf8("src", "app", "admin", "contracts", "page.tsx");
  const adminContractsWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const adminNavSource = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    adminContractsPage,
    /AdminContractsWorkspace/,
    "admin contracts page should render contracts workspace component"
  );
  assert.match(
    adminContractsWorkspace,
    /from "@\/components\/contracts\/copy"/,
    "contracts workspace should consume contracts locale copy"
  );
  assert.match(
    adminContractsWorkspace,
    /const \{ locale \} = useI18n\(\);/,
    "contracts workspace should consume locale context"
  );
  assert.match(
    adminContractsWorkspace,
    /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/,
    "contracts workspace should resolve runtime locale"
  );
  assert.match(
    contractsCopy,
    /title: "E-Contract Workspace"/,
    "contracts copy should include english workspace title"
  );
  assert.match(
    contractsCopy,
    /title: "전자계약 워크스페이스"/,
    "contracts copy should include korean workspace title"
  );
  assert.match(
    adminContractsWorkspace,
    /id=\"contract-template-library\"/,
    "contracts workspace should expose template library section"
  );
  assert.match(
    adminContractsWorkspace,
    /id=\"contract-signature-readiness\"/,
    "contracts workspace should expose lifecycle section"
  );

  assert.match(
    adminContractsWorkspace,
    /aria-label=\{copy\.templateListAria\}/,
    "contracts workspace should render contract template list"
  );
  assert.match(
    adminContractsWorkspace,
    /aria-label=\{copy\.documentListAria\}/,
    "contracts workspace should render contract document list"
  );

  assert.match(
    adminNavSource,
    /\/admin\/contracts/,
    "admin nav should include contracts route"
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
    "contract lifecycle panel style should exist"
  );
  assert.match(
    globalCss,
    /\.contract-signature-readiness-list/,
    "contract lifecycle list style should exist"
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
