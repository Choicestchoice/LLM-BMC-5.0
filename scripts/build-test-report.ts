#!/usr/bin/env node
/**
 * Reads test-results/results.json (vitest JSON reporter output) and writes
 * a human-friendly Markdown + HTML report to test-results/report.{md,html}.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const IN = resolve("test-results/results.json");
const OUT_DIR = resolve("test-results");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(IN)) {
  console.error("No results.json found. Run `bun run test` first.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(IN, "utf8"));

type Assertion = {
  ancestorTitles: string[];
  title: string;
  fullName: string;
  status: "passed" | "failed" | "pending" | "skipped" | "todo";
  failureMessages?: string[];
  duration?: number;
};
type Suite = {
  name: string;
  status: string;
  assertionResults: Assertion[];
};

const suites: Suite[] = raw.testResults ?? [];
const totals = raw.numTotalTests ?? 0;
const passed = raw.numPassedTests ?? 0;
const failed = raw.numFailedTests ?? 0;
const skipped = (raw.numPendingTests ?? 0) + (raw.numTodoTests ?? 0);
const startedAt = raw.startTime ? new Date(raw.startTime).toISOString() : "";

const lines: string[] = [];
lines.push(`# Test report`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
if (startedAt) lines.push(`Run started: ${startedAt}`);
lines.push("");
lines.push(`## Summary`);
lines.push("");
lines.push(`| Metric | Count |`);
lines.push(`| --- | --- |`);
lines.push(`| Total | ${totals} |`);
lines.push(`| Passed | ${passed} |`);
lines.push(`| Failed | ${failed} |`);
lines.push(`| Skipped | ${skipped} |`);
lines.push("");
lines.push(`## Features`);
lines.push("");

for (const s of suites) {
  const short = s.name.split(/[\\/]/).slice(-2).join("/");
  lines.push(`### ${short}`);
  lines.push("");
  lines.push(`| Status | Test | Duration (ms) |`);
  lines.push(`| :---: | --- | ---: |`);
  for (const a of s.assertionResults) {
    const icon =
      a.status === "passed" ? "✅" : a.status === "failed" ? "❌" : "⏭️";
    const name = [...a.ancestorTitles, a.title].join(" › ");
    lines.push(`| ${icon} | ${name} | ${a.duration ?? 0} |`);
  }
  const failures = s.assertionResults.filter((a) => a.status === "failed");
  if (failures.length) {
    lines.push("");
    lines.push(`**Failures:**`);
    lines.push("");
    for (const f of failures) {
      lines.push(`- **${f.fullName}**`);
      for (const m of f.failureMessages ?? []) {
        lines.push("");
        lines.push("```");
        lines.push(m);
        lines.push("```");
      }
    }
  }
  lines.push("");
}

const md = lines.join("\n");
writeFileSync(resolve(OUT_DIR, "report.md"), md);

const rowsHtml = suites
  .map((s) => {
    const short = s.name.split(/[\\/]/).slice(-2).join("/");
    const body = s.assertionResults
      .map((a) => {
        const cls =
          a.status === "passed"
            ? "pass"
            : a.status === "failed"
              ? "fail"
              : "skip";
        const name = [...a.ancestorTitles, a.title].join(" › ");
        return `<tr class="${cls}"><td>${a.status}</td><td>${escapeHtml(name)}</td><td>${a.duration ?? 0}</td></tr>`;
      })
      .join("");
    return `<h3>${escapeHtml(short)}</h3><table><thead><tr><th>Status</th><th>Test</th><th>ms</th></tr></thead><tbody>${body}</tbody></table>`;
  })
  .join("");

const html = `<!doctype html><meta charset="utf-8"><title>Test report</title>
<style>
body{font:14px system-ui;margin:2rem;max-width:960px}
table{border-collapse:collapse;width:100%;margin-bottom:1.5rem}
th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
th{background:#f5f5f5}
tr.pass td:first-child{color:#0a7f2e;font-weight:600}
tr.fail td:first-child{color:#c1121f;font-weight:600}
tr.skip td:first-child{color:#8a6d3b;font-weight:600}
.summary{display:flex;gap:1rem;margin:1rem 0}
.card{padding:1rem 1.5rem;border:1px solid #ddd;border-radius:8px}
</style>
<h1>Test report</h1>
<p>Generated ${new Date().toISOString()}</p>
<div class="summary">
  <div class="card"><strong>Total</strong><div>${totals}</div></div>
  <div class="card"><strong>Passed</strong><div>${passed}</div></div>
  <div class="card"><strong>Failed</strong><div>${failed}</div></div>
  <div class="card"><strong>Skipped</strong><div>${skipped}</div></div>
</div>
${rowsHtml}`;
writeFileSync(resolve(OUT_DIR, "report.html"), html);

console.log(
  `Report written: test-results/report.md, test-results/report.html`,
);
console.log(`Totals — passed ${passed}, failed ${failed}, skipped ${skipped}`);

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}
