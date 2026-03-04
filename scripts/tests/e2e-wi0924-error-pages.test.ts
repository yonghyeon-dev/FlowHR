import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function appFilePath(fileName: string) {
  return join(process.cwd(), "src", "app", fileName);
}

function readAppFile(fileName: string) {
  return readFileSync(appFilePath(fileName), "utf8");
}

async function run() {
  const notFoundFilePath = appFilePath("not-found.tsx");
  const errorFilePath = appFilePath("error.tsx");
  const globalErrorFilePath = appFilePath("global-error.tsx");

  assert.equal(existsSync(notFoundFilePath), true, "not-found.tsx should exist");
  assert.equal(existsSync(errorFilePath), true, "error.tsx should exist");
  assert.equal(existsSync(globalErrorFilePath), true, "global-error.tsx should exist");

  const notFoundSource = readAppFile("not-found.tsx");
  const errorSource = readAppFile("error.tsx");
  const globalErrorSource = readAppFile("global-error.tsx");

  assert.match(notFoundSource, /페이지를 찾을 수 없습니다/, "not-found.tsx should include Korean 404 copy");
  assert.match(errorSource, /문제가 발생했습니다/, "error.tsx should include Korean runtime error copy");
  assert.match(globalErrorSource, /문제가 발생했습니다/, "global-error.tsx should include Korean global error copy");
}

run()
  .then(() => {
    console.log("e2e-wi0924-error-pages.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
