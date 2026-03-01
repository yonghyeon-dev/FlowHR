import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const contractsRuntimeHelper = readUtf8(
    "src",
    "components",
    "contracts",
    "runtime-copy-helpers.ts"
  );
  const withholdingRuntimeHelper = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "runtime-label-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0708-ko-runtime-fallback-normalization-for-contracts-withholding.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(contractsRuntimeHelper, /return `\uacc4\uc57d \$\{stableId\.slice\(0, 8\)\}`;/);
  assert.match(
    contractsRuntimeHelper,
    /const fallbackName = `\uacc4\uc57d-\uc99d\ube59-\$\{stableId\.slice\(0, 8\)\}\$\{extension\}`;/
  );
  assert.doesNotMatch(contractsRuntimeHelper, /\u6028\uaebe\ube5f|\uf761\uc575\ud2c3|\u7b4c\uc573\ube96/);

  assert.match(
    withholdingRuntimeHelper,
    /"withholding receipt preview": "\uc6d0\ucc9c\uc9d5\uc218\uc601\uc218\uc99d \ubbf8\ub9ac\ubcf4\uae30"/
  );
  assert.match(
    withholdingRuntimeHelper,
    /"withholding receipt document": "\uc6d0\ucc9c\uc9d5\uc218\uc601\uc218\uc99d \ubb38\uc11c \uc870\ud68c"/
  );
  assert.match(
    withholdingRuntimeHelper,
    /"year-end finalized settlement": "\uc5f0\ub9d0 \ud655\uc815 \uc815\uc0b0 \uc870\ud68c"/
  );
  assert.match(withholdingRuntimeHelper, /return "\uc694\uccad \uc2e4\ud589";/);
  assert.doesNotMatch(withholdingRuntimeHelper, /\uba37\ucfe7|\ubb38\ub9ac|\uc758\uace0\uc270|\uc720\uc61f\ud38d/);

  assert.match(workItem, /WI-0708/i);
  assert.match(workItem, /contracts|withholding|ko|fallback|normalization/i);
  assert.match(roadmap, /WI-0708/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0708-ko-runtime-fallback-normalization-for-contracts-withholding.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
