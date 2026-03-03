import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const schema = readUtf8("prisma", "schema.prisma");
  const migration = readUtf8(
    "prisma",
    "migrations",
    "202603030001_wi0816_benefits_db_read_model",
    "migration.sql"
  );
  const dataAccess = readUtf8("src", "features", "shared", "data-access.ts");
  const memoryDataAccess = readUtf8("src", "features", "shared", "memory-data-access.ts");
  const prismaDataAccess = readUtf8("src", "features", "shared", "prisma-data-access.ts");
  const benefitsStore = readUtf8("src", "features", "benefits", "store.ts");
  const catalogRoute = readUtf8("src", "app", "api", "benefits", "catalog", "route.ts");
  const requestsRoute = readUtf8("src", "app", "api", "benefits", "requests", "route.ts");
  const decisionRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "requests",
    "[requestId]",
    "decision",
    "route.ts"
  );
  const cancelRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "requests",
    "[requestId]",
    "cancel",
    "route.ts"
  );
  const workItem = readUtf8("work-items", "WI-0816-benefits-db-persistence-read-model.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schema, /model BenefitCatalogItem \{/);
  assert.match(schema, /model BenefitRequest \{/);
  assert.match(schema, /enum BenefitCatalogStatus \{/);
  assert.match(schema, /enum BenefitRequestStatus \{/);
  assert.match(schema, /benefitCatalogItems BenefitCatalogItem\[\]/);
  assert.match(schema, /benefitRequests BenefitRequest\[\]/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "BenefitCatalogItem"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "BenefitRequest"/);
  assert.match(migration, /CREATE TYPE "BenefitCatalogStatus"/);
  assert.match(migration, /CREATE TYPE "BenefitRequestStatus"/);

  assert.match(dataAccess, /export type BenefitCatalogItemEntity = \{/);
  assert.match(dataAccess, /export type BenefitRequestEntity = \{/);
  assert.match(dataAccess, /export interface BenefitStore \{/);
  assert.match(dataAccess, /benefits: BenefitStore;/);

  assert.match(memoryDataAccess, /benefitCatalogItems: Map<string, BenefitCatalogItemEntity>;/);
  assert.match(memoryDataAccess, /benefitRequests: Map<string, BenefitRequestEntity>;/);
  assert.match(memoryDataAccess, /benefits: \{/);

  assert.match(prismaDataAccess, /const benefits: BenefitStore = \{/);
  assert.match(prismaDataAccess, /prisma\.benefitCatalogItem\./);
  assert.match(prismaDataAccess, /prisma\.benefitRequest\./);
  assert.match(prismaDataAccess, /benefits,/);

  assert.match(benefitsStore, /import \{ getRuntimeDataAccess \} from "@\/features\/shared\/runtime-data-access";/);
  assert.match(benefitsStore, /dataAccess: Pick<DataAccess, "benefits">/);
  assert.match(benefitsStore, /ensureInitialBenefitSeed/);
  assert.match(benefitsStore, /initialCatalogStore/);
  assert.match(benefitsStore, /initialRequestStore/);

  assert.match(catalogRoute, /const items = await listBenefitCatalog\(/);
  assert.match(catalogRoute, /const created = await createBenefitCatalogItem\(/);
  assert.match(requestsRoute, /const requests = await listBenefitRequests\(/);
  assert.match(requestsRoute, /const benefit = await findBenefitCatalogItem\(/);
  assert.match(requestsRoute, /const created = await createBenefitRequest\(/);
  assert.match(decisionRoute, /const updated = await decideBenefitRequest\(/);
  assert.match(cancelRoute, /const existing = await findBenefitRequest\(/);
  assert.match(cancelRoute, /const updated = await cancelBenefitRequest\(/);

  assert.match(workItem, /WI-0816/i);
  assert.match(workItem, /benefits|db|persistence|read model|data access/i);
  assert.match(roadmap, /WI-0816/i);
}

run()
  .then(() => {
    console.log("e2e-wi0816-benefits-db-persistence-read-model.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

