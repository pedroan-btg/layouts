const fs = require('fs');
const path = require('path');

try {
  const file = path.resolve(__dirname, '..', 'eslint-report.json');
  const text = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(text);
  const errors = data.filter(it => (it.errorCount && it.errorCount > 0) || (it.fatalErrorCount && it.fatalErrorCount > 0));
  console.log('count=' + errors.length);
  for (const it of errors) {
    console.log(it.filePath);
    for (const m of it.messages || []) {
      const sev = m.severity === 2 ? 'error' : 'warn';
      console.log(`- [${sev}] ${m.ruleId}: ${m.message} @ ${m.line}:${m.column}`);
    }
  }
} catch (err) {
  console.error('Failed to read eslint-report.json:', err.message);
  process.exitCode = 1;
}