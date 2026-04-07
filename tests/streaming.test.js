import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { formatStreamTextForDisplay } from "../mockup/scripts/streaming.js";

test("formatStreamTextForDisplay strips JSON structure and keeps human-readable values", () => {
  const raw = `{"summary":"핵심 리서치 결과","keyInsights":["첫 번째 인사이트","두 번째 인사이트"]}`;

  const formatted = formatStreamTextForDisplay(raw);

  assert.match(formatted, /핵심 리서치 결과/);
  assert.match(formatted, /첫 번째 인사이트/);
  assert.match(formatted, /두 번째 인사이트/);
  assert.doesNotMatch(formatted, /"summary"/);
  assert.doesNotMatch(formatted, /[{}[\]]/);
});

test("formatStreamTextForDisplay keeps plain text untouched enough to remain readable", () => {
  const raw = "첫 줄\n둘째 줄";

  const formatted = formatStreamTextForDisplay(raw);

  assert.equal(formatted, raw);
});

test("formatStreamTextForDisplay preserves long text instead of truncating the beginning", () => {
  const raw = "앞".repeat(700) + "\n끝";

  const formatted = formatStreamTextForDisplay(raw);

  assert.equal(formatted, raw);
  assert.ok(formatted.startsWith("앞앞앞"));
  assert.ok(formatted.endsWith("\n끝"));
});

test("stream-text style allows scrolling for long multi-line content", () => {
  const css = fs.readFileSync(new URL("../mockup/styles/theme.css", import.meta.url), "utf8");
  const streamTextBlock = css.match(/\.stream-text\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(streamTextBlock, /overflow-y:\s*auto/);
});

test("approve-gate copy layout uses a scrollable body and responsive grid", () => {
  const css = fs.readFileSync(new URL("../mockup/styles/theme.css", import.meta.url), "utf8");
  const approveGateBlock = css.match(/\.approve-gate\s*\{[^}]+\}/)?.[0] ?? "";
  const approveGateBodyBlock = css.match(/\.approve-gate__body--copy\s*\{[^}]+\}/)?.[0] ?? "";
  const approveCopyGridBlock = css.match(/\.approve-copy-grid\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(approveGateBlock, /max-height:\s*min\(52vh,\s*420px\)/);
  assert.match(approveGateBodyBlock, /overflow-y:\s*auto/);
  assert.match(approveCopyGridBlock, /repeat\(auto-fit,\s*minmax\(180px,\s*1fr\)\)/);
});
