import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  normalizeContractsErrorMessageForRuntime,
  readJson,
  setContractsRuntimeLocale
} from "@/components/contracts/http";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function expectReadJsonErrorMessage(response: Response) {
  try {
    await readJson(response);
    throw new Error("readJson should throw on non-OK response");
  } catch (error) {
    assert.ok(error instanceof Error);
    return error.message;
  }
}

async function run() {
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8("work-items", "WI-0489-contracts-http-fallback-runtime-alignment.md");
  const roadmap = readUtf8("ROADMAP.md");

  setContractsRuntimeLocale("ko");

  assert.equal(
    normalizeContractsErrorMessageForRuntime(
      "approval can be requested only from DRAFT state",
      "요청이 실패했습니다"
    ),
    "승인 요청은 초안 상태에서만 가능합니다."
  );
  assert.equal(
    normalizeContractsErrorMessageForRuntime(
      "document approval must be completed before sending",
      "요청이 실패했습니다"
    ),
    "문서를 발송하려면 승인 완료가 필요합니다."
  );
  assert.equal(
    normalizeContractsErrorMessageForRuntime(
      "employee response is allowed only when status is SENT",
      "요청이 실패했습니다"
    ),
    "직원 응답은 발송 완료 상태에서만 가능합니다."
  );
  assert.equal(
    normalizeContractsErrorMessageForRuntime("expectedDocumentHash mismatch", "요청이 실패했습니다"),
    "문서 해시가 일치하지 않습니다. 최신 문서로 다시 시도해 주세요."
  );
  assert.equal(
    normalizeContractsErrorMessageForRuntime(
      "renew is allowed only for SIGNED/REJECTED/EXPIRED documents",
      "요청이 실패했습니다"
    ),
    "갱신은 서명/거절/만료 상태 문서에서만 가능합니다."
  );
  assert.equal(
    normalizeContractsErrorMessageForRuntime("contract template not found", "요청이 실패했습니다"),
    "계약 템플릿을 찾을 수 없습니다."
  );

  const koFallbackMessage = await expectReadJsonErrorMessage(
    new Response("not-json", {
      status: 502,
      headers: {
        "content-type": "text/plain"
      }
    })
  );
  assert.equal(koFallbackMessage, "요청이 실패했습니다 (502)");

  setContractsRuntimeLocale("en");
  assert.equal(
    normalizeContractsErrorMessageForRuntime(
      "approval can be requested only from DRAFT state",
      "request failed"
    ),
    "approval can be requested only from DRAFT state"
  );

  const enFallbackMessage = await expectReadJsonErrorMessage(
    new Response("not-json", {
      status: 502,
      headers: {
        "content-type": "text/plain"
      }
    })
  );
  assert.equal(enFallbackMessage, "request failed (502)");

  setContractsRuntimeLocale(null);

  assert.match(contractsHttp, /approval\\s\*can\\s\*be\\s\*requested\\s\*only\\s\*from\\s\*draft\\s\*state/i);
  assert.match(
    contractsHttp,
    /expected\\s\*document\\s\*hash\\s\*mismatch\|expecteddocumenthash\\s\*mismatch/i
  );
  assert.match(workItem, /WI-0489/i);
  assert.match(workItem, /contracts|fallback|runtime|alignment/i);
  assert.match(roadmap, /WI-0489/i);
}

run()
  .then(() => {
    console.log("e2e-wi0489-contracts-http-fallback-runtime-alignment.test passed");
  })
  .catch((error) => {
    setContractsRuntimeLocale(null);
    console.error(error);
    process.exit(1);
  });
