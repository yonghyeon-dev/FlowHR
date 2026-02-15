import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();

function resolveAlias(specifier) {
  if (!specifier.startsWith("@/")) {
    return null;
  }

  const rest = specifier.slice(2); // remove "@/"
  const base = path.join(repoRoot, "src", rest);

  const hasExt = path.extname(base).length > 0;
  const candidates = hasExt
    ? [base]
    : [
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        path.join(base, "index.ts"),
        path.join(base, "index.tsx"),
        path.join(base, "index.js")
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const resolved = resolveAlias(specifier);
  if (resolved) {
    return nextResolve(resolved, context);
  }
  return nextResolve(specifier, context);
}
