import { ESLint } from "eslint";

async function main() {
  const eslint = new ESLint({ fix: true });

  const results = await eslint.lintFiles(["src/**/*.ts", "src/**/*.html"]);

  // Apply fixes to disk when possible
  await ESLint.outputFixes(results);

  let errorCount = 0;
  let warningCount = 0;

  for (const r of results) {
    for (const m of r.messages || []) {
      const sev = m.severity === 2 ? "error" : "warn";
      const loc = `${m.line ?? 0}:${m.column ?? 0}`;
      const rule = m.ruleId || "unknown";
      console.log(`${r.filePath}:${loc} ${sev} ${rule} ${m.message}`);

      if (m.severity === 2) errorCount++;
      else warningCount++;
    }
  }

  // summary
  console.log(
    `\nESLint summary: ${errorCount} error(s), ${warningCount} warning(s)`,
  );

  if (errorCount > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Failed to run ESLint:", err?.message || err);
  process.exitCode = 1;
});
