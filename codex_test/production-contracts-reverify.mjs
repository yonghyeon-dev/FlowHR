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
  return `prod-contracts-reverify-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function waitForSettled(page, timeout = 7000) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function waitForContractsActivity(page, timeout = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const activity = await page
      .evaluate(() => {
        const globalObject = window;
        const fetchLog = Array.isArray(globalObject.__contractsFetchLog)
          ? globalObject.__contractsFetchLog
          : [];
        const hasHeading = Boolean(
          document.querySelector("h1, .page-title")?.textContent?.trim()
        );
        const inlineError = document.querySelector(".inline-error")?.textContent?.trim() ?? "";
        const listItems = document.querySelectorAll("[data-contract-document-id], .contract-document-card, .contract-inbox-item").length;
        return {
          fetchCount: fetchLog.length,
          hasHeading,
          inlineError,
          listItems
        };
      })
      .catch(() => ({ fetchCount: 0, hasHeading: false, inlineError: "", listItems: 0 }));

    if (activity.fetchCount > 0 || activity.inlineError || activity.listItems > 0) {
      return activity;
    }

    await page.waitForTimeout(500);
  }

  return page
    .evaluate(() => {
      const globalObject = window;
      const fetchLog = Array.isArray(globalObject.__contractsFetchLog)
        ? globalObject.__contractsFetchLog
        : [];
      const inlineError = document.querySelector(".inline-error")?.textContent?.trim() ?? "";
      const listItems = document.querySelectorAll("[data-contract-document-id], .contract-document-card, .contract-inbox-item").length;
      return {
        fetchCount: fetchLog.length,
        hasHeading: Boolean(document.querySelector("h1, .page-title")?.textContent?.trim()),
        inlineError,
        listItems
      };
    })
    .catch(() => ({ fetchCount: 0, hasHeading: false, inlineError: "", listItems: 0 }));
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

function attachCollectors(page) {
  const responses = [];
  const requests = [];
  const pageErrors = [];

  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(BASE_URL)) {
      return;
    }
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/api/contracts/")) {
      return;
    }
    requests.push({
      path: `${parsed.pathname}${parsed.search}`,
      method: request.method()
    });
  });

  page.on("response", async (response) => {
    const url = response.url();
    if (!url.startsWith(BASE_URL)) {
      return;
    }
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/api/contracts/")) {
      return;
    }
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

function collectRelevantStatuses(deltaResponses, prefix) {
  return deltaResponses
    .filter((entry) => entry.path.startsWith(prefix))
    .map((entry) => entry.status);
}

async function verifyContractsSurface(browser, runDir, accountKey, route) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ko-KR",
    extraHTTPHeaders: { "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8" }
  });
  await context.addInitScript(() => {
    const globalObject = window;
    if (Array.isArray(globalObject.__contractsFetchLog)) {
      return;
    }

    globalObject.__contractsFetchLog = [];
    const originalFetch = globalObject.fetch.bind(globalObject);
    globalObject.fetch = async (...args) => {
      const input = args[0];
      const init = args[1];
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      if (!requestUrl.includes("/api/contracts/")) {
        return originalFetch(...args);
      }

      const method =
        init?.method ??
        (input instanceof Request ? input.method : "GET");
      const entry = {
        url: requestUrl,
        method,
        startedAt: new Date().toISOString(),
        status: null,
        error: null
      };
      globalObject.__contractsFetchLog.push(entry);

      try {
        const response = await originalFetch(...args);
        entry.status = response.status;
        return response;
      } catch (error) {
        entry.error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    };
  });
  const page = await context.newPage();
  const collectors = attachCollectors(page);

  await login(page, accountKey);
  const snapshot = collectors.snapshot();
  await goto(page, route);
  const activity = await waitForContractsActivity(page);
  await waitForSettled(page, 10000);

  const delta = collectors.consumeSince(snapshot);
  const heading = ((await page.locator("h1, .page-title").first().textContent().catch(() => "")) ?? "").trim();
  const body = ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  const inlineError = ((await page.locator(".inline-error").first().textContent().catch(() => "")) ?? "").trim();
  const fetchLog = await page.evaluate(() => {
    const globalObject = window;
    return Array.isArray(globalObject.__contractsFetchLog) ? globalObject.__contractsFetchLog : [];
  }).catch(() => []);
  const screenshotPath = path.join(runDir, `${accountKey}-contracts.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await context.close();

  return {
    accountKey,
    route,
    heading,
    inlineError,
    bodySnippet: body.slice(0, 300),
    activity,
    requests: delta.requests,
    responses: delta.responses,
    fetchLog,
    pageErrors: delta.pageErrors,
    screenshotPath
  };
}

function evaluateAdmin(result) {
  const documentStatuses = collectRelevantStatuses(result.responses, "/api/contracts/documents");
  const templateStatuses = collectRelevantStatuses(result.responses, "/api/contracts/templates");
  const hasUnauthorized = [...documentStatuses, ...templateStatuses].includes(401);
  const hasSuccessfulDocuments = documentStatuses.includes(200);
  const hasSuccessfulTemplates = templateStatuses.includes(200);

  return {
    passed:
      Boolean(result.heading) &&
      !hasUnauthorized &&
      hasSuccessfulDocuments &&
      hasSuccessfulTemplates &&
      !result.inlineError &&
      result.pageErrors.length === 0,
    details: {
      requests: result.requests,
      fetchLog: result.fetchLog,
      documentStatuses,
      templateStatuses,
      inlineError: result.inlineError,
      pageErrors: result.pageErrors
    }
  };
}

function evaluateEmployee(result) {
  const documentStatuses = collectRelevantStatuses(result.responses, "/api/contracts/documents");
  const hasUnauthorized = documentStatuses.includes(401);
  const hasSuccessfulDocuments = documentStatuses.includes(200);
  const fetchDocumentStatuses = result.fetchLog
    .filter((entry) => String(entry.url).includes("/api/contracts/documents"))
    .map((entry) => entry.status)
    .filter((status) => typeof status === "number");

  return {
    passed:
      Boolean(result.heading) &&
      !hasUnauthorized &&
      !fetchDocumentStatuses.includes(401) &&
      (hasSuccessfulDocuments || fetchDocumentStatuses.includes(200)) &&
      !result.inlineError &&
      result.pageErrors.length === 0,
    details: {
      requests: result.requests,
      fetchLog: result.fetchLog,
      documentStatuses,
      fetchDocumentStatuses,
      inlineError: result.inlineError,
      pageErrors: result.pageErrors
    }
  };
}

function buildMarkdownReport(runId, results, evaluations) {
  const lines = [
    `# ${runId}`,
    "",
    `- Base URL: ${BASE_URL}`,
    `- Executed at: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Admin contracts: ${evaluations.admin.passed ? "PASS" : "FAIL"}`,
    `- Employee contracts: ${evaluations.employee.passed ? "PASS" : "FAIL"}`,
    "",
    "## Details",
    ""
  ];

  for (const key of ["admin", "employee"]) {
    const result = results[key];
    const evaluation = evaluations[key];
    lines.push(`### ${key}`);
    lines.push(`- Route: ${result.route}`);
    lines.push(`- Heading: ${result.heading || "<none>"}`);
    lines.push(`- Inline error: ${result.inlineError || "<none>"}`);
    lines.push(`- Activity: ${JSON.stringify(result.activity)}`);
    lines.push(`- Requests: ${JSON.stringify(result.requests)}`);
    lines.push(`- Responses: ${JSON.stringify(result.responses)}`);
    lines.push(`- Fetch log: ${JSON.stringify(result.fetchLog)}`);
    lines.push(`- Evaluation: ${JSON.stringify(evaluation.details)}`);
    lines.push(`- Page errors: ${JSON.stringify(result.pageErrors)}`);
    lines.push(`- Screenshot: ${path.basename(result.screenshotPath)}`);
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
    const admin = await verifyContractsSurface(browser, runDir, "admin", "/admin/contracts");
    const employee = await verifyContractsSurface(browser, runDir, "employee", "/employee/contracts");

    const evaluations = {
      admin: evaluateAdmin(admin),
      employee: evaluateEmployee(employee)
    };

    const report = {
      runId,
      baseUrl: BASE_URL,
      executedAt: new Date().toISOString(),
      results: { admin, employee },
      evaluations
    };

    await fs.writeFile(path.join(runDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
    await fs.writeFile(
      path.join(runDir, "REPORT.md"),
      buildMarkdownReport(runId, { admin, employee }, evaluations),
      "utf8"
    );

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
