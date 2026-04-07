import test from "node:test";
import assert from "node:assert/strict";

import { addProject, createInitialState, selectProject } from "../mockup/scripts/state.js";
import { renderProjectsView } from "../mockup/scripts/render-projects.js";
import { renderWorkspaceView } from "../mockup/scripts/render-workspace.js";

function createWorkspaceState() {
  const seededState = addProject(createInitialState(), "Fresh Campaign");
  return selectProject(seededState, seededState.projects[0].id);
}

test("renderProjectsView exposes the launcher entry point and empty state", () => {
  const html = renderProjectsView(createInitialState());

  assert.match(html, /Create Project/);
  assert.match(html, /첫 프로젝트를 만들어 시작하세요/);
  assert.match(html, /0개 프로젝트/);
  assert.doesNotMatch(html, /folder-card"/);
});

test("renderWorkspaceView shows a stable empty state when no runtime agents are active", () => {
  const state = createWorkspaceState();
  state.activeSubAgents = [];

  const html = renderWorkspaceView(state);

  assert.match(html, /Current Flow/);
  assert.match(html, /활성 에이전트 없음|실행 중인 에이전트 없음/);
  assert.match(html, /empty-rail/);
  assert.doesNotMatch(html, /sub-agent-item/);
});

test("renderWorkspaceView does not fabricate demo tasks when runtime tasks are empty", () => {
  const state = createWorkspaceState();
  state.tasks = [];
  state.selectedTaskId = null;
  state.taskDetailOpen = true;

  const html = renderWorkspaceView(state);

  assert.match(html, /Current Flow/);
  assert.match(html, /empty-rail--agents/);
  assert.doesNotMatch(html, /Research|Copy|Scenario|Storyboard/);
  assert.doesNotMatch(html, /task-modal/);
});

test("renderWorkspaceView renders only the runtime agents present in activeSubAgents", () => {
  const state = createWorkspaceState();
  state.activeSubAgents = [
    { id: "sub-1", name: "External Research Agent", activity: "나이키 경쟁사 키워드 검색 중" },
    { id: "sub-2", name: "Memory Agent", activity: "브랜드 히스토리 임베딩 저장 중" }
  ];

  const html = renderWorkspaceView(state);

  assert.match(html, /Current Flow/);
  assert.match(html, /sub-agent-item/);
  assert.match(html, /External Research Agent/);
  assert.match(html, /Memory Agent/);
  assert.match(html, /나이키 경쟁사 키워드 검색 중/);
  assert.match(html, /브랜드 히스토리 임베딩 저장 중/);
  assert.doesNotMatch(html, /empty-rail--agents/);
  assert.doesNotMatch(html, /status-rail-item/);
  assert.match(html, /Chat Sessions/);
});

test("renderWorkspaceView shows streamed text while a system bubble is still streaming", () => {
  const state = createWorkspaceState();
  state.feedItems = [
    {
      id: "stream-1",
      type: "stream_text",
      text: `{"summary":"partial streamed text","keyInsights":["line two"]}`,
      isStreaming: true
    }
  ];

  const html = renderWorkspaceView(state);

  assert.match(html, /partial streamed text/);
  assert.match(html, /line two/);
  assert.doesNotMatch(html, /"summary"/);
  assert.doesNotMatch(html, /typing-dots/);
});

test("renderWorkspaceView keeps the final streamed text without typing motion after completion", () => {
  const state = createWorkspaceState();
  state.feedItems = [
    {
      id: "stream-1",
      type: "stream_text",
      text: "final streamed text",
      isStreaming: false,
      isCollapsed: true
    }
  ];

  const html = renderWorkspaceView(state);

  assert.doesNotMatch(html, /final streamed text/);
  assert.match(html, /stream-toggle-btn/);
  assert.match(html, /stream-toggle-icon/);
  assert.match(html, /aria-label="펼치기"/);
  assert.doesNotMatch(html, /typing-dots/);
});

test("renderWorkspaceView preserves the beginning of long streamed text", () => {
  const state = createWorkspaceState();
  const longText = "시작문장 " + "가".repeat(700) + "\n마지막문장";
  state.feedItems = [
    {
      id: "stream-1",
      type: "stream_text",
      text: longText,
      isStreaming: false,
      isCollapsed: false
    }
  ];

  const html = renderWorkspaceView(state);

  assert.match(html, /시작문장/);
  assert.match(html, /마지막문장/);
  assert.doesNotMatch(html, /^.*<pre class="stream-text">…/s);
});

test("renderWorkspaceView hides collapse controls while streaming is in progress", () => {
  const state = createWorkspaceState();
  state.feedItems = [
    {
      id: "stream-1",
      type: "stream_text",
      text: "still streaming",
      isStreaming: true
    }
  ];

  const html = renderWorkspaceView(state);

  assert.doesNotMatch(html, /stream-toggle-btn/);
});

test("renderWorkspaceView shows a dedicated research clarification gate", () => {
  const state = createWorkspaceState();
  state.pipelineStage = "waiting_research_input";
  state.pipelineContext = {
    originalMessage: "러닝 광고 만들어줘",
    researchQuestion: "타깃 연령대를 알려주세요.",
    researchMissingFields: ["targetAudience"],
    researchReason: "타깃 정보가 없습니다."
  };

  const html = renderWorkspaceView(state);

  assert.match(html, /추가 정보 요청/);
  assert.match(html, /타깃 연령대를 알려주세요/);
  assert.match(html, /targetAudience/);
  assert.match(html, /이 정보로 계속/);
});

test("renderWorkspaceView wraps copy choices in a dedicated scrollable body", () => {
  const state = createWorkspaceState();
  state.pipelineStage = "waiting_copy";
  state.pipelineContext = {
    copies: Array.from({ length: 10 }, (_, index) => ({
      headline: `Copy ${index + 1} headline`,
      desc: `Copy ${index + 1} description`
    })),
    selectedCopyIndex: 0
  };

  const html = renderWorkspaceView(state);

  assert.match(html, /approve-gate__body approve-gate__body--copy/);
  assert.match(html, /approve-copy-grid/);
  assert.match(html, /Copy 10 headline/);
});

test("renderWorkspaceView can collapse the copy selection gate into a compact summary", () => {
  const state = createWorkspaceState();
  state.pipelineStage = "waiting_copy";
  state.pipelineContext = {
    copies: [
      { headline: "Copy 1 headline", desc: "Copy 1 description" },
      { headline: "Copy 2 headline", desc: "Copy 2 description" }
    ],
    selectedCopyIndex: 1,
    approveGateCollapsed: true
  };

  const html = renderWorkspaceView(state);

  assert.match(html, /approve-gate is-collapsed/);
  assert.match(html, /Copy 2 headline/);
  assert.match(html, /data-action="toggle-approve-gate-collapse"/);
  assert.doesNotMatch(html, /approve-copy-grid/);
  assert.doesNotMatch(html, /approve-feedback-input/);
  assert.doesNotMatch(html, /confirm-copy/);
});
