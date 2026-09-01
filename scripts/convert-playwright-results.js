/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(process.cwd(), 'test-results', 'playwright-results.json');
const outPath = path.resolve(process.cwd(), 'bug_report.md');

function safeText(t) {
  if (!t) return '';
  return t.replace(/\|/g, '│').replace(/\r?\n/g, ' ');
}

if (!fs.existsSync(resultsPath)) {
  console.error('Playwright results not found at', resultsPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const tests = raw['suites'] || raw['tests'] || raw;

const rows = [];
let id = 1;

function walk(node) {
  if (!node) return;
  if (Array.isArray(node)) return node.forEach(walk);
  if (node.type === 'test' || node.tests) {
    const items = node.tests || (node.tests === undefined && node.tests) || [];
    if (node.tests) return node.tests.forEach(walk);
  }
  if (node['results']) {
    node['results'].forEach((r) => {
      if (r.status === 'failed') {
        const title = (node.title || r.title || 'Unknown test');
        const location = (r.location && `${r.location.file}:${r.location.line}`) || '';
        const err = (r.error && r.error.message) || (r.errors && r.errors.map(e=>e.message).join(' | ')) || 'Failed';
        rows.push({
          id: `BR-${String(id).padStart(3, '0')}`,
          module: safeText(title),
          steps: `Run test: ${safeText(title)} ${location}`,
          expected: 'Test should pass',
          actual: safeText(err),
          severity: 'High',
        });
        id++;
      }
    });
  }
  if (node.suites) node.suites.forEach(walk);
  if (node.tests) node.tests.forEach(walk);
}

walk(raw);

if (rows.length === 0) {
  fs.writeFileSync(outPath, '# Bug Report\n\nNo failing tests detected.\n');
  console.log('No failures — wrote', outPath);
  process.exit(0);
}

const header = '| Bug ID | Module | Steps to Reproduce | Expected Result | Actual Result | Severity |\n|--------|--------|--------------------|-----------------|---------------|----------|\n';
const lines = rows.map(r => `| ${r.id} | ${r.module} | ${r.steps} | ${r.expected} | ${r.actual} | ${r.severity} |`).join('\n');
fs.writeFileSync(outPath, '# Bug Report\n\n' + header + lines + '\n');
console.log('Wrote', outPath, 'with', rows.length, 'entries');
