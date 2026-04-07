const { extractJson } = require("../lib/llm.js");

function shouldForceFreshWebSearch(query) {
  const text = String(query || "").toLowerCase();
  if (!text.trim()) return false;

  const freshnessKeywords = ["latest", "new", "current", "today", "recent", "신제품", "최신", "현재", "요즘", "이번"];
  const productKeywords = ["macbook", "iphone", "ipad", "galaxy", "pixel", "맥북", "아이폰", "아이패드", "갤럭시"];

  return freshnessKeywords.some((keyword) => text.includes(keyword)) ||
    productKeywords.some((keyword) => text.includes(keyword));
}

function extractGroundingSources(response) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set();
  const sources = [];

  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    const title = chunk?.web?.title;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title: title || url, url });
  }

  return sources;
}

async function defaultGenerateGroundedContent(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    return { text: "", candidates: [] };
  }

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text || "",
    candidates: response.candidates || []
  };
}

function createWebResearchService({ generateGroundedContent = defaultGenerateGroundedContent } = {}) {
  return async function gatherWebResearchContext(query) {
    const requiredFreshSearch = shouldForceFreshWebSearch(query);
    const prompt = `아래 광고 브리프에 대해 최신 공개 웹 정보를 확인하세요.
브리프: "${query}"

${requiredFreshSearch ? "이 요청은 최신 공개 정보 확인이 필수이므로 반드시 웹검색 결과를 반영하세요." : "최신성이 의미 있게 필요한 경우에만 웹검색 결과를 사용하고, 그렇지 않으면 shouldUseWebContext를 false로 두세요."}
정확한 JSON으로만 응답하세요:
{
  "shouldUseWebContext": true,
  "summary": "최신 웹검색에서 얻은 핵심 요약",
  "facts": ["최신 사실 1", "최신 사실 2", "최신 사실 3"]
}`;

    const response = await generateGroundedContent(prompt);
    const parsed = extractJson(response.text || "") || {};
    const sources = extractGroundingSources(response);
    const usedSearch = sources.length > 0 && (requiredFreshSearch || Boolean(parsed.shouldUseWebContext));

    return {
      requiredFreshSearch,
      usedSearch,
      summary: parsed.summary || "",
      facts: Array.isArray(parsed.facts) ? parsed.facts.filter(Boolean) : [],
      sources
    };
  };
}

module.exports = {
  extractGroundingSources,
  createWebResearchService,
  shouldForceFreshWebSearch
};
