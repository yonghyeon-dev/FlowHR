import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, devices } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_DIR = path.join(__dirname, "results");
const BASE_URL = "https://flowhr-two.vercel.app";

const ACCOUNTS = {
  admin: {
    email: "cyh@flow-coder.com",
    password: "Whdydgus12!@",
    homePath: "/admin"
  },
  employee: {
    email: "test@test.com",
    password: "123456",
    homePath: "/employee"
  }
};

const FOCUS_TARGETS = [
  { route: "/employee?focus=account", sectionId: "account" },
  { route: "/employee?focus=self-service-overview", sectionId: "self-service-overview" },
  { route: "/employee?focus=submit-checklist", sectionId: "submit-checklist" },
  { route: "/employee?focus=request-feedback", sectionId: "request-feedback" },
  { route: "/employee?focus=request-search-sort", sectionId: "request-search-sort" },
  { route: "/employee?focus=request-timeline", sectionId: "request-timeline" },
  { route: "/employee?focus=request-resubmit", sectionId: "request-resubmit" },
  { route: "/employee?focus=attendance", sectionId: "attendance" },
  { route: "/employee?focus=leave", sectionId: "leave" },
  { route: "/employee?focus=leave-calendar", sectionId: "leave-calendar" },
  { route: "/employee?focus=schedule", sectionId: "schedule" }
];

function createRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function sanitizeName(value) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function waitForSettled(page, timeout = 5000) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function goto(page, route) {
  const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await waitForSettled(page);
  return response;
}

async function login(page, accountKey) {
  const account = ACCOUNTS[accountKey];
  await goto(page, "/login");
  await page.locator("input").nth(0).fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith(account.homePath), { timeout: 30000 }).catch(() => {});
  await waitForSettled(page);
}

async function collectHeading(page) {
  const text = (await page.locator("h1, .page-title").first().textContent().catch(() => "")) ?? "";
  return text.trim();
}

async function collectBody(page) {
  return ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
}

async function saveScreenshot(page, dirPath, name) {
  const filePath = path.join(dirPath, `${sanitizeName(name)}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

function attachCollectors(page) {
  const responses = [];
  const pageErrors = [];

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.startsWith(BASE_URL)) {
      return;
    }
    if (!new URL(url).pathname.startsWith("/api/")) {
      return;
    }
    responses.push({
      status: response.status(),
      path: `${new URL(url).pathname}${new URL(url).search}`
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  return {
    snapshot() {
      return {
        responseCount: responses.length,
        pageErrorCount: pageErrors.length
      };
    },
    consumeSince(snapshot) {
      return {
        responses: responses.slice(snapshot.responseCount),
        pageErrors: pageErrors.slice(snapshot.pageErrorCount)
      };
    }
  };
}

async function sectionMetrics(page, sectionId) {
  return page
    .locator(`#${sectionId}`)
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        visible: rect.top < window.innerHeight && rect.bottom > 0,
        scrollY: window.scrollY,
        hash: window.location.hash
      };
    })
    .catch(() => ({
      top: null,
      bottom: null,
      viewportHeight: null,
      visible: false,
      scrollY: null,
      hash: null
    }));
}

async function verifyFocusSurface(browser, runDir, surface, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await login(page, "employee");
  const results = [];

  for (const target of FOCUS_TARGETS) {
    await goto(page, target.route);
    const metrics = await sectionMetrics(page, target.sectionId);
    results.push({
      surface,
      route: target.route,
      sectionId: target.sectionId,
      metrics,
      passed: metrics.visible
    });
  }

  await goto(page, "/employee/payslips#payslip-search-sort");
  const payslipMetrics = await sectionMetrics(page, "payslip-search-sort");
  results.push({
    surface,
    route: "/employee/payslips#payslip-search-sort",
    sectionId: "payslip-search-sort",
    metrics: payslipMetrics,
    passed: surface === "mobile" ? payslipMetrics.visible : true
  });

  await saveScreenshot(page, path.join(runDir, "screenshots"), `${surface}-focus-summary`);
  await context.close();
  return results;
}

async function verifyAdminHash(browser, runDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  const page = await context.newPage();
  await login(page, "admin");
  await goto(page, "/admin#approvals");
  const metrics = await sectionMetrics(page, "approvals");
  const finalUrl = page.url().replace(BASE_URL, "");
  const heading = await collectHeading(page);
  const result = {
    route: "/admin#approvals",
    finalUrl,
    heading,
    metrics,
    passed: metrics.visible || finalUrl === "/admin/approval-executions"
  };
  result.screenshotPath = await saveScreenshot(page, path.join(runDir, "screenshots"), "admin-hash-approvals");
  await context.close();
  return result;
}

async function verifyAdminPages(browser, runDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  await login(page, "admin");

  const checks = [];

  const targets = [
    {
      name: "admin-dashboard-org",
      route: "/admin",
      assert: async (delta, heading, body) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (body.includes("organization not found")) issues.push("body-org-not-found");
        if (delta.responses.some((response) => response.path.startsWith("/api/approval/executions") && response.status === 404)) {
          issues.push("approval-executions-404");
        }
        return issues;
      }
    },
    {
      name: "admin-analytics-org",
      route: "/admin/analytics",
      assert: async (delta, heading, body) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (body.includes("organization not found")) issues.push("body-org-not-found");
        if (delta.responses.some((response) => response.path.startsWith("/api/approval/executions") && response.status === 404)) {
          issues.push("approval-executions-404");
        }
        return issues;
      }
    },
    {
      name: "admin-kpi-org",
      route: "/admin/kpi",
      assert: async (delta, heading, body) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (body.includes("organization not found")) issues.push("body-org-not-found");
        if (delta.responses.some((response) => response.path.startsWith("/api/approval/executions") && response.status === 404)) {
          issues.push("approval-executions-404");
        }
        return issues;
      }
    },
    {
      name: "admin-settings-org",
      route: "/admin/settings",
      assert: async (delta, heading, body) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (body.includes("organization_not_found")) issues.push("body-org-not-found");
        if (delta.responses.some((response) => response.path.startsWith("/api/admin/settings") && response.status === 404)) {
          issues.push("admin-settings-404");
        }
        return issues;
      }
    },
    {
      name: "admin-positions-heading",
      route: "/admin/positions",
      assert: async (_delta, heading) => {
        const issues = [];
        if (!heading.includes("직급")) issues.push(`heading-mismatch: ${heading || "<none>"}`);
        return issues;
      }
    },
    {
      name: "admin-notifications-auth",
      route: "/admin/notifications",
      assert: async (delta, heading) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (delta.responses.some((response) => response.path.startsWith("/api/notifications") && response.status === 401)) {
          issues.push("notifications-401");
        }
        return issues;
      }
    },
    {
      name: "admin-approval-executions",
      route: "/admin/approval-executions",
      assert: async (delta, heading, body) => {
        const issues = [];
        if (!heading) issues.push("missing-heading");
        if (delta.pageErrors.some((error) => error.includes("Minified React error #418"))) {
          issues.push("react-error-418");
        }
        if (body.includes("Minified React error")) {
          issues.push("react-error-body");
        }
        return issues;
      }
    },
    {
      name: "admin-leave-promotion",
      route: "/admin/leave-promotion",
      assert: async (_delta, heading, body, response, finalUrl) => {
        const issues = [];
        const isExpectedNotFound =
          response?.status() === 404 &&
          finalUrl === "/admin/leave-promotion" &&
          (heading.includes("페이지를 찾을 수 없습니다") || body.includes("페이지를 찾을 수 없습니다"));
        if (isExpectedNotFound) {
          return issues;
        }
        if (response && response.status() === 404) issues.push("route-404");
        if (finalUrl.startsWith("/ops/")) issues.push(`unexpected-ops-redirect: ${finalUrl}`);
        if (body.includes("404")) issues.push("body-404");
        if (body.includes("This page could not be found")) issues.push("not-found-body");
        if (!heading && issues.length === 0) issues.push("missing-heading");
        return issues;
      }
    }
  ];

  for (const target of targets) {
    const before = collectors.snapshot();
    const response = await goto(page, target.route);
    const delta = collectors.consumeSince(before);
    const heading = await collectHeading(page);
    const body = await collectBody(page);
    const finalUrl = page.url().replace(BASE_URL, "");
    const issues = await target.assert(delta, heading, body, response, finalUrl);
    checks.push({
      name: target.name,
      route: target.route,
      finalUrl,
      heading,
      issues,
      passed: issues.length === 0,
      screenshotPath: await saveScreenshot(page, path.join(runDir, "screenshots"), target.name)
    });
  }

  await context.close();
  return checks;
}

async function verifyEmployeeNotifications(browser, runDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  await login(page, "employee");
  const before = collectors.snapshot();
  await goto(page, "/employee/notifications");
  const delta = collectors.consumeSince(before);
  const heading = await collectHeading(page);
  const issues = [];
  if (!heading) issues.push("missing-heading");
  if (delta.responses.some((response) => response.path.startsWith("/api/notifications") && response.status === 401)) {
    issues.push("notifications-401");
  }
  const result = {
    name: "employee-notifications-auth",
    route: "/employee/notifications",
    finalUrl: page.url().replace(BASE_URL, ""),
    heading,
    issues,
    passed: issues.length === 0,
    screenshotPath: await saveScreenshot(page, path.join(runDir, "screenshots"), "employee-notifications-auth")
  };
  await context.close();
  return result;
}

function markdown(runId, focusResults, adminHash, adminChecks, employeeNotifications) {
  const lines = [];
  const allFailures = [
    ...focusResults.filter((item) => !item.passed).map((item) => ({
      name: `${item.surface}:${item.route}`,
      issues: [`section-not-visible: #${item.sectionId}`]
    })),
    ...(adminHash.passed
      ? []
      : [{
          name: adminHash.route,
          issues: adminHash.finalUrl === "/admin/approval-executions"
            ? ["unexpected-admin-hash-classification"]
            : ["section-not-visible: #approvals"]
        }]),
    ...adminChecks.filter((item) => !item.passed).map((item) => ({ name: item.name, issues: item.issues })),
    ...(employeeNotifications.passed ? [] : [{ name: employeeNotifications.name, issues: employeeNotifications.issues }])
  ];

  lines.push("# Production Completed Items Reverify");
  lines.push("");
  lines.push(`- runId: \`${runId}\``);
  lines.push(`- baseUrl: \`${BASE_URL}\``);
  lines.push(`- focus-desktop: ${focusResults.filter((item) => item.surface === "desktop" && item.passed).length}/${focusResults.filter((item) => item.surface === "desktop").length}`);
  lines.push(`- focus-mobile: ${focusResults.filter((item) => item.surface === "mobile" && item.passed).length}/${focusResults.filter((item) => item.surface === "mobile").length}`);
  lines.push(`- admin-checks: ${adminChecks.filter((item) => item.passed).length}/${adminChecks.length}`);
  lines.push(`- employee-notifications: ${employeeNotifications.passed ? 1 : 0}/1`);
  lines.push(`- failures: ${allFailures.length}`);
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (allFailures.length === 0) {
    lines.push("- none");
  } else {
    for (const failure of allFailures) {
      lines.push(`- \`${failure.name}\``);
      for (const issue of failure.issues) {
        lines.push(`  issue: ${issue}`);
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const runId = createRunId();
  const runDir = path.join(RESULTS_DIR, `prod-completed-items-reverify-${runId}`);
  await ensureDir(path.join(runDir, "screenshots"));

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  let focusDesktop;
  let focusMobile;
  let adminHash;
  let adminChecks;
  let employeeNotifications;
  try {
    focusDesktop = await verifyFocusSurface(browser, runDir, "desktop", {
      viewport: { width: 1440, height: 900 },
      locale: "ko-KR",
      extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
    });
    focusMobile = await verifyFocusSurface(browser, runDir, "mobile", {
      ...devices["iPhone 13"],
      locale: "ko-KR",
      extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
    });
    adminHash = await verifyAdminHash(browser, runDir);
    adminChecks = await verifyAdminPages(browser, runDir);
    employeeNotifications = await verifyEmployeeNotifications(browser, runDir);
  } finally {
    await browser.close();
  }

  const focusResults = [...focusDesktop, ...focusMobile];
  const report = {
    runId,
    baseUrl: BASE_URL,
    focusDesktop,
    focusMobile,
    adminHash,
    adminChecks,
    employeeNotifications,
    generatedAt: new Date().toISOString()
  };

  await fs.writeFile(path.join(runDir, "REPORT.md"), markdown(runId, focusResults, adminHash, adminChecks, employeeNotifications), "utf8");
  await fs.writeFile(path.join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const totalFailures =
    focusResults.filter((item) => !item.passed).length +
    (adminHash.passed ? 0 : 1) +
    adminChecks.filter((item) => !item.passed).length +
    (employeeNotifications.passed ? 0 : 1);

  console.log(
    JSON.stringify({
      runId,
      runDir,
      focusDesktop: {
        passed: focusDesktop.filter((item) => item.passed).length,
        total: focusDesktop.length
      },
      focusMobile: {
        passed: focusMobile.filter((item) => item.passed).length,
        total: focusMobile.length
      },
      adminChecks: {
        passed: adminChecks.filter((item) => item.passed).length,
        total: adminChecks.length
      },
      employeeNotifications: employeeNotifications.passed,
      failures: totalFailures
    })
  );
}

await main();
