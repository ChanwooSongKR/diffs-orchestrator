const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const MODEL_MAP = {
  "Gemini 3 Pro":  "gemini-2.5-pro",
  "Gemini 3 Flash": "gemini-2.5-flash",
  "GPT-5":         "gpt-4o",
  "GPT-4.1 mini":  "gpt-4o-mini"
};

function resolveModel(name) {
  return MODEL_MAP[name] || name;
}

function extractJson(text) {
  // Strip markdown code fences
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) {
    try { return JSON.parse(block[1].trim()); } catch {}
  }
  // Try raw text
  try { return JSON.parse(text.trim()); } catch {}
  // Try first {...} block
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) {
    try { return JSON.parse(obj[0]); } catch {}
  }
  return null;
}

const KOREAN_SYSTEM = "\n\n[언어 규칙] 모든 응답은 반드시 한국어로 작성하세요. 단, headline·title·slogan·caption 필드는 영어 원문 유지.";
const KOREAN_PROMPT_SUFFIX = "\n\n[언어 필수] 위 JSON의 모든 텍스트 필드를 한국어로 작성하세요. headline·title·caption 필드만 영어 유지.";

async function complete(prompt, { model = "Gemini 3 Flash", system = null } = {}) {
  const modelId = resolveModel(model);
  const systemWithKorean = (system || "") + KOREAN_SYSTEM;
  const promptWithKorean = prompt + KOREAN_PROMPT_SUFFIX;

  if (modelId.startsWith("gemini")) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemWithKorean
    });
    const result = await geminiModel.generateContent(promptWithKorean);
    return result.response.text();
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const messages = [
    { role: "system", content: systemWithKorean },
    { role: "user", content: promptWithKorean }
  ];
  const completion = await openai.chat.completions.create({ model: modelId, messages });
  return completion.choices[0].message.content || "";
}

/**
 * Stream LLM response token by token. onChunk(text) is called for each chunk.
 * Returns the full accumulated text.
 */
async function streamComplete(prompt, { model = "Gemini 3 Flash", system = null, onChunk } = {}) {
  const modelId = resolveModel(model);
  const systemWithKorean = (system || "") + KOREAN_SYSTEM;
  const promptWithKorean = prompt + KOREAN_PROMPT_SUFFIX;

  if (modelId.startsWith("gemini")) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemWithKorean });
    const result = await geminiModel.generateContentStream(promptWithKorean);
    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk?.(chunkText);
    }
    return fullText;
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stream = await openai.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemWithKorean },
      { role: "user", content: promptWithKorean }
    ],
    stream: true
  });
  let fullText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      fullText += delta;
      onChunk?.(delta);
    }
  }
  return fullText;
}

module.exports = { complete, streamComplete, extractJson, resolveModel };
