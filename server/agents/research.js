const { streamComplete, extractJson } = require("../lib/llm.js");
const { getAgentConfig } = require("./registry.js");
const { createWebResearchService } = require("../search/web-research.js");

const AGENT = getAgentConfig("research");
const gatherWebResearchContext = createWebResearchService();

async function runResearch(userMessage, model, emit) {
  emit("task_update", {
    id: "research",
    status: "Running",
    statusKind: "running",
    summary: "시장 맥락, 경쟁사, 레퍼런스를 분석하는 중입니다.",
    agents: ["시장 리서치 에이전트", "레퍼런스 검색 에이전트", "메모리 에이전트"]
  });

  emit("feed_item", {
    id: `feed-r-status-${Date.now()}`,
    type: "status",
    text: "리서치 에이전트가 브리프를 분석하는 중..."
  });

  let webContext = { usedSearch: false, summary: "", facts: [], sources: [] };
  try {
    emit("feed_item", {
      id: `feed-r-web-${Date.now()}`,
      type: "status",
      text: "공개 웹에서 최신 정보를 확인하는 중..."
    });
    webContext = await gatherWebResearchContext(userMessage);
    emit("feed_item", {
      id: `feed-r-web-result-${Date.now()}`,
      type: "status",
      text: webContext.usedSearch
        ? `웹검색 완료: ${webContext.sources.length}개 출처를 반영했습니다.`
        : webContext.requiredFreshSearch
          ? "웹검색 출처를 충분히 확보하지 못했습니다. 브리프와 추가 질문을 함께 사용합니다."
          : "웹검색 없이 브리프 기반 리서치로 진행합니다."
    });
  } catch (error) {
    const message = error?.message || "알 수 없는 오류";
    console.error("[web-research]", error);
    emit("feed_item", {
      id: `feed-r-web-fail-${Date.now()}`,
      type: "status",
      text: `웹검색 실패: ${message}`
    });
  }

  const prompt = `광고 브리프: "${userMessage}"

최신 웹검색 컨텍스트 사용 여부: ${webContext.usedSearch ? "예" : "아니오"}
웹검색 요약: ${webContext.summary || "없음"}
웹검색 사실:
${webContext.facts.length ? webContext.facts.map((fact, index) => `${index + 1}. ${fact}`).join("\n") : "없음"}

아래 정확한 JSON 구조로 응답하세요:
{
  "status": "ready 또는 needs_input",
  "summary": "핵심 리서치 결과를 2-3문장으로 요약",
  "keyInsights": [
    "타깃 오디언스 또는 행동에 관한 핵심 인사이트",
    "카테고리 또는 문화적 맥락에 관한 인사이트",
    "크리에이티브 기회"
  ],
  "targetAudience": "이 광고의 타깃은 누구이며 그들이 무엇을 원하는지",
  "competitorLandscape": "경쟁사들이 무엇을 하고 있으며 화이트스페이스는 어디인지",
  "creativeOpportunity": "이 캠페인을 위한 가장 설득력 있는 미개척 각도",
  "reason": "왜 ready 또는 needs_input인지 한 문장 설명",
  "question": "status가 needs_input일 때 사용자에게 물을 질문 한 개",
  "missingFields": ["status가 needs_input일 때 부족한 정보 키"]
}`;

  const streamId = `feed-r-stream-${Date.now()}`;
  emit("feed_item", { id: streamId, type: "stream_text", text: "" });
  let accumulated = "";
  const rawText = await streamComplete(prompt, {
    model,
    system: AGENT.system,
    onChunk: (chunk) => {
      accumulated += chunk;
      emit("text_chunk", { id: streamId, text: accumulated });
    }
  });
  const data = extractJson(rawText) || {};
  const normalized = {
    status: data.status === "needs_input" ? "needs_input" : "ready",
    summary: data.summary || rawText.slice(0, 300),
    keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights : [],
    targetAudience: data.targetAudience || "",
    competitorLandscape: data.competitorLandscape || "",
    creativeOpportunity: data.creativeOpportunity || "",
    reason: data.reason || "",
    question: data.question || "",
    missingFields: Array.isArray(data.missingFields) ? data.missingFields : []
  };

  if (normalized.status === "needs_input") {
    emit("feed_item", {
      id: `feed-r-need-${Date.now()}`,
      type: "status",
      text: normalized.reason || "리서치 진행을 위해 추가 정보가 필요합니다."
    });

    emit("task_update", {
      id: "research",
      status: "Waiting for user",
      statusKind: "waiting",
      summary: normalized.reason || "리서치 진행 전 추가 정보가 필요합니다.",
      reason: normalized.question,
      agents: ["시장 리서치 에이전트", "레퍼런스 검색 에이전트", "메모리 에이전트"]
    });

    return normalized;
  }

  emit("feed_item", {
    id: `feed-r-card-${Date.now()}`,
    type: "result_card",
    title: "리서치 완료",
    body: normalized.summary,
    meta: [
      { label: "크리에이티브 각도", value: normalized.creativeOpportunity },
      { label: "타깃", value: normalized.targetAudience },
      ...(webContext.usedSearch ? [{ label: "웹검색", value: `${webContext.sources.length}개 출처 반영` }] : [])
    ]
  });

  emit("task_update", {
    id: "research",
    status: "Ready",
    statusKind: "ready",
    summary: normalized.summary,
    outputs: [normalized.competitorLandscape, normalized.creativeOpportunity].filter(Boolean),
    agents: ["시장 리서치 에이전트", "레퍼런스 검색 에이전트", "메모리 에이전트"]
  });

  return normalized;
}

runResearch.agentName = AGENT.name;
runResearch.system = AGENT.system;
runResearch.gatherWebResearchContext = gatherWebResearchContext;

module.exports = { runResearch };
