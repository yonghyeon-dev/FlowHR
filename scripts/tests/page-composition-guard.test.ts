import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type TrackedBudget = {
  maxLines: number;
  targetLines: number;
};

type PageBudgetConfig = {
  defaultMaxLines: number;
  tracked: Record<string, TrackedBudget>;
};

function toPosixPath(value: string) {
  return value.replace(/\\/g, "/");
}

function readUtf8(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function countLines(filePath: string) {
  return readUtf8(filePath).split(/\r?\n/).length;
}

function collectPageFiles(rootDir: string): string[] {
  const collected: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(nextPath);
        continue;
      }
      if (entry.isFile() && entry.name === "page.tsx") {
        collected.push(nextPath);
      }
    }
  }

  return collected.sort();
}

function run() {
  const rootDir = process.cwd();
  const configPath = path.resolve(rootDir, "qa", "page-size-budget.json");
  const config = JSON.parse(readUtf8(configPath)) as PageBudgetConfig;

  const pageFiles = collectPageFiles(path.resolve(rootDir, "src", "app"));
  const trackedPaths = new Set(Object.keys(config.tracked));
  const visitedTrackedPaths = new Set<string>();

  const summary: Array<{ path: string; lines: number; budget: number; tracked: boolean }> = [];

  for (const absoluteFilePath of pageFiles) {
    const relativePath = toPosixPath(path.relative(rootDir, absoluteFilePath));
    const lines = countLines(absoluteFilePath);

    const trackedBudget = config.tracked[relativePath];
    if (trackedBudget) {
      visitedTrackedPaths.add(relativePath);
      assert.ok(
        lines <= trackedBudget.maxLines,
        `[page-budget] ${relativePath} is ${lines} lines (max ${trackedBudget.maxLines}, target ${trackedBudget.targetLines})`
      );
      summary.push({ path: relativePath, lines, budget: trackedBudget.maxLines, tracked: true });
      continue;
    }

    assert.ok(
      lines <= config.defaultMaxLines,
      `[page-budget] ${relativePath} is ${lines} lines (default max ${config.defaultMaxLines}). ` +
        "Extract sections/components before adding more."
    );
    summary.push({ path: relativePath, lines, budget: config.defaultMaxLines, tracked: false });
  }

  for (const trackedPath of trackedPaths) {
    assert.ok(visitedTrackedPaths.has(trackedPath), `[page-budget] tracked page not found: ${trackedPath}`);
  }

  const top = summary.sort((left, right) => right.lines - left.lines).slice(0, 8);
  const lines = top.map((item) => {
    const mark = item.tracked ? "tracked" : "default";
    return `- ${item.path}: ${item.lines}/${item.budget} (${mark})`;
  });

  console.log("page-composition-guard.test passed");
  console.log(lines.join("\n"));
}

run();
