const { runResearch } = require("../agents/research.js");
const { runCopy } = require("../agents/copy.js");
const { runScenario } = require("../agents/scenario.js");
const { runStoryboard } = require("../agents/storyboard.js");

function createEmitter(res) {
  return function emit(eventType, data) {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };
}

function emitAgentActivity(emit, agent, status) {
  emit("agent_activity", { agent, status });
}

/**
 * Stage-based pipeline handler.
 *
 * Stages:
 *  "initial"      → Research + Copy → approve_gate { type: "copy" }
 *  "regen_copy"   → Copy (with optional feedback) → approve_gate { type: "copy" }
 *  "scenario"     → Scenario → approve_gate { type: "scenario" }
 *  "storyboard"   → Storyboard + Imagen images → done
 */
function combineResearchMessages(originalMessage, clarification) {
  return clarification
    ? `${originalMessage}\n\n추가 정보: ${clarification}`
    : originalMessage;
}

function createChatHandler(deps = {}) {
  const handlers = {
    runResearch: deps.runResearch || runResearch,
    runCopy: deps.runCopy || runCopy,
    runScenario: deps.runScenario || runScenario,
    runStoryboard: deps.runStoryboard || runStoryboard
  };

  return async function chatHandler(req, res) {
    const { message, model, stage = "initial", context = {} } = req.body || {};

    if (!message && !context.originalMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const emit = createEmitter(res);
    const selectedModel = model || "Gemini 3 Flash";
    const originalMessage = message || context.originalMessage || "";
    let activeAgent = null;

    try {
      if (stage === "initial") {
        activeAgent = "research";
        emitAgentActivity(emit, activeAgent, "running");
        const research = await handlers.runResearch(originalMessage, selectedModel, emit);
        if (research.status === "needs_input") {
          emitAgentActivity(emit, activeAgent, "waiting");
          emit("approve_gate", {
            type: "research_input",
            question: research.question,
            missingFields: research.missingFields,
            reason: research.reason
          });
        } else {
          emitAgentActivity(emit, activeAgent, "completed");
          activeAgent = "copy";
          emitAgentActivity(emit, activeAgent, "running");
          const copies = await handlers.runCopy(originalMessage, research, selectedModel, emit);
          emitAgentActivity(emit, activeAgent, "completed");
          emit("approve_gate", { type: "copy", copies, research });
        }

      } else if (stage === "research_followup") {
        const clarification = context.researchClarification || message || "";
        const prompt = combineResearchMessages(context.originalMessage || originalMessage, clarification);
        activeAgent = "research";
        emitAgentActivity(emit, activeAgent, "running");
        const research = await handlers.runResearch(prompt, selectedModel, emit);
        if (research.status === "needs_input") {
          emitAgentActivity(emit, activeAgent, "waiting");
          emit("approve_gate", {
            type: "research_input",
            question: research.question,
            missingFields: research.missingFields,
            reason: research.reason
          });
        } else {
          emitAgentActivity(emit, activeAgent, "completed");
          activeAgent = "copy";
          emitAgentActivity(emit, activeAgent, "running");
          const copies = await handlers.runCopy(prompt, research, selectedModel, emit);
          emitAgentActivity(emit, activeAgent, "completed");
          emit("approve_gate", { type: "copy", copies, research });
        }

      } else if (stage === "regen_copy") {
        const { research, feedback } = context;
        const prompt = feedback
          ? `${originalMessage}\n\n추가 요청: ${feedback}`
          : originalMessage;
        activeAgent = "copy";
        emitAgentActivity(emit, activeAgent, "running");
        const copies = await handlers.runCopy(prompt, research || {}, selectedModel, emit);
        emitAgentActivity(emit, activeAgent, "completed");
        emit("approve_gate", { type: "copy", copies, research: research || {} });

      } else if (stage === "scenario") {
        const { selectedCopy, feedback } = context;
        const prompt = feedback
          ? `${originalMessage}\n\n수정 요청: ${feedback}`
          : originalMessage;
        activeAgent = "scenario";
        emitAgentActivity(emit, activeAgent, "running");
        const scenario = await handlers.runScenario(
          prompt,
          selectedCopy || { headline: "Lead with what's real.", desc: "" },
          selectedModel,
          emit
        );
        emitAgentActivity(emit, activeAgent, "completed");
        emit("approve_gate", { type: "scenario", scenario });

      } else if (stage === "storyboard") {
        const { scenario } = context;
        activeAgent = "storyboard";
        emitAgentActivity(emit, activeAgent, "running");
        await handlers.runStoryboard(
          scenario || { title: "UNTITLED", acts: [] },
          selectedModel,
          emit
        );
        emitAgentActivity(emit, activeAgent, "completed");
        emit("done", { message: "파이프라인 완료" });

      } else {
        emit("error", { message: `알 수 없는 스테이지: ${stage}` });
      }
    } catch (err) {
      if (activeAgent) {
        emitAgentActivity(emit, activeAgent, "failed");
      }
      console.error("[파이프라인 오류]", err);
      emit("error", { message: err.message || "파이프라인 오류가 발생했습니다." });
    } finally {
      res.end();
    }
  };
}

const chatHandler = createChatHandler();

module.exports = { chatHandler, createChatHandler };
