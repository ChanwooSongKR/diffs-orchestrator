import {
  seedActiveSubAgents,
  seedApproveGate,
  seedComposer,
  seedFeedItems,
  seedFocusPanel,
  seedProjects,
  seedSessions,
  seedTasks
} from "./data.js";

function cloneProject(project) {
  return { ...project };
}

function cloneTask(task) {
  const outputs = Array.isArray(task.outputs)
    ? [...task.outputs]
    : (task.outputs && typeof task.outputs === "object")
      ? { ...task.outputs, acts: Array.isArray(task.outputs.acts) ? task.outputs.acts.map(a => ({ ...a, scenes: Array.isArray(a.scenes) ? [...a.scenes] : [] })) : [] }
      : [];
  return {
    ...task,
    agents: Array.isArray(task.agents) ? [...task.agents] : [],
    outputs
  };
}

function cloneFeedItem(item) {
  return { ...item };
}

function cloneFocusPanel(panel) {
  return {
    ...panel,
    meta: Array.isArray(panel.meta) ? panel.meta.map((item) => ({ ...item })) : []
  };
}

function createId(prefix) {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return `${prefix}-${randomUuid}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLegacyAgent(task) {
  const outputsArr = Array.isArray(task.outputs) ? task.outputs : [];
  return {
    id: task.id,
    name: task.name,
    status: task.status,
    detail: {
      summary: task.summary,
      task: task.summary,
      context: task.reason,
      output: outputsArr[0] ?? "",
      updates: [task.summary, task.reason].filter(Boolean),
      artifacts: outputsArr.map((output) => ({
        title: typeof output === "string" ? output : output.headline ?? output.title ?? "",
        description: typeof output === "string" ? output : output.desc ?? ""
      }))
    }
  };
}

function createLegacyMessages(feedItems) {
  return feedItems.map((item) => {
    if (item.type === "status") {
      return {
        id: item.id,
        role: "system",
        author: "System",
        type: "status",
        text: item.text,
        timestamp: "09:17"
      };
    }

    if (item.type === "result_card") {
      return {
        id: item.id,
        role: "system",
        author: "System",
        type: "reply",
        text: `${item.title} ${item.body}`,
        timestamp: "09:18"
      };
    }

    return {
      id: item.id,
      role: item.type === "user_message" ? "user" : "system",
      author: item.type === "user_message" ? "You" : "System",
      type: "reply",
      text: item.text,
      timestamp: "09:16"
    };
  });
}

export function createProject(name) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    throw new Error("Project name is required");
  }

  return {
    id: createId("project"),
    type: "project",
    name: trimmed,
    updatedAt: "just now",
    status: "Drafts ready"
  };
}

export function createInitialState() {
  const tasks = seedTasks.map(cloneTask);
  const feedItems = seedFeedItems.map(cloneFeedItem);

  return {
    view: "projects",
    projects: seedProjects.map(cloneProject),
    selectedProjectId: null,
    tasks,
    selectedTaskId: null,
    taskDetailOpen: false,
    feedItems,
    focusPanel: cloneFocusPanel(seedFocusPanel),
    approveGate: { ...seedApproveGate },
    composer: { ...seedComposer },
    sessions: seedSessions.map(s => ({ ...s })),
    activeSessionId: "session-1",
    sessionsPanelOpen: false,
    activeSubAgents: seedActiveSubAgents.map(a => ({ ...a })),
    // Compatibility fields keep the current renderer operational while the
    // workspace renderer catches up to the new task-rail model.
    agents: tasks.map(createLegacyAgent),
    selectedAgentId: null,
    messages: createLegacyMessages(feedItems),
    selectedOutput: cloneFocusPanel(seedFocusPanel),
    workspaceBadge: null,
    workspaceStatus: "Chat-first collaboration view",
    agentModalOpen: false
  };
}

export function addProject(state, name) {
  return {
    ...state,
    projects: [createProject(name), ...((state.projects ?? []).map(cloneProject))]
  };
}

export function selectProject(state, projectId) {
  const selectedTaskId = state.tasks?.[0]?.id ?? null;

  return {
    ...state,
    view: "workspace",
    selectedProjectId: projectId,
    selectedTaskId,
    selectedAgentId: selectedTaskId,
    taskDetailOpen: false,
    agentModalOpen: false
  };
}

export function openTaskDetail(state, taskId) {
  return {
    ...state,
    selectedTaskId: taskId,
    selectedAgentId: taskId,
    taskDetailOpen: true,
    agentModalOpen: false
  };
}

export function closeTaskDetail(state) {
  return {
    ...state,
    taskDetailOpen: false,
    agentModalOpen: false
  };
}

export function toggleSessionsPanel(state) {
  return { ...state, sessionsPanelOpen: !state.sessionsPanelOpen };
}

export function selectSession(state, sessionId) {
  return { ...state, activeSessionId: sessionId, sessionsPanelOpen: false };
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
