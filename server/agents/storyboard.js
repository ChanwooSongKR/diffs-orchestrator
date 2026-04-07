const { complete, extractJson } = require("../lib/llm.js");
const { getAgentConfig } = require("./registry.js");

const AGENT = getAgentConfig("storyboard");

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

async function generateFrameImage(desc, apiKey) {
  if (!apiKey) return null;

  const prompt = `광고 스토리보드 컷, 영화적인 다크 무드 분위기. ${desc}. 프로페셔널 광고 영화 스타일, 고대비, 감성적 분위기.`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: { responseModalities: ["IMAGE"] }
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/jpeg";
        return `data:${mime};base64,${part.inlineData.data}`;
      }
    }
    console.warn(`[${IMAGE_MODEL}] 이미지 파트 없음`);
  } catch (err) {
    console.error(`[${IMAGE_MODEL} 오류]`, err.message || err);
  }

  return null;
}

async function runStoryboard(scenario, model, emit) {
  emit("task_update", {
    id: "storyboard",
    status: "Running",
    statusKind: "running",
    summary: "시나리오 기반으로 컷별 콘티를 생성하는 중입니다.",
    agents: ["스토리보드 구성 에이전트", "이미지 생성 에이전트 (Nano Banana 2)"]
  });

  emit("feed_item", {
    id: `feed-sb-status-${Date.now()}`,
    type: "status",
    text: "스토리보드 에이전트가 컷 목록을 생성하는 중..."
  });

  // 1. Generate cut structure via LLM
  const acts = Array.isArray(scenario.acts) ? scenario.acts : [];
  const sceneLines = acts.flatMap((a) =>
    (Array.isArray(a.scenes) ? a.scenes : []).map(
      (s) => `막${a.act}|${s.id}|${s.location}|${s.desc}`
    )
  );

  const prompt = `필름 제목: "${scenario.title}"
길이: ${scenario.duration || "90초"}

장면 목록 (막|장면ID|장소|설명):
${sceneLines.join("\n")}

위의 각 장면에 대해 스토리보드 컷 하나씩 생성하세요.
막 번호를 영문 단계로 변환: 1막=PROLOGUE, 2막=BUILD, 3막=CLIMAX, 4막=CLOSING.
영화적인 어두운 색상 팔레트. color=어두운 배경 hex, accent=포인트 컬러 hex.
타임코드는 90초 스팟 기준으로 자연스럽게 증가.

아래 정확한 JSON으로 응답:
{
  "cuts": [
    {
      "scene": 1,
      "title": "짧은 시각적 제목 (3-5단어, 한국어)",
      "act": "PROLOGUE",
      "timecode": "00:00",
      "desc": "프레임에 대한 정확한 시각적 묘사 (한국어)",
      "color": "#0f0f1a",
      "accent": "#6B8FA3"
    }
  ]
}`;

  const rawText = await complete(prompt, { model, system: AGENT.system });
  const data = extractJson(rawText) || { cuts: [] };
  const cuts = Array.isArray(data.cuts) ? data.cuts : [];

  emit("task_update", {
    id: "storyboard",
    status: "Ready",
    statusKind: "ready",
    summary: `${cuts.length}개 컷이 생성되었습니다. 콘티를 검토하세요.`,
    outputs: cuts,
    agents: ["스토리보드 구성 에이전트", "이미지 생성 에이전트 (Nano Banana 2)"]
  });

  emit("feed_item", {
    id: `feed-sb-struct-${Date.now()}`,
    type: "result_card",
    title: "스토리보드 구조 완료",
    body: `${cuts.length}개 컷 생성됨. Nano Banana 2로 이미지 생성을 시작합니다...`
  });

  // 2. Generate images via Nano Banana 2 (Imagen 3) — parallel, emit as each completes
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    emit("feed_item", {
      id: `feed-sb-img-start-${Date.now()}`,
      type: "status",
      text: `Nano Banana 2가 ${cuts.length}개 컷의 이미지를 생성하는 중...`
    });

    let generatedCount = 0;
    const imagePromises = cuts.map(async (cut) => {
      const imageBase64 = await generateFrameImage(cut.desc, apiKey);
      if (imageBase64) {
        generatedCount++;
        emit("storyboard_image", { scene: cut.scene, imageBase64 });
      }
    });

    await Promise.allSettled(imagePromises);

    if (generatedCount > 0) {
      emit("feed_item", {
        id: `feed-sb-img-done-${Date.now()}`,
        type: "status",
        text: `스토리보드 이미지 ${generatedCount}/${cuts.length}개 생성 완료.`
      });
    } else {
      emit("feed_item", {
        id: `feed-sb-img-err-${Date.now()}`,
        type: "status",
        text: "이미지 생성 실패: Imagen API 접근 권한이 없거나 유료 플랜이 필요합니다. 서버 로그를 확인하세요."
      });
    }
  } else {
    emit("feed_item", {
      id: `feed-sb-no-img-${Date.now()}`,
      type: "status",
      text: "GEMINI_API_KEY가 없어 이미지 생성을 건너뜁니다."
    });
  }

  return cuts;
}

runStoryboard.agentName = AGENT.name;
runStoryboard.system = AGENT.system;

module.exports = { runStoryboard };
