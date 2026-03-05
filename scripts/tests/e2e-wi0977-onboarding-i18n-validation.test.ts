import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0977-onboarding-i18n-validation.md");
  const protectedOnboardingPage = readUtf8("src", "app", "(protected)", "onboarding", "page.tsx");
  const employeeOnboardingPage = readUtf8("src", "app", "employee", "onboarding", "page.tsx");

  assert.match(wi, /WI-0977/);
  assert.match(wi, /useI18n/);
  assert.match(wi, /organizationId/);
  assert.match(wi, /employeeId/);

  assert.match(protectedOnboardingPage, /import \{ useI18n \} from "@\/lib\/i18n\/provider";/);
  assert.match(protectedOnboardingPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(protectedOnboardingPage, /const isKoLocale = locale === "ko";/);
  assert.match(protectedOnboardingPage, /if \(!organizationId\) \{[\s\S]*?setLoadError\(copy\.missingOrganizationIdNotice\);[\s\S]*?return;/);
  assert.match(protectedOnboardingPage, /if \(!organizationId\) \{[\s\S]*?setSubmitError\(copy\.missingOrganizationIdNotice\);[\s\S]*?return;/);
  assert.match(protectedOnboardingPage, /if \(!accessToken\) \{[\s\S]*?setLoadError\(copy\.missingLoginSessionNotice\);[\s\S]*?return;/);
  assert.match(protectedOnboardingPage, /if \(!accessToken\) \{[\s\S]*?setSubmitError\(copy\.missingLoginSessionNotice\);[\s\S]*?return;/);

  assert.match(employeeOnboardingPage, /import \{ useI18n \} from "@\/lib\/i18n\/provider";/);
  assert.match(employeeOnboardingPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(employeeOnboardingPage, /const isKoLocale = locale === "ko";/);
  assert.match(employeeOnboardingPage, /requiresLoginSessionError/);
  assert.match(employeeOnboardingPage, /missingEmployeeIdError/);
  assert.match(employeeOnboardingPage, /if \(!employeeId\) \{[\s\S]*?setPageError\(copy\.missingEmployeeIdError\);[\s\S]*?return;/);
  assert.match(employeeOnboardingPage, /if \(requiresLoginSession\) \{[\s\S]*?setPageError\(copy\.requiresLoginSessionError\);[\s\S]*?return;/);
}

run();
console.log("e2e-wi0977-onboarding-i18n-validation.test passed");
