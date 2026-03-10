import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const productLanguageSource = readUtf8("src", "lib", "product-language.ts");
const onboardingSectionsSource = readUtf8(
  "src",
  "components",
  "admin-onboarding",
  "AdminOnboardingSections.tsx"
);
const kpiSectionsSource = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
const peopleFiltersSource = readUtf8(
  "src",
  "app",
  "admin",
  "people",
  "page-view-directory-filters-panel.tsx"
);
const executionConditionsSource = readUtf8(
  "src",
  "app",
  "admin",
  "approval-executions",
  "page-sections-work-conditions.tsx"
);

assert.match(
  productLanguageSource,
  /formatWorkspaceConnectionState/,
  "product language should expose a workspace connection label helper"
);
assert.match(
  productLanguageSource,
  /formatAdminSessionConnectionState/,
  "product language should expose an admin-session connection label helper"
);

for (const source of [
  onboardingSectionsSource,
  kpiSectionsSource,
  peopleFiltersSource,
  executionConditionsSource
]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatAdminSessionConnectionState\(/);
}

assert.doesNotMatch(
  onboardingSectionsSource,
  /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  onboardingSectionsSource,
  /<code>\{sessionActorId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  onboardingSectionsSource,
  /\(\$\{organization\.id\}\)/
);
assert.doesNotMatch(
  kpiSectionsSource,
  /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  kpiSectionsSource,
  /<code>\{sessionActorId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  peopleFiltersSource,
  /<code>\{organizationId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  peopleFiltersSource,
  /<code>\{adminActorId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  executionConditionsSource,
  /<code>\{organizationId \|\| "-"\}<\/code>/
);
assert.doesNotMatch(
  executionConditionsSource,
  /<code>\{adminActorId \|\| "-"\}<\/code>/
);

console.log("e2e-wi1082-admin-dashboard-session-context-humanization.test passed");
