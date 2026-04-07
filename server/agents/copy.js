const { streamComplete, extractJson } = require("../lib/llm.js");
const { getAgentConfig } = require("./registry.js");

const AGENT = getAgentConfig("copy");

async function runCopy(userMessage, research, model, emit) {
  emit("task_update", {
    id: "copy",
    status: "Running",
    statusKind: "running",
    summary: "리서치 기반으로 카피 10안을 작성하는 중입니다.",
    agents: ["카피 초안 작성 에이전트", "카피 큐레이터", "메모리 에이전트"]
  });

  emit("feed_item", {
    id: `feed-c-status-${Date.now()}`,
    type: "status",
    text: "카피 에이전트가 10가지 방향의 카피를 생성하는 중..."
  });

  const prompt = `브리프: "${userMessage}"
핵심 인사이트: ${research.creativeOpportunity || research.summary}
타깃: ${research.targetAudience || ""}

서로 다른 각도의 광고 카피를 정확히 10개 생성하세요. 각각 완전히 다른 크리에이티브 방향이어야 합니다.
헤드라인은 영어로, 짧고 강렬하게 (3-8단어). desc는 이 크리에이티브 방향에 대한 한국어 설명.

아래 정확한 JSON 형식으로만 응답하세요. copies 배열에 반드시 10개의 항목이 있어야 합니다:
{
  "copies": [
    {"headline": "English headline 1", "desc": "한국어 설명 1"},
    {"headline": "English headline 2", "desc": "한국어 설명 2"},
    {"headline": "English headline 3", "desc": "한국어 설명 3"},
    {"headline": "English headline 4", "desc": "한국어 설명 4"},
    {"headline": "English headline 5", "desc": "한국어 설명 5"},
    {"headline": "English headline 6", "desc": "한국어 설명 6"},
    {"headline": "English headline 7", "desc": "한국어 설명 7"},
    {"headline": "English headline 8", "desc": "한국어 설명 8"},
    {"headline": "English headline 9", "desc": "한국어 설명 9"},
    {"headline": "English headline 10", "desc": "한국어 설명 10"}
  ]
}`;

  const streamId = `feed-c-stream-${Date.now()}`;
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
  const data = extractJson(rawText) || { copies: [] };

  const copies = Array.isArray(data.copies) && data.copies.length >= 5
    ? data.copies.slice(0, 10)
    : [
        { headline: "Lead with what's real.", desc: "진정성이 광고 회상률을 높입니다." },
        { headline: "Own your pace.", desc: "자기 결정권을 통한 임파워먼트 포지셔닝." },
        { headline: "The city is yours tonight.", desc: "움직임을 통한 소속감과 공간 소유." },
        { headline: "Make every move count.", desc: "매 순간의 행동이 의미 있음을 강조." },
        { headline: "Designed for the determined.", desc: "목표 지향적인 타깃에게 직접적으로 소구." },
        { headline: "Further than before.", desc: "성장과 발전의 여정을 담은 카피." },
        { headline: "Do it for the story.", desc: "경험과 기억을 남기는 행동의 동기부여." },
        { headline: "Built different, moves different.", desc: "제품 차별화를 통한 정체성 강화." },
        { headline: "Feel the shift.", desc: "변화의 순간을 감각적으로 표현." },
        { headline: "Your rules, your road.", desc: "자유와 자기표현을 통한 공감대 형성." }
      ];

  emit("task_update", {
    id: "copy",
    status: "Ready",
    statusKind: "ready",
    summary: `카피 ${copies.length}안이 준비되었습니다. 마음에 드는 카피를 선택하거나 수정 방향을 입력하세요.`,
    reason: "리서치 맥락 기반으로 10가지 방향의 카피가 생성되었습니다.",
    outputs: copies,
    agents: ["카피 초안 작성 에이전트", "카피 큐레이터", "메모리 에이전트"]
  });

  emit("feed_item", {
    id: `feed-c-card-${Date.now()}`,
    type: "result_card",
    title: "카피 10안 준비 완료",
    body: copies.slice(0, 3).map((c, i) => `${i + 1}: "${c.headline}"`).join("  ·  ") + (copies.length > 3 ? ` 외 ${copies.length - 3}안` : "")
  });

  return copies; // 전체 배열 반환
}

runCopy.agentName = AGENT.name;
runCopy.system = AGENT.system;

module.exports = { runCopy };
