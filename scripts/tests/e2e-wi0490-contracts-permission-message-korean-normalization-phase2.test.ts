import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  normalizeContractsErrorMessageForRuntime,
  setContractsRuntimeLocale
} from "@/components/contracts/http";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0490-contracts-permission-message-korean-normalization-phase2.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  setContractsRuntimeLocale("ko");
  try {
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "contract admin permission required",
        "요청이 실패했습니다 (403)"
      ),
      "계약 관리 권한이 필요합니다."
    );
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "employee can only read own contract documents",
        "요청이 실패했습니다 (403)"
      ),
      "본인 계약 문서만 조회하거나 응답할 수 있습니다."
    );
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "employee can only respond to own document",
        "요청이 실패했습니다 (403)"
      ),
      "본인 계약 문서만 조회하거나 응답할 수 있습니다."
    );
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "contract response permission denied",
        "요청이 실패했습니다 (403)"
      ),
      "계약 응답 또는 증빙 조회 권한이 없습니다."
    );
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "contract signature evidence permission denied",
        "요청이 실패했습니다 (403)"
      ),
      "계약 응답 또는 증빙 조회 권한이 없습니다."
    );
    assert.equal(
      normalizeContractsErrorMessageForRuntime("permission denied by policy", "요청이 실패했습니다 (403)"),
      "권한이 없어 요청을 처리할 수 없습니다."
    );
  } finally {
    setContractsRuntimeLocale(null);
  }

  setContractsRuntimeLocale("en");
  try {
    assert.equal(
      normalizeContractsErrorMessageForRuntime(
        "contract admin permission required",
        "request failed (403)"
      ),
      "contract admin permission required"
    );
  } finally {
    setContractsRuntimeLocale(null);
  }

  assert.match(contractsHttp, /contract\\s\*admin\\s\*permission\\s\*required/i);
  assert.match(
    contractsHttp,
    /employee\\s\*can\\s\*only\\s\*read\\s\*own\\s\*contract\\s\*documents\|employee\\s\*can\\s\*only\\s\*respond\\s\*to\\s\*own\\s\*document/i
  );
  assert.match(
    contractsHttp,
    /contract\\s\*response\\s\*permission\\s\*denied\|contract\\s\*signature\\s\*evidence\\s\*permission\\s\*denied/i
  );

  assert.match(workItem, /WI-0490/i);
  assert.match(workItem, /contracts|permission|korean|normalization/i);
  assert.match(roadmap, /WI-0490/i);
}

run()
  .then(() => {
    console.log("e2e-wi0490-contracts-permission-message-korean-normalization-phase2.test passed");
  })
  .catch((error) => {
    setContractsRuntimeLocale(null);
    console.error(error);
    process.exit(1);
  });
