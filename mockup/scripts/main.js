import {
  addProject,
  addSession,
  closeTaskDetail,
  createInitialState,
  openTaskDetail,
  selectProject,
  selectSession,
  toggleSessionsPanel
} from "./state.js";
import { renderProjectsView } from "./render-projects.js";
import { renderWorkspaceView } from "./render-workspace.js";

const app = document.getElementById("app");
let state = createInitialState();

function render() {
  app.innerHTML =
    state.view === "projects" ? renderProjectsView(state) : renderWorkspaceView(state);
}

document.addEventListener("click", (event) => {
  const homeBtn = event.target.closest('[data-action="go-home"]');
  if (homeBtn) {
    state = { ...state, view: "projects", selectedProjectId: null, selectedTaskId: null, taskDetailOpen: false, sessionsPanelOpen: false };
    render();
  }
});

app.addEventListener("click", (event) => {
  const createButton = event.target.closest('[data-action="create-project-button"]');
  if (createButton) {
    const projectName = window.prompt("프로젝트 이름을 입력하세요");
    if (!projectName) return;

    try {
      state = addProject(state, projectName);
      render();
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }

  const projectButton = event.target.closest('[data-action="open-project"]');
  if (projectButton) {
    state = selectProject(state, projectButton.dataset.projectId);
    render();
    return;
  }

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

  const backButton = event.target.closest('[data-action="go-projects"]');
  if (backButton) {
    state = { ...state, view: "projects", selectedProjectId: null, selectedTaskId: null, taskDetailOpen: false, sessionsPanelOpen: false };
    render();
    return;
  }

  const sessionsToggle = event.target.closest('[data-action="toggle-sessions"]');
  if (sessionsToggle) {
    state = toggleSessionsPanel(state);
    render();
    return;
  }

  const sessionItem = event.target.closest('[data-action="select-session"]');
  if (sessionItem) {
    state = selectSession(state, sessionItem.dataset.sessionId);
    render();
    return;
  }

  const newSessionBtn = event.target.closest('[data-action="new-session"]');
  if (newSessionBtn) {
    state = addSession(state);
    render();
    return;
  }

  const closeSessions = event.target.closest('[data-action="close-sessions-panel-btn"]');
  if (closeSessions) {
    state = toggleSessionsPanel(state);
    render();
    return;
  }

  const sessionsBackdrop = event.target.closest('[data-action="close-sessions-panel"]');
  if (sessionsBackdrop && event.target === sessionsBackdrop) {
    state = { ...state, sessionsPanelOpen: false };
    render();
    return;
  }
});

render();
