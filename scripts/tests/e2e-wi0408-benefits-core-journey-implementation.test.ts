import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const catalogApiRoute = readUtf8("src", "app", "api", "benefits", "catalog", "route.ts");
  const requestsApiRoute = readUtf8("src", "app", "api", "benefits", "requests", "route.ts");
  const decisionApiRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "requests",
    "[requestId]",
    "decision",
    "route.ts"
  );
  const store = readUtf8("src", "features", "benefits", "store.ts");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const adminWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const employeeWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const adminPage = readUtf8("src", "app", "admin", "benefits", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "benefits", "page.tsx");

  const workItem = readUtf8("work-items", "WI-0408-benefits-core-journey-implementation.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(catalogApiRoute, /export async function GET/);
  assert.match(catalogApiRoute, /export async function POST/);
  assert.match(catalogApiRoute, /listBenefitCatalogQuerySchema/);
  assert.match(catalogApiRoute, /createBenefitCatalogSchema/);

  assert.match(requestsApiRoute, /export async function GET/);
  assert.match(requestsApiRoute, /export async function POST/);
  assert.match(requestsApiRoute, /listBenefitRequestsQuerySchema/);
  assert.match(requestsApiRoute, /createBenefitRequestSchema/);

  assert.match(decisionApiRoute, /decideBenefitRequestSchema/);
  assert.match(decisionApiRoute, /decideBenefitRequest\(/);

  assert.match(store, /initialCatalogStore/);
  assert.match(store, /initialRequestStore/);
  assert.match(store, /export function listBenefitCatalog/);
  assert.match(store, /export function createBenefitRequest/);
  assert.match(store, /export function decideBenefitRequest/);

  assert.match(copy, /resolveAdminBenefitsCopy/);
  assert.match(copy, /resolveEmployeeBenefitsCopy/);

  assert.ok(adminWorkspace.includes("/api/benefits/catalog"));
  assert.ok(adminWorkspace.includes("/api/benefits/requests"));
  assert.match(adminWorkspace, /resolveAdminBenefitsCopy/);

  assert.ok(employeeWorkspace.includes("/api/benefits/catalog"));
  assert.ok(employeeWorkspace.includes("/api/benefits/requests"));
  assert.match(employeeWorkspace, /resolveEmployeeBenefitsCopy/);

  assert.match(adminPage, /AdminBenefitsWorkspace/);
  assert.match(employeePage, /EmployeeBenefitsWorkspace/);

  assert.match(workItem, /WI-0408/i);
  assert.match(workItem, /benefit|catalog|request|decision|core journey/i);
  assert.match(roadmap, /WI-0408/i);
}

run()
  .then(() => {
    console.log("e2e-wi0408-benefits-core-journey-implementation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
