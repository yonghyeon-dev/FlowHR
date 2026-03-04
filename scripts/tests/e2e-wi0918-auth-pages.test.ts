import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function filePath(...parts: string[]) {
  return join(process.cwd(), ...parts);
}

function readUtf8(...parts: string[]) {
  return readFileSync(filePath(...parts), "utf8");
}

async function run() {
  const signupPagePath = filePath("src", "app", "(auth)", "signup", "page.tsx");
  const forgotPasswordPagePath = filePath("src", "app", "(auth)", "forgot-password", "page.tsx");
  const resetPasswordPagePath = filePath("src", "app", "(auth)", "reset-password", "page.tsx");
  const loginPageSource = readUtf8("src", "app", "login", "page.tsx");

  assert.equal(existsSync(signupPagePath), true, "signup page should exist");
  assert.equal(existsSync(forgotPasswordPagePath), true, "forgot-password page should exist");
  assert.equal(existsSync(resetPasswordPagePath), true, "reset-password page should exist");

  assert.match(loginPageSource, /href=\"\/signup\"/, "login page should include signup link");
  assert.match(loginPageSource, /href=\"\/forgot-password\"/, "login page should include forgot-password link");
}

run()
  .then(() => {
    console.log("e2e-wi0918-auth-pages.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

