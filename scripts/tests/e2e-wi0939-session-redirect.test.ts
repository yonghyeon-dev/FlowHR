import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "../../src/lib/auth/session-cookie.ts";
import { middleware } from "../../src/middleware.ts";

function buildUnsignedJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString("base64url");
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${header}.${body}.signature`;
}

function buildRequest(path: string, accessToken?: string) {
  const headers = new Headers();
  if (accessToken) {
    headers.set("cookie", `${FLOWHR_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}`);
  }
  return new NextRequest(`http://localhost${path}`, { headers });
}

function readRedirect(response: Response) {
  const location = response.headers.get("location");
  assert.ok(location, "redirect response should include location header");
  return new URL(location, "http://localhost");
}

async function run() {
  const protectedResponse = await middleware(buildRequest("/employee?focus=attendance"));
  assert.equal(protectedResponse.status, 307, "/employee without session should redirect to login");

  const protectedRedirect = readRedirect(protectedResponse);
  assert.equal(protectedRedirect.pathname, "/login", "protected route should redirect to /login");
  assert.equal(
    protectedRedirect.searchParams.get("redirect"),
    "/employee?focus=attendance",
    "redirect query should preserve original path and query"
  );

  const loginResponse = await middleware(buildRequest("/login"));
  assert.equal(loginResponse.status, 200, "/login should pass through without session");
  assert.equal(loginResponse.headers.get("location"), null, "/login should not redirect");

  const apiResponse = await middleware(buildRequest("/api/people/employees"));
  assert.equal(apiResponse.status, 200, "/api/* should pass through without session");
  assert.equal(apiResponse.headers.get("location"), null, "/api/* should not redirect");

  const employeeRoleToken = buildUnsignedJwt({ app_metadata: { role: "employee" } });
  const adminRoleToken = buildUnsignedJwt({ app_metadata: { role: "admin" } });
  const missingRoleToken = buildUnsignedJwt({ sub: "user-123" });

  const adminByEmployeeResponse = await middleware(buildRequest("/admin", employeeRoleToken));
  assert.equal(adminByEmployeeResponse.status, 307, "employee role should not access /admin");
  assert.equal(
    readRedirect(adminByEmployeeResponse).pathname,
    "/employee",
    "employee role should be redirected to /employee"
  );

  const adminByAdminResponse = await middleware(buildRequest("/admin/settings", adminRoleToken));
  assert.equal(adminByAdminResponse.status, 200, "admin role should access /admin");
  assert.equal(adminByAdminResponse.headers.get("location"), null, "admin role should not be redirected");

  const employeeByMissingRoleResponse = await middleware(buildRequest("/employee", missingRoleToken));
  assert.equal(employeeByMissingRoleResponse.status, 307, "missing role should not access /employee");
  assert.equal(
    readRedirect(employeeByMissingRoleResponse).pathname,
    "/login",
    "missing role should be redirected to /login"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0939-session-redirect.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
