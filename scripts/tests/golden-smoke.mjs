import fs from "node:fs";
import path from "node:path";

const fixtureDir = path.resolve(process.cwd(), "qa", "golden", "fixtures");

if (!fs.existsSync(fixtureDir)) {
  console.error("Golden fixture folder is missing:", fixtureDir);
  process.exit(1);
}

const files = fs.readdirSync(fixtureDir).filter((file) => file.endsWith(".json"));
if (files.length === 0) {
  console.error("No golden fixtures found.");
  process.exit(1);
}

for (const file of files) {
  const filePath = path.join(fixtureDir, file);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!payload.id || !payload.expected || typeof payload.expected.gross_pay_krw !== "number") {
    console.error(`Invalid fixture shape: ${file}`);
    process.exit(1);
  }
}

console.log(`Golden smoke passed (${files.length} fixtures).`);
