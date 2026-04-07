import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { createChatHandler } = require("../server/routes/chat.js");

function createMockRes() {
  let body = "";
  return {
    statusCode: 200,
    headers: {},
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      this.ended = true;
      return this;
    },
    write(chunk) {
      body += chunk;
    },
    end() {
      this.ended = true;
    },
    getBody() {
      return body;
    }
  };
}

function readEvents(res) {
  return res
    .getBody()
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const event = block.match(/event: (.+)/)?.[1];
      const data = block.match(/data: (.+)/)?.[1];
      return {
        event,
        data: data ? JSON.parse(data) : null
      };
    });
}

test("initial stage emits research_input gate and skips copy when research needs more info", async () => {
  let copyCalled = false;

  const chatHandler = createChatHandler({
    runResearch: async () => ({
      status: "needs_input",
      question: "타깃 연령대를 알려주세요.",
      missingFields: ["targetAudience"],
      reason: "타깃 정보가 없습니다."
    }),
    runCopy: async () => {
      copyCalled = true;
      return [];
    }
  });

  const req = {
    body: {
      message: "러닝 광고 만들어줘",
      model: "Gemini 3 Flash",
      stage: "initial"
    }
  };
  const res = createMockRes();

  await chatHandler(req, res);

  const events = readEvents(res);
  const gate = events.find((entry) => entry.event === "approve_gate");

  assert.equal(copyCalled, false);
  assert.equal(gate.data.type, "research_input");
  assert.equal(gate.data.question, "타깃 연령대를 알려주세요.");
  assert.deepEqual(gate.data.missingFields, ["targetAudience"]);
});

test("research_followup continues to copy once research becomes ready", async () => {
  const calls = [];

  const chatHandler = createChatHandler({
    runResearch: async (message) => {
      calls.push(message);
      return {
        status: "ready",
        summary: "리서치 완료",
        targetAudience: "20대",
        competitorLandscape: "경쟁사 분석",
        creativeOpportunity: "새벽 러닝"
      };
    },
    runCopy: async (message, research) => {
      return [{ headline: `${message} / ${research.creativeOpportunity}`, desc: "ok" }];
    }
  });

  const req = {
    body: {
      message: "타깃은 20대야",
      model: "Gemini 3 Flash",
      stage: "research_followup",
      context: {
        originalMessage: "러닝 광고 만들어줘",
        researchClarification: "타깃은 20대야"
      }
    }
  };
  const res = createMockRes();

  await chatHandler(req, res);

  const events = readEvents(res);
  const gate = events.find((entry) => entry.event === "approve_gate");

  assert.equal(calls.length, 1);
  assert.match(calls[0], /러닝 광고 만들어줘/);
  assert.match(calls[0], /타깃은 20대야/);
  assert.equal(gate.data.type, "copy");
  assert.equal(gate.data.copies.length, 1);
});

test("pipeline stages emit explicit agent_activity transitions", async () => {
  const chatHandler = createChatHandler({
    runResearch: async () => ({
      status: "ready",
      summary: "리서치 완료",
      targetAudience: "20대",
      competitorLandscape: "경쟁사 분석",
      creativeOpportunity: "새벽 러닝"
    }),
    runCopy: async () => [{ headline: "Lead with what's real.", desc: "ok" }],
    runScenario: async () => ({
      title: "RUN FREE",
      duration: "1분 30초",
      tone: "톤",
      acts: [],
      sound: "sound"
    }),
    runStoryboard: async () => []
  });

  const run = async (body) => {
    const res = createMockRes();
    await chatHandler({ body }, res);
    return readEvents(res);
  };

  const initialEvents = await run({
    message: "러닝 광고 만들어줘",
    model: "Gemini 3 Flash",
    stage: "initial"
  });

  const researchWaitingHandler = createChatHandler({
    runResearch: async () => ({
      status: "needs_input",
      question: "타깃 연령대를 알려주세요.",
      missingFields: ["targetAudience"],
      reason: "타깃 정보가 없습니다."
    }),
    runCopy: async () => []
  });
  const waitingRes = createMockRes();
  await researchWaitingHandler(
    {
      body: {
        message: "러닝 광고 만들어줘",
        model: "Gemini 3 Flash",
        stage: "initial"
      }
    },
    waitingRes
  );
  const waitingEvents = readEvents(waitingRes);

  const scenarioEvents = await run({
    message: "시나리오 만들어줘",
    model: "Gemini 3 Flash",
    stage: "scenario",
    context: { selectedCopy: { headline: "Own your pace.", desc: "ok" } }
  });

  const storyboardEvents = await run({
    message: "스토리보드 만들어줘",
    model: "Gemini 3 Flash",
    stage: "storyboard",
    context: { scenario: { title: "RUN FREE", acts: [] } }
  });

  const initialAgentActivities = initialEvents.filter((entry) => entry.event === "agent_activity");
  const waitingAgentActivities = waitingEvents.filter((entry) => entry.event === "agent_activity");
  const scenarioAgentActivities = scenarioEvents.filter((entry) => entry.event === "agent_activity");
  const storyboardAgentActivities = storyboardEvents.filter((entry) => entry.event === "agent_activity");

  assert.deepEqual(initialAgentActivities.map((entry) => entry.data), [
    { agent: "research", status: "running" },
    { agent: "research", status: "completed" },
    { agent: "copy", status: "running" },
    { agent: "copy", status: "completed" }
  ]);
  assert.deepEqual(waitingAgentActivities.map((entry) => entry.data), [
    { agent: "research", status: "running" },
    { agent: "research", status: "waiting" }
  ]);
  assert.deepEqual(scenarioAgentActivities.map((entry) => entry.data), [
    { agent: "scenario", status: "running" },
    { agent: "scenario", status: "completed" }
  ]);
  assert.deepEqual(storyboardAgentActivities.map((entry) => entry.data), [
    { agent: "storyboard", status: "running" },
    { agent: "storyboard", status: "completed" }
  ]);
});

test("agent_activity emits failed when an active agent throws", async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    const chatHandler = createChatHandler({
      runResearch: async () => ({
        status: "ready",
        summary: "리서치 완료",
        targetAudience: "20대",
        competitorLandscape: "경쟁사 분석",
        creativeOpportunity: "새벽 러닝"
      }),
      runCopy: async () => {
        throw new Error("copy failed");
      }
    });

    const res = createMockRes();
    await chatHandler(
      {
        body: {
          message: "러닝 광고 만들어줘",
          model: "Gemini 3 Flash",
          stage: "initial"
        }
      },
      res
    );

    const events = readEvents(res);
    const activities = events.filter((entry) => entry.event === "agent_activity");
    const errorEvent = events.find((entry) => entry.event === "error");

    assert.deepEqual(activities.map((entry) => entry.data), [
      { agent: "research", status: "running" },
      { agent: "research", status: "completed" },
      { agent: "copy", status: "running" },
      { agent: "copy", status: "failed" }
    ]);
    assert.equal(errorEvent.data.message, "copy failed");
  } finally {
    console.error = originalError;
  }
});
