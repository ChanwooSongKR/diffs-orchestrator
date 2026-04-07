import test from "node:test";
import assert from "node:assert/strict";

import {
  addProject,
  applyAgentActivity,
  completeStreamingFeedItems,
  closeTaskDetail,
  applyRoute,
  createInitialState,
  createProject,
  openTaskDetail,
  selectProject,
  updateFeedItem
} from "../mockup/scripts/state.js";

test("createProject trims the name and seeds launcher metadata", () => {
  const project = createProject("  Nike Night Run  ");

  assert.equal(project.name, "Nike Night Run");
  assert.equal(project.type, "project");
  assert.equal(project.status, "새 프로젝트");
  assert.match(project.id, /^project-/);
});

test("createProject rejects empty names", () => {
  assert.throws(() => createProject("   "), /Project name is required/);
});

test("createInitialState starts with an empty launcher state", () => {
  const state = createInitialState();
  const removedFields = [
    "approveGate",
    "agents",
    "messages",
    "selectedOutput",
    "workspaceBadge",
    "workspaceStatus",
    "agentModalOpen",
    "selectedAgentId"
  ];

  assert.equal(state.view, "projects");
  assert.deepEqual(state.projects, []);
  assert.deepEqual(state.sessions, []);
  assert.deepEqual(state.tasks, []);
  assert.deepEqual(state.feedItems, []);
  assert.deepEqual(state.activeSubAgents, []);
  removedFields.forEach((field) => {
    assert.equal(Object.hasOwn(state, field), false, `${field} should not exist on initial state`);
  });
});

test("applyRoute opens a project and selects the requested session", () => {
  const state = addProject(createInitialState(), "Fresh Campaign");
  const projectId = state.projects[0].id;
  const openedState = selectProject(state, projectId);
  const sessionId = openedState.sessions[0].id;

  const nextState = applyRoute(openedState, {
    view: "workspace",
    projectId,
    sessionId
  });

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, projectId);
  assert.equal(nextState.activeSessionId, sessionId);
});

test("applyRoute repairs a missing session id by selecting the default session", () => {
  const state = addProject(createInitialState(), "Fresh Campaign");
  const projectId = state.projects[0].id;

  const nextState = applyRoute(state, {
    view: "workspace",
    projectId,
    sessionId: "missing-session"
  });

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, projectId);
  assert.equal(nextState.activeSessionId, nextState.sessions[0].id);
});

test("applyRoute falls back to the launcher when the project is missing", () => {
  const nextState = applyRoute(createInitialState(), {
    view: "workspace",
    projectId: "missing-project",
    sessionId: null
  });

  assert.equal(nextState.view, "projects");
  assert.equal(nextState.selectedProjectId, null);
  assert.deepEqual(nextState.sessions, []);
});

test("addProject inserts a new project at the front and preserves current view state", () => {
  const state = {
    ...createInitialState(),
    view: "workspace",
    selectedProjectId: "project-seed-2",
    selectedTaskId: "concept",
    taskDetailOpen: true
  };

  const nextState = addProject(state, "New Client Pitch");

  assert.equal(nextState.projects.length, 1);
  assert.equal(nextState.projects[0].name, "New Client Pitch");
  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, "project-seed-2");
  assert.equal(nextState.selectedTaskId, "concept");
  assert.equal(nextState.taskDetailOpen, true);
});

test("selectProject opens the workspace and defaults to the first task group", () => {
  const state = addProject(createInitialState(), "Fresh Campaign");
  const nextState = selectProject(state, state.projects[0].id);

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, state.projects[0].id);
  assert.equal(nextState.selectedTaskId, "research");
  assert.equal(nextState.taskDetailOpen, false);
  [
    "approveGate",
    "agents",
    "messages",
    "selectedOutput",
    "workspaceBadge",
    "workspaceStatus",
    "agentModalOpen",
    "selectedAgentId"
  ].forEach((field) => {
    assert.equal(Object.hasOwn(nextState, field), false, `${field} should not exist on workspace state`);
  });
});

test("selectProject resets chat sessions for a newly created project", () => {
  const state = addProject(createInitialState(), "Fresh Campaign");
  const newProjectId = state.projects[0].id;

  const nextState = selectProject(state, newProjectId);

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, newProjectId);
  assert.equal(nextState.sessions.length, 1);
  assert.equal(nextState.sessions[0].messageCount, 0);
  assert.equal(nextState.sessions[0].preview, "새로운 세션");
  assert.equal(nextState.activeSessionId, nextState.sessions[0].id);
  assert.deepEqual(nextState.feedItems, []);
});

test("openTaskDetail selects a task and opens the popup", () => {
  const seededState = addProject(createInitialState(), "Fresh Campaign");
  const state = selectProject(seededState, seededState.projects[0].id);
  const nextState = openTaskDetail(state, "drafts");

  assert.equal(nextState.selectedTaskId, "drafts");
  assert.equal(nextState.taskDetailOpen, true);
  assert.equal(Object.hasOwn(nextState, "agentModalOpen"), false);
});

test("closeTaskDetail closes the popup without clearing the selected task", () => {
  const seededState = addProject(createInitialState(), "Fresh Campaign");
  const workspaceState = selectProject(seededState, seededState.projects[0].id);
  const state = openTaskDetail(workspaceState, "drafts");
  const nextState = closeTaskDetail(state);

  assert.equal(nextState.selectedTaskId, "drafts");
  assert.equal(nextState.taskDetailOpen, false);
  assert.equal(Object.hasOwn(nextState, "agentModalOpen"), false);
});

test("updateFeedItem patches a single streamed feed item", () => {
  const state = {
    ...createInitialState(),
    feedItems: [
      { id: "stream-1", type: "stream_text", text: "", isStreaming: true },
      { id: "other-1", type: "status", text: "idle" }
    ]
  };

  const nextState = updateFeedItem(state, "stream-1", (item) => ({
    ...item,
    text: "partial streamed text"
  }));

  assert.equal(nextState.feedItems[0].text, "partial streamed text");
  assert.equal(nextState.feedItems[0].isStreaming, true);
  assert.equal(nextState.feedItems[1].text, "idle");
});

test("completeStreamingFeedItems marks active streamed bubbles as finished", () => {
  const state = {
    ...createInitialState(),
    feedItems: [
      { id: "stream-1", type: "stream_text", text: "done", isStreaming: true },
      { id: "stream-2", type: "stream_text", text: "already done", isStreaming: false },
      { id: "other-1", type: "status", text: "idle" }
    ]
  };

  const nextState = completeStreamingFeedItems(state);

  assert.equal(nextState.feedItems[0].isStreaming, false);
  assert.equal(nextState.feedItems[0].isCollapsed, true);
  assert.equal(nextState.feedItems[1].isStreaming, false);
  assert.equal(nextState.feedItems[2].text, "idle");
});

test("applyAgentActivity adds running agents, updates waiting state, and removes completed agents", () => {
  const seededState = addProject(createInitialState(), "Fresh Campaign");
  const workspaceState = selectProject(seededState, seededState.projects[0].id);

  const runningState = applyAgentActivity(workspaceState, {
    agent: "research",
    status: "running",
    label: "Research Agent",
    detail: "브리프를 분석 중입니다."
  });
  assert.equal(runningState.activeSubAgents.length, 1);
  assert.equal(runningState.activeSubAgents[0].id, "research");
  assert.equal(runningState.activeSubAgents[0].activity, "브리프를 분석 중입니다.");

  const waitingState = applyAgentActivity(runningState, {
    agent: "research",
    status: "waiting",
    label: "Research Agent",
    detail: "추가 정보 입력 대기 중입니다."
  });
  assert.equal(waitingState.activeSubAgents.length, 1);
  assert.equal(waitingState.activeSubAgents[0].status, "waiting");
  assert.equal(waitingState.activeSubAgents[0].activity, "추가 정보 입력 대기 중입니다.");

  const completedState = applyAgentActivity(waitingState, {
    agent: "research",
    status: "completed"
  });
  assert.equal(completedState.activeSubAgents.length, 0);
});
