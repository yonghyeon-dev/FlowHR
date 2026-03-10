import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const productLanguageSource = readFileSync(
  path.join(process.cwd(), "src/lib/product-language.ts"),
  "utf8"
);
const onboardingSource = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx"),
  "utf8"
);
const peopleHelpersSource = readFileSync(
  path.join(process.cwd(), "src/app/admin/people/page-helpers.ts"),
  "utf8"
);

assert.match(
  productLanguageSource,
  /formatOrganizationDisplayName/,
  "product language helpers should expose an organization display fallback"
);
assert.match(
  productLanguageSource,
  /formatDepartmentDisplayName/,
  "product language helpers should expose a department display fallback"
);
assert.match(
  productLanguageSource,
  /formatPositionDisplayName/,
  "product language helpers should expose a position display fallback"
);
assert.match(
  onboardingSource,
  /selectedOrganizationLabel = formatOrganizationDisplayName\(organizationName, runtimeLocale\)/,
  "onboarding panel should use a humanized organization fallback label"
);
assert.doesNotMatch(
  onboardingSource,
  /organizationName\.trim\(\) \|\| organizationId\.trim\(\)/,
  "onboarding panel should not fall back to raw organization IDs"
);
assert.match(
  peopleHelpersSource,
  /formatOrganizationDisplayName\(/,
  "admin people helpers should use humanized organization fallback labels"
);
assert.match(
  peopleHelpersSource,
  /formatDepartmentDisplayName\(/,
  "admin people helpers should use humanized department fallback labels"
);
assert.match(
  peopleHelpersSource,
  /formatPositionDisplayName\(/,
  "admin people helpers should use humanized position fallback labels"
);

console.log("e2e-wi1081-admin-organization-fallback-humanization.test passed");
