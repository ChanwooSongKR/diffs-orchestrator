import {
  addProject,
  applyAgentActivity,
  applyRoute,
  addSession,
  addStoryboardImage,
  appendFeedItem,
  clearActiveAgents,
  closeTaskDetail,
  completeStreamingFeedItems,
  createInitialState,
  openTaskDetail,
  pushCopyHistory,
  pushScenarioHistory,
  selectProject,
  selectSession,
  setCopyHistoryIdx,
  setCreateProjectModal,
  setModel,
  setPipelineContext,
  setPipelineRunning,
  setPipelineStage,
  setScenarioHistoryIdx,
  updateFeedItem,
  toggleSessionsPanel,
  updateTask
} from "./state.js";
import { renderProjectsView } from "./render-projects.js";
import { renderApproveGate, renderWorkspaceView } from "./render-workspace.js";
import { formatStreamTextForDisplay } from "./streaming.js";
import { startChat } from "./api.js";
import { buildLauncherRoute, buildSessionRoute, parseRoute } from "./router.js";

const app = document.getElementById("app");
let state = createInitialState();

const AGENT_LABELS = {
  research: "Research Agent",
  copy: "Copy Agent",
  scenario: "Scenario Agent",
  storyboard: "Storyboard Agent"
};

const AGENT_DETAILS = {
  research: {
    running: "브리프와 웹검색 컨텍스트를 분석 중입니다.",
    waiting: "추가 정보 입력을 기다리는 중입니다."
  },
  copy: {
    running: "10가지 방향의 카피를 생성 중입니다.",
    waiting: "카피 생성이 일시 중지되었습니다."
  },
  scenario: {
    running: "선택된 카피로 시나리오를 구성 중입니다.",
    waiting: "시나리오 진행이 일시 중지되었습니다."
  },
  storyboard: {
    running: "시나리오를 바탕으로 스토리보드를 생성 중입니다.",
    waiting: "스토리보드 진행이 일시 중지되었습니다."
  }
};

function getRouteForState(nextState = state) {
  if (nextState.view !== "workspace" || !nextState.selectedProjectId) {
    return buildLauncherRoute();
  }

  if (nextState.activeSessionId) {
    return buildSessionRoute(nextState.selectedProjectId, nextState.activeSessionId);
  }

  return buildLauncherRoute();
}

function syncHistory(nextState = state, { replace = false } = {}) {
  const nextPath = getRouteForState(nextState);
  const currentPath = window.location.pathname || "/";
  if (!replace && currentPath === nextPath) return;

  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", nextPath);
}

function applyRouteFromLocation({ replace = false } = {}) {
  state = applyRoute(state, parseRoute(window.location.pathname || "/"));
  render();
  syncHistory(state, { replace });
}

function createAndOpenProject(projectName) {
  state = addProject(state, projectName);
  const newProjectId = state.projects?.[0]?.id;
  state = setCreateProjectModal(state, false);
  if (newProjectId) {
    state = selectProject(state, newProjectId);
  }
  render();
  syncHistory(state);
  requestAnimationFrame(() => document.getElementById("workspace-composer-input")?.focus());
}

function render() {
  // Preserve text the user is typing before full re-render
  const composerInput = document.getElementById("workspace-composer-input");
  const preservedValue = composerInput?.value ?? "";

  app.innerHTML =
    state.view === "projects" ? renderProjectsView(state) : renderWorkspaceView(state);

  const newInput = document.getElementById("workspace-composer-input");
  if (newInput && preservedValue) newInput.value = preservedValue;

  // Scroll chat feed to bottom
  const feed = app.querySelector(".chat-feed");
  if (feed) feed.scrollTop = feed.scrollHeight;
}

function patchStreamingBubble(streamId, rawText) {
  const container = app.querySelector(`[data-stream-id="${streamId}"]`);
  if (!container) return false;

  const bubble = container.querySelector(".stream-bubble");
  if (!bubble) return false;

  const text = formatStreamTextForDisplay(rawText);
  if (!text) return false;

  let existing = bubble.querySelector(".stream-text");
  if (!existing) {
    bubble.innerHTML = "";
    existing = document.createElement("pre");
    existing.className = "stream-text";
    bubble.appendChild(existing);
  }

  existing.textContent = text;

  const feed = app.querySelector(".chat-feed");
  if (feed) feed.scrollTop = feed.scrollHeight;
  return true;
}

function patchApproveGate() {
  const workspaceChat = app.querySelector(".workspace__chat");
  if (!workspaceChat) return false;

  const existingGate = workspaceChat.querySelector(".approve-gate");
  const nextMarkup = renderApproveGate(state);
  const feedbackValue = existingGate?.querySelector(".approve-feedback-input")?.value ?? "";
  const copyBodyScrollTop = existingGate?.querySelector(".approve-gate__body--copy")?.scrollTop ?? 0;

  if (!nextMarkup) {
    existingGate?.remove();
    return true;
  }

  const template = document.createElement("template");
  template.innerHTML = nextMarkup.trim();
  const nextGate = template.content.firstElementChild;
  if (!nextGate) return false;

  if (existingGate) {
    existingGate.replaceWith(nextGate);
  } else {
    const composerWrap = workspaceChat.querySelector(".composer-wrap");
    if (composerWrap) {
      composerWrap.before(nextGate);
    } else {
      workspaceChat.appendChild(nextGate);
    }
  }

  const nextInput = nextGate.querySelector(".approve-feedback-input");
  if (nextInput && feedbackValue) nextInput.value = feedbackValue;
  const nextScrollableBody = nextGate.querySelector(".approve-gate__body--copy");
  if (nextScrollableBody) nextScrollableBody.scrollTop = copyBodyScrollTop;
  return true;
}

// ─── Pipeline stage runner ─────────────────────────────────────────────────

function buildHandlers() {
  return {
    onFeedItem(item) {
      if (item.type !== "stream_text") {
        state = completeStreamingFeedItems(state);
      }
      state = appendFeedItem(state, item);
      render();
    },
    onTaskUpdate(patch) {
      state = updateTask(state, patch);
      // Accumulate artifact history
      if (patch.status === "Ready") {
        if (patch.id === "copy" && Array.isArray(patch.outputs) && patch.outputs.length) {
          state = pushCopyHistory(state, patch.outputs);
        }
        if (patch.id === "scenario" && patch.outputs && typeof patch.outputs === "object" && !Array.isArray(patch.outputs)) {
          state = pushScenarioHistory(state, patch.outputs);
        }
      }
      render();
    },
    onAgentActivity(activity) {
      state = applyAgentActivity(state, {
        ...activity,
        label: activity.label ?? AGENT_LABELS[activity.agent] ?? activity.agent,
        detail: activity.detail ?? AGENT_DETAILS[activity.agent]?.[activity.status]
      });
      render();
    },
    onTextChunk({ id, text }) {
      state = updateFeedItem(state, id, (item) => ({ ...item, text, isStreaming: true }));
      if (!patchStreamingBubble(id, text)) {
        render();
      }
    },
    onApproveGate(gate) {
      state = completeStreamingFeedItems(state);
      if (gate.type === "research_input") {
        state = setPipelineContext(state, {
          researchQuestion: gate.question,
          researchMissingFields: gate.missingFields,
          researchReason: gate.reason
        });
        state = setPipelineStage(state, "waiting_research_input");
      } else if (gate.type === "copy") {
        state = setPipelineContext(state, {
          copies: gate.copies,
          research: gate.research,
          selectedCopyIndex: 0,
          approveGateCollapsed: false
        });
        state = setPipelineStage(state, "waiting_copy");
      } else if (gate.type === "scenario") {
        state = setPipelineContext(state, { scenario: gate.scenario });
        state = setPipelineStage(state, "waiting_scenario");
      }
      state = setPipelineRunning(state, false);
      render();
    },
    onStoryboardImage({ scene, imageBase64 }) {
      state = addStoryboardImage(state, scene, imageBase64);
      render();
    },
    onDone() {
      state = completeStreamingFeedItems(state);
      state = clearActiveAgents(state);
      state = setPipelineRunning(state, false);
      state = setPipelineStage(state, null);
      state = appendFeedItem(state, {
        id: `feed-done-${Date.now()}`,
        type: "storyboard_done",
        text: "스토리보드가 완성되었습니다."
      });
      render();
    },
    onError(errMsg) {
      state = completeStreamingFeedItems(state);
      state = clearActiveAgents(state);
      state = appendFeedItem(state, {
        id: `feed-err-${Date.now()}`,
        type: "status",
        text: `오류: ${errMsg}`
      });
      state = setPipelineRunning(state, false);
      render();
    }
  };
}

async function runStage(stage, extraContext = {}) {
  state = clearActiveAgents(state);
  state = setPipelineRunning(state, true);
  render();

  const ctx = { ...state.pipelineContext, ...extraContext };
  await startChat(
    {
      message: ctx.originalMessage || "",
      model: state.selectedModel,
      stage,
      context: ctx
    },
    buildHandlers()
  );
}

// ─── Initial pipeline (user sends first message) ───────────────────────────

async function startInitialPipeline(message) {
  state = clearActiveAgents(state);
  state = appendFeedItem(state, {
    id: `feed-user-${Date.now()}`,
    type: "user_message",
    text: message
  });
  state = setPipelineContext(state, { originalMessage: message });
  state = setPipelineRunning(state, true);
  render();

  await startChat({ message, model: state.selectedModel, stage: "initial" }, buildHandlers());
}

// ─── Global click (topbar) ─────────────────────────────────────────────────

document.addEventListener("click", (event) => {
  const homeBtn = event.target.closest('[data-action="go-home"]');
  if (homeBtn) {
    state = { ...state, view: "projects", selectedProjectId: null, selectedTaskId: null, taskDetailOpen: false, sessionsPanelOpen: false };
    render();
    syncHistory(state);
  }
});

// ─── ESC key ──────────────────────────────────────────────────────────────

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.createProjectModalOpen) {
      state = setCreateProjectModal(state, false);
      render();
    } else if (state.taskDetailOpen) {
      state = closeTaskDetail(state);
      render();
    }
    return;
  }

  // Enter in the create-project dialog
  if (event.key === "Enter" && state.createProjectModalOpen) {
    const input = document.getElementById("create-project-input");
    if (event.target === input) {
      const projectName = input?.value?.trim();
      if (!projectName) return;
      try {
        createAndOpenProject(projectName);
      } catch {}
    }
  }
});

// ─── App-level event delegation ────────────────────────────────────────────

app.addEventListener("click", async (event) => {

  // ── Project creation ──────────────────────────────────────────────────────
  const createButton = event.target.closest('[data-action="create-project-button"]');
  if (createButton) {
    state = setCreateProjectModal(state, true);
    render();
    // Auto-focus the input after render
    requestAnimationFrame(() => document.getElementById("create-project-input")?.focus());
    return;
  }

  // Backdrop click (clicking the backdrop div directly, not children)
  if (event.target.classList.contains("dialog-backdrop")) {
    state = setCreateProjectModal(state, false);
    render();
    return;
  }
  // Explicit cancel button
  if (event.target.dataset.action === "cancel-create-project" ||
      event.target.closest('[data-action="cancel-create-project"]:not(.dialog-backdrop)')) {
    state = setCreateProjectModal(state, false);
    render();
    return;
  }

  const submitCreateBtn = event.target.closest('[data-action="submit-create-project"]');
  if (submitCreateBtn) {
    const input = document.getElementById("create-project-input");
    const projectName = input?.value?.trim();
    if (!projectName) {
      input?.focus();
      return;
    }
    try {
      createAndOpenProject(projectName);
    } catch (error) {
      // show inline error (just focus the input)
      input?.focus();
    }
    return;
  }

  const projectButton = event.target.closest('[data-action="open-project"]');
  if (projectButton) {
    state = selectProject(state, projectButton.dataset.projectId);
    render();
    syncHistory(state);
    return;
  }

  const streamToggleButton = event.target.closest('[data-action="toggle-stream-collapse"]');
  if (streamToggleButton) {
    const streamId = streamToggleButton.dataset.streamId;
    state = updateFeedItem(state, streamId, (item) => ({
      ...item,
      isCollapsed: !(item?.isCollapsed !== false)
    }));
    render();
    return;
  }

  const approveGateToggleButton = event.target.closest('[data-action="toggle-approve-gate-collapse"]');
  if (approveGateToggleButton) {
    const nextCollapsed = !(state.pipelineContext?.approveGateCollapsed === true);
    state = setPipelineContext(state, { approveGateCollapsed: nextCollapsed });
    if (!patchApproveGate()) render();
    return;
  }

  // ── Task detail modal ─────────────────────────────────────────────────────
  const taskButton = event.target.closest('[data-action="open-task-detail"]');
  if (taskButton) {
    state = openTaskDetail(state, taskButton.dataset.taskId);
    render();
    return;
  }

  const modalCloseButton = event.target.closest('[data-action="close-task-detail"]');
  if (modalCloseButton) {
    state = closeTaskDetail(state);
    render();
    return;
  }

  const modalBackdrop = event.target.closest('[data-action="close-task-detail-backdrop"]');
  if (modalBackdrop && event.target === modalBackdrop) {
    state = closeTaskDetail(state);
    render();
    return;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const backButton = event.target.closest('[data-action="go-projects"]');
  if (backButton) {
    state = { ...state, view: "projects", selectedProjectId: null, selectedTaskId: null, taskDetailOpen: false, sessionsPanelOpen: false };
    render();
    syncHistory(state);
    return;
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  const sessionsToggle = event.target.closest('[data-action="toggle-sessions"]');
  if (sessionsToggle) { state = toggleSessionsPanel(state); render(); return; }

  const sessionItem = event.target.closest('[data-action="select-session"]');
  if (sessionItem) {
    state = selectSession(state, sessionItem.dataset.sessionId);
    render();
    syncHistory(state);
    return;
  }

  const newSessionBtn = event.target.closest('[data-action="new-session"]');
  if (newSessionBtn) {
    state = addSession(state);
    render();
    syncHistory(state);
    return;
  }

  const closeSessions = event.target.closest('[data-action="close-sessions-panel-btn"]');
  if (closeSessions) { state = toggleSessionsPanel(state); render(); return; }

  const sessionsBackdrop = event.target.closest('[data-action="close-sessions-panel"]');
  if (sessionsBackdrop && event.target === sessionsBackdrop) { state = { ...state, sessionsPanelOpen: false }; render(); return; }

  // ── Send message ──────────────────────────────────────────────────────────
  const sendBtn = event.target.closest('[data-action="send-message"]');
  if (sendBtn) {
    if (state.pipelineRunning) return;
    const input = document.getElementById("workspace-composer-input");
    const message = input?.value?.trim();
    if (!message) return;
    input.value = "";
    await startInitialPipeline(message);
    return;
  }

  // ── Copy selection ────────────────────────────────────────────────────────
  const selectCopyBtn = event.target.closest('[data-action="select-copy"]');
  if (selectCopyBtn) {
    const idx = parseInt(selectCopyBtn.dataset.copyIndex, 10);
    state = setPipelineContext(state, { selectedCopyIndex: idx });
    if (!patchApproveGate()) render();
    return;
  }

  // ── Regen copy ────────────────────────────────────────────────────────────
  const regenCopyBtn = event.target.closest('[data-action="regen-copy"]');
  if (regenCopyBtn) {
    if (state.pipelineRunning) return;
    const feedbackInput = document.querySelector(".approve-feedback-input");
    const feedback = feedbackInput?.value?.trim() || "";
    state = appendFeedItem(state, {
      id: `feed-user-${Date.now()}`,
      type: "user_message",
      text: feedback ? `카피 재생성 — ${feedback}` : "카피를 다시 생성해줘"
    });
    state = setPipelineStage(state, null);
    await runStage("regen_copy", { feedback });
    return;
  }

  const confirmResearchInfoBtn = event.target.closest('[data-action="confirm-research-info"]');
  if (confirmResearchInfoBtn) {
    if (state.pipelineRunning) return;
    const feedbackInput = document.querySelector(".approve-feedback-input");
    const feedback = feedbackInput?.value?.trim() || "";
    if (!feedback) {
      feedbackInput?.focus();
      return;
    }
    state = appendFeedItem(state, {
      id: `feed-user-${Date.now()}`,
      type: "user_message",
      text: `추가 정보 — ${feedback}`
    });
    state = setPipelineContext(state, { researchClarification: feedback });
    state = setPipelineStage(state, null);
    await runStage("research_followup", { researchClarification: feedback });
    return;
  }

  // ── Confirm copy → run scenario ───────────────────────────────────────────
  const confirmCopyBtn = event.target.closest('[data-action="confirm-copy"]');
  if (confirmCopyBtn) {
    if (state.pipelineRunning) return;
    const idx = state.pipelineContext?.selectedCopyIndex ?? 0;
    const copies = state.pipelineContext?.copies ?? [];
    const selectedCopy = copies[idx] ?? copies[0] ?? { headline: "", desc: "" };
    state = appendFeedItem(state, {
      id: `feed-user-${Date.now()}`,
      type: "user_message",
      text: `"${selectedCopy.headline}" — 이 카피로 시나리오 작성해줘`
    });
    state = setPipelineContext(state, { selectedCopy });
    state = setPipelineStage(state, null);
    await runStage("scenario");
    return;
  }

  // ── Regen scenario ────────────────────────────────────────────────────────
  const regenScenarioBtn = event.target.closest('[data-action="regen-scenario"]');
  if (regenScenarioBtn) {
    if (state.pipelineRunning) return;
    const feedbackInput = document.querySelector(".approve-feedback-input");
    const feedback = feedbackInput?.value?.trim() || "";
    state = appendFeedItem(state, {
      id: `feed-user-${Date.now()}`,
      type: "user_message",
      text: feedback ? `시나리오 수정 — ${feedback}` : "시나리오를 수정해줘"
    });
    state = setPipelineStage(state, null);
    await runStage("scenario", { feedback });
    return;
  }

  // ── History navigation ────────────────────────────────────────────────────
  const historyBtn = event.target.closest('[data-action="history-nav"]');
  if (historyBtn) {
    const { historyType, historyDir } = historyBtn.dataset;
    const delta = historyDir === "prev" ? -1 : 1;
    if (historyType === "copy") {
      state = setCopyHistoryIdx(state, (state.copyHistoryIdx ?? 0) + delta);
    } else if (historyType === "scenario") {
      state = setScenarioHistoryIdx(state, (state.scenarioHistoryIdx ?? 0) + delta);
    }
    render();
    return;
  }

  // ── Confirm scenario → run storyboard ─────────────────────────────────────
  const confirmScenarioBtn = event.target.closest('[data-action="confirm-scenario"]');
  if (confirmScenarioBtn) {
    if (state.pipelineRunning) return;
    state = appendFeedItem(state, {
      id: `feed-user-${Date.now()}`,
      type: "user_message",
      text: "시나리오 승인 — 스토리보드 생성해줘"
    });
    state = setPipelineStage(state, null);
    await runStage("storyboard");
    return;
  }
});

// ─── Enter key in composer ────────────────────────────────────────────────

app.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  const input = event.target.closest("#workspace-composer-input");
  if (!input) return;
  event.preventDefault();
  if (state.pipelineRunning || state.pipelineStage) return;
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  await startInitialPipeline(message);
});

// ─── LLM model selection ──────────────────────────────────────────────────

app.addEventListener("change", (event) => {
  const llmSelect = event.target.closest(".llm-select");
  if (llmSelect) {
    state = setModel(state, llmSelect.value);
  }
});

window.addEventListener("popstate", () => {
  applyRouteFromLocation({ replace: true });
});

applyRouteFromLocation({ replace: true });
