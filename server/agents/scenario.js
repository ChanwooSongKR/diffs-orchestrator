const { streamComplete, extractJson } = require("../lib/llm.js");
const { getAgentConfig } = require("./registry.js");

const AGENT = getAgentConfig("scenario");

async function runScenario(userMessage, copy, model, emit) {
  emit("task_update", {
    id: "scenario",
    status: "Running",
    statusKind: "running",
    summary: `선택된 카피 '${copy.headline}' 기반으로 시나리오를 작성하는 중입니다.`,
    agents: ["시나리오 작가 에이전트", "촬영 계획 에이전트"]
  });

  emit("feed_item", {
    id: `feed-s-status-${Date.now()}`,
    type: "status",
    text: `시나리오 에이전트가 "${copy.headline}" 기반으로 필름 트리트먼트를 작성하는 중...`
  });

  const prompt = `캠페인 브리프: "${userMessage}"
선택된 카피: "${copy.headline}"
카피 방향: "${copy.desc || ""}"

60-90초 광고 필름 시나리오를 작성하세요. 3-4막으로 구성하고 각 막에 2-3개 장면을 포함하세요.
영화적이고 실제 촬영 가능하게 작성하세요.

아래 정확한 JSON 구조로 응답하세요 (추가 필드 없이):
{
  "title": "CAMPAIGN TITLE IN CAPS (영어)",
  "subtitle": "「한국어 테마 부제」",
  "duration": "1분 30초",
  "tone": "필름 톤 설명 — 참고할 만한 광고나 감독 언급 포함 (한국어)",
  "acts": [
    {
      "act": 1,
      "title": "ACT 이름 — \\"한국어 설명.\\"",
      "scenes": [
        {
          "id": "1",
          "location": "구체적인 장소와 시간대 (한국어)",
          "desc": "화면에 보이는 것에 대한 구체적 시각적 묘사 (한국어)",
          "narration": "\\"보이스오버 대사 (있는 경우, 한국어)\\"",
          "caption": "\\"화면 텍스트 (있는 경우, 영어 슬로건은 영어로)\\""
        }
      ]
    }
  ],
  "sound": "전 구간 음악 전개 및 사운드 디자인 안내 (한국어)"
}`;

  const streamId = `feed-s-stream-${Date.now()}`;
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
  const data = extractJson(rawText) || {
    title: "UNTITLED CAMPAIGN",
    subtitle: "「새로운 방향」",
    duration: "1분 30초",
    tone: copy.desc || "",
    acts: [],
    sound: ""
  };

  if (!Array.isArray(data.acts)) data.acts = [];

  emit("task_update", {
    id: "scenario",
    status: "Ready",
    statusKind: "ready",
    summary: `시나리오 '${data.title}'이 생성되었습니다. 검토 후 방향을 확정하세요.`,
    reason: `카피 '${copy.headline}' 기반으로 작성되었습니다.`,
    outputs: data,
    agents: ["시나리오 작가 에이전트", "촬영 계획 에이전트"]
  });

  emit("feed_item", {
    id: `feed-s-card-${Date.now()}`,
    type: "result_card",
    title: `시나리오: ${data.title}`,
    body: `${data.duration} · ${data.acts.length}막 · ${(data.tone || "").slice(0, 80)}...`
  });

  emit("feed_item", {
    id: `feed-s-preview-${Date.now()}`,
    type: "scenario_card",
    scenario: data
  });

  return data;
}

runScenario.agentName = AGENT.name;
runScenario.system = AGENT.system;

module.exports = { runScenario };
