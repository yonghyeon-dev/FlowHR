import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

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

function createRunId() {
  return `prod-year-end-conflict-reverify-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function waitForSettled(page, timeout = 10000) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await waitForSettled(page);
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

function attachCollectors(page) {
  const requests = [];
  const responses = [];
  const pageErrors = [];

  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(BASE_URL) || !url.includes("/api/payroll/year-end")) {
      return;
    }
    const parsed = new URL(url);
    requests.push({
      path: `${parsed.pathname}${parsed.search}`,
      method: request.method()
    });
  });

  page.on("response", (response) => {
    const url = response.url();
    if (!url.startsWith(BASE_URL) || !url.includes("/api/payroll/year-end")) {
      return;
    }
    const parsed = new URL(url);
    responses.push({
      path: `${parsed.pathname}${parsed.search}`,
      status: response.status()
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  return {
    snapshot() {
      return {
        requestCount: requests.length,
        responseCount: responses.length,
        pageErrorCount: pageErrors.length
      };
    },
    consumeSince(snapshot) {
      return {
        requests: requests.slice(snapshot.requestCount),
        responses: responses.slice(snapshot.responseCount),
        pageErrors: pageErrors.slice(snapshot.pageErrorCount)
      };
    }
  };
}

async function runAction(page, collectors, label) {
  const snapshot = collectors.snapshot();
  const button = page.getByRole("button", { name: label }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
  await waitForSettled(page, 12000);
  const delta = collectors.consumeSince(snapshot);
  const statusMessage = ((await page.locator("p.small, p.small.fail").first().textContent().catch(() => "")) ?? "").trim();
  const failurePanelText = ((await page.locator("text=실패 후속 액션").locator("..").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();

  return {
    label,
    requests: delta.requests,
    responses: delta.responses,
    statusMessage,
    failurePanelText,
    pageErrors: delta.pageErrors
  };
}

async function verifyAdminYearEnd(browser, runDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  await login(page, "admin");

  await goto(page, "/admin/payroll-year-end");
  const preview = await runAction(page, collectors, "정산 프리뷰");
  const insurance = await runAction(page, collectors, "보험 정산 대사 불러오기");

  await goto(page, "/admin/payroll-year-end-filing");
  const filingPreview = await runAction(page, collectors, "확정 프리뷰");
  const filingFinalize = await runAction(page, collectors, "정산 확정");
  const filingRefresh = await runAction(page, collectors, "제출 목록 새로고침");
  const ackCatalog = await runAction(page, collectors, "ACK 카탈로그 불러오기");

  const screenshotPath = path.join(runDir, "admin-year-end.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await context.close();

  return {
    preview,
    insurance,
    filingPreview,
    filingFinalize,
    filingRefresh,
    ackCatalog,
    screenshotPath
  };
}

async function verifyEmployeeWithholding(browser, runDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  await login(page, "employee");

  await goto(page, "/employee/withholding-receipt");
  const preview = await runAction(page, collectors, "영수증 미리보기");
  const finalized = await runAction(page, collectors, "확정 정산 불러오기");
  const document = await runAction(page, collectors, "발급 문서 불러오기");

  const screenshotPath = path.join(runDir, "employee-withholding.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await context.close();

  return {
    preview,
    finalized,
    document,
    screenshotPath
  };
}

function buildMarkdown(runId, report) {
  const lines = [
    `# ${runId}`,
    "",
    `- Base URL: ${BASE_URL}`,
    `- Executed at: ${new Date().toISOString()}`,
    ""
  ];

  for (const [sectionName, section] of Object.entries(report.results)) {
    lines.push(`## ${sectionName}`);
    lines.push("");
    for (const [actionName, action] of Object.entries(section)) {
      if (actionName === "screenshotPath") {
        continue;
      }
      lines.push(`### ${actionName}`);
      lines.push(`- Requests: ${JSON.stringify(action.requests)}`);
      lines.push(`- Responses: ${JSON.stringify(action.responses)}`);
      lines.push(`- Status message: ${action.statusMessage || "<none>"}`);
      lines.push(`- Failure panel: ${action.failurePanelText || "<none>"}`);
      lines.push(`- Page errors: ${JSON.stringify(action.pageErrors)}`);
      lines.push("");
    }
    lines.push(`- Screenshot: ${path.basename(section.screenshotPath)}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const runId = createRunId();
  const runDir = path.join(RESULTS_DIR, runId);
  await ensureDir(runDir);

  const browser = await chromium.launch({ headless: true });
  try {
    const admin = await verifyAdminYearEnd(browser, runDir);
    const employee = await verifyEmployeeWithholding(browser, runDir);

    const report = {
      runId,
      baseUrl: BASE_URL,
      executedAt: new Date().toISOString(),
      results: {
        admin,
        employee
      }
    };

    await fs.writeFile(path.join(runDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
    await fs.writeFile(path.join(runDir, "REPORT.md"), buildMarkdown(runId, report), "utf8");

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
