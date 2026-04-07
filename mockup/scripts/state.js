import {
  createEmptyLauncherCollections
} from "./data.js";

function cloneProject(project) {
  return { ...project };
}

function createId(prefix) {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return `${prefix}-${randomUuid}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlankPanel() {
  return {
    eyebrow: "",
    title: "",
    body: "",
    meta: []
  };
}

function createBlankComposer() {
  return {
    value: "",
    placeholder: "Type a message to continue the workspace conversation.",
    actionLabel: "Send"
  };
}

/** Tasks for a brand-new project — all pending/blocked */
function createFreshTasks() {
  return [
    {
      id: "research", name: "Research", status: "Pending", statusKind: "default",
      summary: "브리프를 입력하면 리서치가 시작됩니다.",
      reason: "", agents: [], outputs: [], nextAction: ""
    },
    {
      id: "copy", name: "Copy", status: "Blocked", statusKind: "blocked",
      summary: "리서치 완료 후 카피가 생성됩니다.",
      reason: "", agents: [], outputs: [], nextAction: ""
    },
    {
      id: "scenario", name: "Scenario", status: "Blocked", statusKind: "blocked",
      summary: "카피 선택 후 시나리오가 작성됩니다.",
      reason: "", agents: [], outputs: [], nextAction: ""
    },
    {
      id: "storyboard", name: "Storyboard", status: "Blocked", statusKind: "blocked",
      summary: "시나리오 확정 후 스토리보드가 생성됩니다.",
      reason: "", agents: [], outputs: [], nextAction: ""
    }
  ];
}

function createFreshSessions() {
  return [
    {
      id: createId("session"),
      label: "Session 1",
      timestamp: "방금",
      preview: "새로운 세션",
      status: "active",
      messageCount: 0
    }
  ];
}

function createLauncherState() {
  const { projects, tasks, feedItems, sessions, activeSubAgents } = createEmptyLauncherCollections();

  return {
    projects,
    tasks,
    feedItems,
    sessions,
    activeSubAgents,
    focusPanel: createBlankPanel(),
    composer: createBlankComposer(),
    selectedTaskId: null,
    taskDetailOpen: false,
    activeSessionId: null,
    sessionsPanelOpen: false,
    pipelineRunning: false,
    pipelineStage: null,
    pipelineContext: {},
    storyboardImages: {},
    createProjectModalOpen: false,
    copyHistory: [],
    copyHistoryIdx: -1,
    scenarioHistory: [],
    scenarioHistoryIdx: -1
  };
}

function createWorkspaceState() {
  const tasks = createFreshTasks();
  const sessions = createFreshSessions();
  const selectedTaskId = tasks[0]?.id ?? null;

  return {
    tasks,
    feedItems: [],
    sessions,
    activeSubAgents: [],
    focusPanel: createBlankPanel(),
    composer: createBlankComposer(),
    selectedTaskId,
    taskDetailOpen: false,
    activeSessionId: sessions[0]?.id ?? null,
    sessionsPanelOpen: false,
    pipelineRunning: false,
    pipelineStage: null,
    pipelineContext: {},
    storyboardImages: {},
    createProjectModalOpen: false,
    copyHistory: [],
    copyHistoryIdx: -1,
    scenarioHistory: [],
    scenarioHistoryIdx: -1
  };
}

export function createProject(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Project name is required");
  return {
    id: createId("project"),
    type: "project",
    name: trimmed,
    updatedAt: "방금",
    status: "새 프로젝트",
    isNew: true
  };
}

export function createInitialState() {
  return {
    view: "projects",
    ...createLauncherState(),
    selectedProjectId: null,
    projects: [],
    // Pipeline state
    selectedModel: "Gemini 3 Flash",
    pipelineStage: null
  };
}

export function addProject(state, name) {
  return {
    ...state,
    projects: [createProject(name), ...((state.projects ?? []).map(cloneProject))]
  };
}

export function selectProject(state, projectId) {
  return {
    ...state,
    ...createWorkspaceState(),
    view: "workspace",
    selectedProjectId: projectId,
    selectedTaskId: "research"
  };
}

export function openTaskDetail(state, taskId) {
  return { ...state, selectedTaskId: taskId, taskDetailOpen: true };
}

export function closeTaskDetail(state) {
  return { ...state, taskDetailOpen: false };
}

export function toggleSessionsPanel(state) {
  return { ...state, sessionsPanelOpen: !state.sessionsPanelOpen };
}

export function selectSession(state, sessionId) {
  return { ...state, activeSessionId: sessionId, sessionsPanelOpen: false };
}

export function applyRoute(state, route) {
  if (!route || route.view !== "workspace" || !route.projectId) {
    return {
      ...state,
      ...createLauncherState(),
      view: "projects",
      selectedProjectId: null
    };
  }

  const projectExists = (state.projects ?? []).some((project) => project.id === route.projectId);
  if (!projectExists) {
    return {
      ...state,
      ...createLauncherState(),
      view: "projects",
      selectedProjectId: null
    };
  }

  const nextState = state.view === "workspace" && state.selectedProjectId === route.projectId
    ? state
    : selectProject(state, route.projectId);
  const sessionExists = route.sessionId
    && (nextState.sessions ?? []).some((session) => session.id === route.sessionId);

  if (sessionExists) {
    return selectSession(nextState, route.sessionId);
  }

  if (route.sessionId && (nextState.sessions ?? []).length > 0) {
    return selectSession(nextState, nextState.sessions[0].id);
  }

  return nextState;
}

export function appendFeedItem(state, item) {
  return { ...state, feedItems: [...(state.feedItems ?? []), item] };
}

export function updateFeedItem(state, itemId, updater) {
  return {
    ...state,
    feedItems: (state.feedItems ?? []).map((item) =>
      item.id === itemId ? updater(item) : item
    )
  };
}

export function completeStreamingFeedItems(state) {
  return {
    ...state,
    feedItems: (state.feedItems ?? []).map((item) =>
      item.type === "stream_text" && item.isStreaming !== false
        ? { ...item, isStreaming: false, isCollapsed: true }
        : item
    )
  };
}

export function updateTask(state, patch) {
  const tasks = (state.tasks ?? []).map(t =>
    t.id === patch.id ? { ...t, ...patch } : t
  );
  return { ...state, tasks };
}

export function applyAgentActivity(state, activity) {
  const agentId = activity?.agent;
  const status = activity?.status;

  if (!agentId || !status) return state;

  if (status === "completed" || status === "failed") {
    return {
      ...state,
      activeSubAgents: (state.activeSubAgents ?? []).filter((agent) => agent.id !== agentId)
    };
  }

  if (status !== "running" && status !== "waiting") {
    return state;
  }

  const nextAgent = {
    id: agentId,
    name: activity.label ?? agentId,
    task: activity.task ?? agentId,
    activity: activity.detail ?? (status === "waiting" ? "사용자 입력 대기 중" : "작업 실행 중"),
    status
  };

  const existingAgents = state.activeSubAgents ?? [];
  const existingIndex = existingAgents.findIndex((agent) => agent.id === agentId);
  if (existingIndex === -1) {
    return {
      ...state,
      activeSubAgents: [...existingAgents, nextAgent]
    };
  }

  return {
    ...state,
    activeSubAgents: existingAgents.map((agent, index) => (
      index === existingIndex ? { ...agent, ...nextAgent } : agent
    ))
  };
}

export function clearActiveAgents(state) {
  if (!(state.activeSubAgents?.length > 0)) return state;
  return { ...state, activeSubAgents: [] };
}

export function setModel(state, model) {
  return { ...state, selectedModel: model };
}

export function setPipelineRunning(state, running) {
  return { ...state, pipelineRunning: Boolean(running) };
}

export function setPipelineStage(state, stage) {
  return { ...state, pipelineStage: stage };
}

export function setPipelineContext(state, ctx) {
  return { ...state, pipelineContext: { ...state.pipelineContext, ...ctx } };
}

export function addStoryboardImage(state, scene, imageBase64) {
  return { ...state, storyboardImages: { ...state.storyboardImages, [scene]: imageBase64 } };
}

export function setCreateProjectModal(state, open) {
  return { ...state, createProjectModalOpen: Boolean(open) };
}

export function pushCopyHistory(state, copies) {
  const history = [...(state.copyHistory ?? []), copies];
  return { ...state, copyHistory: history, copyHistoryIdx: history.length - 1 };
}

export function pushScenarioHistory(state, scenario) {
  const history = [...(state.scenarioHistory ?? []), scenario];
  return { ...state, scenarioHistory: history, scenarioHistoryIdx: history.length - 1 };
}

export function setCopyHistoryIdx(state, idx) {
  const max = (state.copyHistory?.length ?? 0) - 1;
  return { ...state, copyHistoryIdx: Math.max(0, Math.min(idx, max)) };
}

export function setScenarioHistoryIdx(state, idx) {
  const max = (state.scenarioHistory?.length ?? 0) - 1;
  return { ...state, scenarioHistoryIdx: Math.max(0, Math.min(idx, max)) };
}

export function addSession(state) {
  const newSession = {
    id: `session-${Date.now()}`,
    label: `Session ${(state.sessions?.length ?? 0) + 1}`,
    timestamp: "방금",
    preview: "새로운 세션",
    status: "active",
    messageCount: 0
  };
  return {
    ...state,
    sessions: [newSession, ...(state.sessions ?? [])],
    activeSessionId: newSession.id,
    sessionsPanelOpen: false,
    feedItems: []
  };
}
