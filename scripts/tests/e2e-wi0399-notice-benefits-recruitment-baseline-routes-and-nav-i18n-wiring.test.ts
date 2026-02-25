import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");

  const adminNoticesPage = readUtf8("src", "app", "admin", "notices", "page.tsx");
  const adminBenefitsPage = readUtf8("src", "app", "admin", "benefits", "page.tsx");
  const adminRecruitmentPage = readUtf8("src", "app", "admin", "recruitment", "page.tsx");
  const employeeBenefitsPage = readUtf8("src", "app", "employee", "benefits", "page.tsx");
  const employeeRecruitmentPage = readUtf8("src", "app", "employee", "recruitment", "page.tsx");

  const workItem = readUtf8(
    "work-items",
    "WI-0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminLayout, /href: "\/admin\/notices", label: t\("admin\.nav\.notices"\)/);
  assert.match(adminLayout, /href: "\/admin\/benefits", label: t\("admin\.nav\.benefits"\)/);
  assert.match(adminLayout, /href: "\/admin\/recruitment", label: t\("admin\.nav\.recruitment"\)/);

  assert.match(employeeLayout, /href: "\/employee\/benefits", label: t\("employee\.nav\.benefits"\)/);
  assert.match(employeeLayout, /href: "\/employee\/recruitment", label: t\("employee\.nav\.recruitment"\)/);

  assert.match(messages, /"admin\.nav\.notices": "공지사항"/);
  assert.match(messages, /"admin\.nav\.benefits": "복리후생"/);
  assert.match(messages, /"admin\.nav\.recruitment": "채용"/);
  assert.match(messages, /"employee\.nav\.benefits": "복리후생"/);
  assert.match(messages, /"employee\.nav\.recruitment": "채용"/);
  assert.match(messages, /"admin\.nav\.notices": "Notices"/);
  assert.match(messages, /"admin\.nav\.benefits": "Benefits"/);
  assert.match(messages, /"admin\.nav\.recruitment": "Recruitment"/);
  assert.match(messages, /"employee\.nav\.benefits": "Benefits"/);
  assert.match(messages, /"employee\.nav\.recruitment": "Recruitment"/);

  assert.match(adminNoticesPage, /id="notice-baseline"/);
  assert.match(adminBenefitsPage, /id="benefits-baseline"/);
  assert.match(adminRecruitmentPage, /id="recruitment-baseline"/);
  assert.match(employeeBenefitsPage, /id="employee-benefits-baseline"/);
  assert.match(employeeRecruitmentPage, /id="employee-recruitment-baseline"/);

  assert.match(workItem, /WI-0399/i);
  assert.match(workItem, /notice|benefits|recruitment|baseline|i18n/i);
  assert.match(roadmap, /WI-0399/i);
}

run()
  .then(() => {
    console.log("e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
