import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const {
  extractGroundingSources,
  createWebResearchService,
  shouldForceFreshWebSearch
} = require("../server/search/web-research.js");

test("shouldForceFreshWebSearch flags latest-product briefs", () => {
  assert.equal(shouldForceFreshWebSearch("맥북 신제품 광고"), true);
  assert.equal(shouldForceFreshWebSearch("최신 아이폰 캠페인"), true);
  assert.equal(shouldForceFreshWebSearch("브랜드 무드보드 광고"), false);
});

test("extractGroundingSources normalizes grounding metadata into title/url pairs", () => {
  const response = {
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://www.apple.com/macbook-pro/", title: "MacBook Pro - Apple" } },
            { web: { uri: "https://www.apple.com/macbook-air/", title: "MacBook Air - Apple" } }
          ]
        }
      }
    ]
  };

  assert.deepEqual(extractGroundingSources(response), [
    { title: "MacBook Pro - Apple", url: "https://www.apple.com/macbook-pro/" },
    { title: "MacBook Air - Apple", url: "https://www.apple.com/macbook-air/" }
  ]);
});

test("createWebResearchService returns summarized web context with sources", async () => {
  const service = createWebResearchService({
    generateGroundedContent: async () => ({
      text: '{"summary":"최신 맥북 라인업이 확인되었습니다.","facts":["MacBook Pro M4 업데이트","MacBook Air 최신 라인업"],"shouldUseWebContext":true}',
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://www.apple.com/macbook-pro/", title: "MacBook Pro - Apple" } }
            ]
          }
        }
      ]
    })
  });

  const result = await service("맥북 신제품 광고");

  assert.equal(result.usedSearch, true);
  assert.equal(result.requiredFreshSearch, true);
  assert.match(result.summary, /최신 맥북 라인업/);
  assert.deepEqual(result.facts, ["MacBook Pro M4 업데이트", "MacBook Air 최신 라인업"]);
  assert.equal(result.sources.length, 1);
});

test("createWebResearchService falls back gracefully when no grounding is available", async () => {
  const service = createWebResearchService({
    generateGroundedContent: async () => ({
      text: '{"summary":"검색 결과 없음","facts":[],"shouldUseWebContext":false}',
      candidates: [{ groundingMetadata: { groundingChunks: [] } }]
    })
  });

  const result = await service("브랜드 광고");

  assert.equal(result.usedSearch, false);
  assert.equal(result.requiredFreshSearch, false);
  assert.deepEqual(result.sources, []);
});
