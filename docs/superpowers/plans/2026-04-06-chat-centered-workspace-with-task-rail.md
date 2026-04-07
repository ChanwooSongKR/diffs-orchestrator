# Chat-Centered Workspace With Task Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mockup so project entry leads into a chat-centered workspace with a left task-status rail, task-detail popups, and feed objects ordered around user decisions rather than exposed individual agents.

**Architecture:** Keep the existing static HTML/CSS/vanilla JS mockup shape, but replace the old “visible agent list” model with a task-group state model. Use pure state helpers for project and task status, pure renderers for project launcher and workspace, and verify state logic with `node --test` while manually checking browser flow and visual hierarchy.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), Node built-in test runner

---

## File Structure

### Modify

- `mockup/index.html`
- `mockup/styles/theme.css`
- `mockup/scripts/data.js`
- `mockup/scripts/state.js`
- `mockup/scripts/render-projects.js`
- `mockup/scripts/render-workspace.js`
- `mockup/scripts/main.js`
- `tests/state.test.js`
- `docs/mockup-manual-checklist.md`

### Responsibilities

- `mockup/index.html`: App shell and top navigation with the Diffs logo.
- `mockup/styles/theme.css`: Layout, hierarchy, task rail, popup, feed object styling, and spacing.
- `mockup/scripts/data.js`: Seed project cards, task groups, feed items, and popup drilldown content.
- `mockup/scripts/state.js`: Pure transitions for project creation, project selection, task selection, popup toggling, and project/workspace view switching.
- `mockup/scripts/render-projects.js`: Project launcher view with lightweight project status summaries.
- `mockup/scripts/render-workspace.js`: Chat-centered workspace with left task rail, feed, right focus panel, and task inspector popup.
- `mockup/scripts/main.js`: Event wiring between launcher actions, task clicks, popup close actions, and workspace navigation.
- `tests/state.test.js`: State coverage for the new task-group and popup model.
- `docs/mockup-manual-checklist.md`: Browser verification list for the revised UX logic.

### Reference Inputs

- `docs/superpowers/specs/2026-04-05-project-management-and-workspace-design.md`
- `requirements.md`
- `interaction-model.md`
- `design-reference/index.html`

## Task 1: Replace The State Model With Project Status And Task Rail Data

**Files:**
- Modify: `mockup/scripts/data.js`
- Modify: `mockup/scripts/state.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Rewrite the failing tests for the new task-group model**

Replace `tests/state.test.js` with:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  addProject,
  createInitialState,
  createProject,
  openTaskDetail,
  closeTaskDetail,
  selectProject
} from "../mockup/scripts/state.js";

test("createProject trims the name and seeds launcher metadata", () => {
  const project = createProject("  Nike Night Run  ");

  assert.equal(project.name, "Nike Night Run");
  assert.equal(project.type, "project");
  assert.equal(project.status, "Drafts ready");
  assert.match(project.id, /^project-/);
});

test("createProject rejects empty names", () => {
  assert.throws(() => createProject("   "), /Project name is required/);
});

test("addProject inserts a new project at the front and preserves current view state", () => {
  const state = {
    ...createInitialState(),
    view: "workspace",
    selectedProjectId: "project-seed-2",
    selectedTaskId: "concept"
  };

  const nextState = addProject(state, "New Client Pitch");

  assert.equal(nextState.projects[0].name, "New Client Pitch");
  assert.equal(nextState.projects[1].id, state.projects[0].id);
  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, "project-seed-2");
  assert.equal(nextState.selectedTaskId, "concept");
});

test("selectProject opens the workspace and defaults to the first task group", () => {
  const state = createInitialState();
  const nextState = selectProject(state, "project-seed-1");

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, "project-seed-1");
  assert.equal(nextState.selectedTaskId, "research");
  assert.equal(nextState.taskDetailOpen, false);
});

test("openTaskDetail selects a task and opens the popup", () => {
  const state = selectProject(createInitialState(), "project-seed-1");
  const nextState = openTaskDetail(state, "drafts");

  assert.equal(nextState.selectedTaskId, "drafts");
  assert.equal(nextState.taskDetailOpen, true);
});

test("closeTaskDetail closes the popup without clearing the selected task", () => {
  const state = openTaskDetail(selectProject(createInitialState(), "project-seed-1"), "drafts");
  const nextState = closeTaskDetail(state);

  assert.equal(nextState.selectedTaskId, "drafts");
  assert.equal(nextState.taskDetailOpen, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL because `state.js` does not yet export `openTaskDetail` and `closeTaskDetail`, and seeded status strings do not match.

- [ ] **Step 3: Rewrite the seed data and pure state helpers**

Replace `mockup/scripts/data.js` with:

```js
export const seedProjects = [
  {
    id: "project-seed-1",
    type: "project",
    name: "Nike Night Run",
    updatedAt: "10 minutes ago",
    status: "Drafts ready"
  },
  {
    id: "project-seed-2",
    type: "project",
    name: "Samsung Home AI Launch",
    updatedAt: "2 hours ago",
    status: "Waiting for concept decision"
  },
  {
    id: "project-seed-3",
    type: "project",
    name: "Lotte Autumn Campaign",
    updatedAt: "Yesterday",
    status: "Storyboard in progress"
  }
];

export const seedTasks = [
  {
    id: "research",
    name: "Research",
    status: "Running",
    summary: "시장, 경쟁사, 레퍼런스 맥락을 수집하는 중입니다.",
    reason: "브랜드와 카테고리 정보가 아직 충분하지 않습니다.",
    agents: ["External Research Agent", "Internal Reference Search Agent", "Memory Agent"],
    outputs: ["Competitor snapshot", "Reference cluster"],
    nextAction: "리서치 완료 후 드래프트 생성을 요청하거나 바로 드래프트 생성으로 넘어갈 수 있습니다."
  },
  {
    id: "drafts",
    name: "Drafts",
    status: "Ready",
    summary: "비교 가능한 드래프트 3개가 준비되었습니다.",
    reason: "초기 방향 탐색용 결과물이 생성 완료되었습니다.",
    agents: ["Copy Draft Workers", "Copy Curator", "Memory Agent"],
    outputs: ["Draft A", "Draft B", "Draft C"],
    nextAction: "하나를 선택하거나 두 안을 조합하라고 지시할 수 있습니다."
  },
  {
    id: "concept",
    name: "Concept",
    status: "Waiting for user",
    summary: "컨셉 확정을 위해 사용자 결정을 기다리고 있습니다.",
    reason: "드래프트 선택 또는 조합 방향이 아직 확정되지 않았습니다.",
    agents: ["Concept Finalizer Agent"],
    outputs: [],
    nextAction: "현재 드래프트 중 기준안을 선택하거나 수정 방향을 채팅으로 지시하세요."
  },
  {
    id: "scenario",
    name: "Scenario",
    status: "Blocked",
    summary: "컨셉 승인 전에는 시나리오 생성을 시작할 수 없습니다.",
    reason: "상위 작업군인 Concept이 아직 사용자 결정을 기다리고 있습니다.",
    agents: ["Scenario Writer Agent", "Shot Planning Agent"],
    outputs: [],
    nextAction: "먼저 Concept 작업군에서 방향을 확정해야 합니다."
  },
  {
    id: "storyboard",
    name: "Storyboard",
    status: "Blocked",
    summary: "시나리오와 컷 구성이 확정되어야 콘티를 만들 수 있습니다.",
    reason: "Scenario 작업군이 아직 진행되지 않았습니다.",
    agents: ["Storyboard Composition Agent"],
    outputs: [],
    nextAction: "Scenario 단계가 준비되면 콘티 생성이 가능합니다."
  },
  {
    id: "qa",
    name: "QA",
    status: "Done",
    summary: "이전 라운드 검수는 완료되었습니다.",
    reason: "현재 라운드에서는 아직 새 검수 대상이 없습니다.",
    agents: ["Review / QA Agent", "Brand / Policy Checker"],
    outputs: ["Previous QA note"],
    nextAction: "새 시나리오 또는 콘티가 생성되면 검수를 다시 시작합니다."
  }
];

export const seedFeedItems = [
  {
    id: "feed-1",
    type: "user_message",
    text: "러닝 브랜드 광고 방향을 탐색해줘"
  },
  {
    id: "feed-2",
    type: "system_message",
    text: "먼저 리서치와 드래프트 생성을 진행할 수 있습니다."
  },
  {
    id: "feed-3",
    type: "status",
    text: "Research running"
  },
  {
    id: "feed-4",
    type: "result_card",
    title: "Drafts Ready",
    body: "드래프트 3안이 준비되었습니다. 하나를 선택하거나 조합하도록 지시할 수 있습니다."
  },
  {
    id: "feed-5",
    type: "system_message",
    text: "현재 컨셉 승인을 기다리고 있습니다. 승인하거나 수정 방향을 지시하세요."
  }
];

export const seedFocusPanel = {
  eyebrow: "Current focus",
  title: "Selected Draft",
  body: "Own the pace. Own the night.",
  meta: [
    { label: "Stage", value: "Draft selection" },
    { label: "State", value: "Waiting for user" }
  ]
};

export const seedApproveGate = {
  summary: "드래프트 3안 정리 완료",
  detail: "현재 기준안을 승인하거나 수정 요청을 남길 수 있습니다."
};

export const seedComposer = {
  value: "",
  placeholder: "A와 B를 합쳐서 더 대담하게 가줘",
  actionLabel: "Send"
};
```

Replace `mockup/scripts/state.js` with:

```js
import {
  seedApproveGate,
  seedComposer,
  seedFeedItems,
  seedFocusPanel,
  seedProjects,
  seedTasks
} from "./data.js";

function cloneProject(project) {
  return { ...project };
}

function cloneTask(task) {
  return {
    ...task,
    agents: [...(task.agents ?? [])],
    outputs: [...(task.outputs ?? [])]
  };
}

function cloneFeedItem(item) {
  return { ...item };
}

export function createProject(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Project name is required");
  }

  return {
    id: `project-${globalThis.crypto.randomUUID()}`,
    type: "project",
    name: trimmed,
    updatedAt: "just now",
    status: "Drafts ready"
  };
}

export function createInitialState() {
  return {
    view: "projects",
    projects: seedProjects.map(cloneProject),
    selectedProjectId: null,
    tasks: seedTasks.map(cloneTask),
    selectedTaskId: null,
    taskDetailOpen: false,
    feedItems: seedFeedItems.map(cloneFeedItem),
    focusPanel: { ...seedFocusPanel, meta: [...seedFocusPanel.meta] },
    approveGate: { ...seedApproveGate },
    composer: { ...seedComposer }
  };
}

export function addProject(state, name) {
  return {
    ...state,
    projects: [createProject(name), ...state.projects.map(cloneProject)]
  };
}

export function selectProject(state, projectId) {
  return {
    ...state,
    view: "workspace",
    selectedProjectId: projectId,
    selectedTaskId: state.tasks[0]?.id ?? null,
    taskDetailOpen: false
  };
}

export function openTaskDetail(state, taskId) {
  return {
    ...state,
    selectedTaskId: taskId,
    taskDetailOpen: true
  };
}

export function closeTaskDetail(state) {
  return {
    ...state,
    taskDetailOpen: false
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/data.js mockup/scripts/state.js tests/state.test.js
git commit -m "feat: add task rail state model"
```

## Task 2: Rebuild The Project Launcher Around Lightweight Status Cards

**Files:**
- Modify: `mockup/scripts/render-projects.js`
- Modify: `mockup/styles/theme.css`
- Modify: `mockup/index.html`

- [ ] **Step 1: Add a failing renderer smoke check**

Create `tests/renderer-smoke.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialState } from "../mockup/scripts/state.js";
import { renderProjectsView } from "../mockup/scripts/render-projects.js";

test("renderProjectsView shows a create-project entry point and project status summaries", () => {
  const html = renderProjectsView(createInitialState());

  assert.match(html, /Create Project/);
  assert.match(html, /Drafts ready|Waiting for concept decision|Storyboard in progress/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/renderer-smoke.test.js`
Expected: FAIL if the renderer still depends on the old hero/form structure or missing strings.

- [ ] **Step 3: Replace the launcher renderer and header shell**

Replace `mockup/scripts/render-projects.js` with:

```js
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderProjectCard(project) {
  return `
    <button
      type="button"
      class="folder-card"
      data-action="open-project"
      data-project-id="${escapeHtml(project.id)}"
      aria-label="Open project ${escapeHtml(project.name)}"
    >
      <span class="folder-card__tab" aria-hidden="true"></span>
      <span class="folder-card__title">${escapeHtml(project.name)}</span>
      <span class="folder-card__meta">${escapeHtml(project.updatedAt)}</span>
      <span class="folder-card__status">${escapeHtml(project.status)}</span>
    </button>
  `;
}

export function renderProjectsView(state) {
  const projects = Array.isArray(state?.projects) ? state.projects : [];

  return `
    <section class="launcher" aria-label="Project management launcher">
      <div class="launcher__topbar">
        <div class="launcher__heading">
          <p class="eyebrow">Project Management</p>
          <h1>Projects</h1>
        </div>
        <button type="button" class="project-form__submit" data-action="create-project-button">
          Create Project
        </button>
      </div>
      <div class="launcher__body">
        ${
          projects.length
            ? `<div class="project-grid">${projects.map(renderProjectCard).join("")}</div>`
            : `
              <div class="launcher-empty">
                <div class="launcher-empty__copy">
                  <h2>첫 프로젝트를 만들어 시작하세요.</h2>
                  <p>우상단 Create Project 버튼으로 이름만 입력해 바로 작업을 시작할 수 있습니다.</p>
                </div>
              </div>
            `
        }
      </div>
    </section>
  `;
}
```

Update the brand block in `mockup/index.html`:

```html
<div class="brand">
  <img src="../design-reference/diffs_logo.png" alt="Diffs logo" />
  <div class="brand-copy">
    <strong>Diffs</strong>
    <span>Project Management</span>
  </div>
</div>
```

Append or update `mockup/styles/theme.css` so launcher styles match the simpler entry UX:

```css
.launcher {
  padding: 40px;
}

.launcher__topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.launcher__heading h1 {
  margin: 0;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.launcher__body {
  padding-top: 32px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/renderer-smoke.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/index.html mockup/scripts/render-projects.js mockup/styles/theme.css tests/renderer-smoke.test.js
git commit -m "feat: simplify project launcher"
```

## Task 3: Rebuild The Workspace Around The Task Status Rail

**Files:**
- Modify: `mockup/scripts/render-workspace.js`
- Modify: `mockup/styles/theme.css`
- Test: `tests/renderer-smoke.test.js`

- [ ] **Step 1: Add failing workspace renderer expectations**

Append to `tests/renderer-smoke.test.js`:

```js
import { selectProject } from "../mockup/scripts/state.js";
import { renderWorkspaceView } from "../mockup/scripts/render-workspace.js";

test("renderWorkspaceView shows task rail statuses and feed object types", () => {
  const state = selectProject(createInitialState(), "project-seed-1");
  const html = renderWorkspaceView(state);

  assert.match(html, /Research/);
  assert.match(html, /Waiting for user|Blocked|Ready|Running|Done/);
  assert.match(html, /Drafts Ready/);
  assert.match(html, /Research running/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/renderer-smoke.test.js`
Expected: FAIL because the workspace still renders an agent rail rather than task groups.

- [ ] **Step 3: Replace the workspace renderer with task rail, feed objects, and popup**

Replace `mockup/scripts/render-workspace.js` with:

```js
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTaskRail(tasks, selectedTaskId) {
  return `
    <aside class="workspace__rail workspace__rail--tasks">
      <div class="panel-heading">
        <p class="panel-kicker">Task Status</p>
        <h2>Current Flow</h2>
      </div>
      <div class="task-list">
        ${tasks
          .map(
            (task) => `
              <button
                type="button"
                class="task-item${task.id === selectedTaskId ? " is-active" : ""}"
                data-action="open-task-detail"
                data-task-id="${escapeHtml(task.id)}"
              >
                <span class="task-item__name">${escapeHtml(task.name)}</span>
                <span class="task-item__status">${escapeHtml(task.status)}</span>
              </button>
            `
          )
          .join("")}
      </div>
    </aside>
  `;
}

function renderFeedItem(item) {
  if (item.type === "status") {
    return `<div class="chat-status-row is-system"><div class="chat-status">${escapeHtml(item.text)}</div></div>`;
  }

  if (item.type === "result_card") {
    return `
      <article class="result-card-feed">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
      </article>
    `;
  }

  if (item.type === "user_message") {
    return `<div class="chat-row is-user"><div class="chat-bubble">${escapeHtml(item.text)}</div></div>`;
  }

  return `<div class="chat-row is-system"><div class="chat-bubble">${escapeHtml(item.text)}</div></div>`;
}

function renderTaskDetailPopup(task, isOpen) {
  if (!isOpen || !task) {
    return "";
  }

  return `
    <div class="task-modal-backdrop" data-action="close-task-detail-backdrop">
      <section class="task-modal" aria-label="${escapeHtml(task.name)} detail modal">
        <div class="task-modal__header">
          <div>
            <p class="panel-kicker">Task Detail</p>
            <h2>${escapeHtml(task.name)}</h2>
          </div>
          <button type="button" class="context-chip" data-action="close-task-detail">Close</button>
        </div>
        <div class="task-detail-card">
          <dl class="task-detail-card__meta">
            <div><dt>Status</dt><dd>${escapeHtml(task.status)}</dd></div>
            <div><dt>Why</dt><dd>${escapeHtml(task.reason)}</dd></div>
            <div><dt>Next action</dt><dd>${escapeHtml(task.nextAction)}</dd></div>
          </dl>
          <div class="task-detail-card__section">
            <p class="panel-kicker">Agents Used</p>
            <ul>${task.agents.map((agent) => `<li>${escapeHtml(agent)}</li>`).join("")}</ul>
          </div>
          <div class="task-detail-card__section">
            <p class="panel-kicker">Recent Outputs</p>
            <ul>${task.outputs.length ? task.outputs.map((output) => `<li>${escapeHtml(output)}</li>`).join("") : "<li>None yet</li>"}</ul>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderWorkspaceView(state) {
  const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
  const selectedTask = state.tasks.find((task) => task.id === state.selectedTaskId);

  return `
    <section class="workspace" data-view="workspace">
      ${renderTaskRail(state.tasks, state.selectedTaskId)}
      <section class="workspace__chat">
        <header class="workspace__header">
          <div class="workspace__header-copy">
            <p class="panel-kicker">Workspace</p>
            <h1>${escapeHtml(selectedProject?.name ?? "Project workspace")}</h1>
            <p>${escapeHtml(selectedProject?.status ?? "")}</p>
          </div>
          <div class="workspace__header-meta">
            <button type="button" class="context-chip" data-action="go-projects">All Projects</button>
          </div>
        </header>
        <div class="chat-feed" aria-label="Chat feed">
          ${state.feedItems.map(renderFeedItem).join("")}
        </div>
        <section class="approve-bar" aria-label="Approval gate">
          <div class="approve-bar__copy">
            <p class="panel-kicker">Approve bar</p>
            <strong>${escapeHtml(state.approveGate.summary)}</strong>
            <span>${escapeHtml(state.approveGate.detail)}</span>
          </div>
          <div class="approve-bar__actions">
            <button type="button" class="button button--secondary">수정 요청</button>
            <button type="button" class="button button--primary">승인 →</button>
          </div>
        </section>
        <form class="composer">
          <label class="sr-only" for="workspace-composer-input">Workspace message</label>
          <input
            id="workspace-composer-input"
            type="text"
            value="${escapeHtml(state.composer.value)}"
            placeholder="${escapeHtml(state.composer.placeholder)}"
          />
          <button type="button" class="button button--primary">${escapeHtml(state.composer.actionLabel)}</button>
        </form>
      </section>
      <aside class="workspace__rail workspace__rail--context">
        <div class="panel-heading">
          <p class="panel-kicker">${escapeHtml(state.focusPanel.eyebrow)}</p>
          <h2>${escapeHtml(state.focusPanel.title)}</h2>
        </div>
        <div class="context-card">
          <p class="context-card__body">${escapeHtml(state.focusPanel.body)}</p>
          <dl class="context-card__meta">
            ${state.focusPanel.meta
              .map(
                (item) => `
                  <div>
                    <dt>${escapeHtml(item.label)}</dt>
                    <dd>${escapeHtml(item.value)}</dd>
                  </div>
                `
              )
              .join("")}
          </dl>
        </div>
      </aside>
      ${renderTaskDetailPopup(selectedTask, state.taskDetailOpen)}
    </section>
  `;
}
```

Append to `mockup/styles/theme.css`:

```css
.task-list {
  display: grid;
  gap: 10px;
  margin: 20px 0;
}

.task-item {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
}

.task-item.is-active {
  border-color: var(--accent-teal-border);
  background: linear-gradient(180deg, var(--accent-teal-soft), rgba(20, 20, 20, 0.96));
}

.task-item__name {
  font-weight: 600;
}

.task-item__status {
  color: var(--app-text-muted);
}

.result-card-feed {
  padding: 18px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), var(--app-surface);
}

.result-card-feed h3 {
  margin: 0 0 10px;
}

.result-card-feed p {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.6;
}

.task-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.56);
}

.task-modal {
  width: min(760px, 100%);
  max-height: min(80vh, 920px);
  overflow: auto;
  padding: 30px;
  border: 1px solid var(--app-border);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), var(--app-surface);
}

.task-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.task-detail-card {
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface-2);
}

.task-detail-card__meta,
.task-detail-card__section ul {
  display: grid;
  gap: 12px;
}

.task-detail-card__meta dt {
  margin-bottom: 4px;
  color: var(--app-text-dim);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.task-detail-card__meta dd,
.task-detail-card__section li {
  margin: 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/renderer-smoke.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/render-workspace.js mockup/styles/theme.css tests/renderer-smoke.test.js
git commit -m "feat: rebuild workspace around task rail"
```

## Task 4: Rewire Browser Events For Task Detail Popups And Launcher Flow

**Files:**
- Modify: `mockup/scripts/main.js`
- Test: `tests/renderer-smoke.test.js`

- [ ] **Step 1: Add a failing state-driven UI action test**

Append to `tests/renderer-smoke.test.js`:

```js
import { closeTaskDetail, openTaskDetail } from "../mockup/scripts/state.js";

test("task detail state opens and closes without losing selected project", () => {
  const workspace = selectProject(createInitialState(), "project-seed-1");
  const opened = openTaskDetail(workspace, "concept");
  const closed = closeTaskDetail(opened);

  assert.equal(opened.selectedProjectId, "project-seed-1");
  assert.equal(opened.taskDetailOpen, true);
  assert.equal(closed.selectedProjectId, "project-seed-1");
  assert.equal(closed.taskDetailOpen, false);
});
```

- [ ] **Step 2: Run test to verify it fails if popup helpers are missing**

Run: `node --test tests/renderer-smoke.test.js`
Expected: FAIL if popup state transitions are not exported or inconsistent

- [ ] **Step 3: Replace the app event wiring**

Replace `mockup/scripts/main.js` with:

```js
import {
  addProject,
  closeTaskDetail,
  createInitialState,
  openTaskDetail,
  selectProject
} from "./state.js";
import { renderProjectsView } from "./render-projects.js";
import { renderWorkspaceView } from "./render-workspace.js";

const app = document.getElementById("app");
let state = createInitialState();

function render() {
  app.innerHTML =
    state.view === "projects" ? renderProjectsView(state) : renderWorkspaceView(state);
}

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

  const closeButton = event.target.closest('[data-action="close-task-detail"]');
  if (closeButton) {
    state = closeTaskDetail(state);
    render();
    return;
  }

  const backdrop = event.target.closest('[data-action="close-task-detail-backdrop"]');
  if (backdrop && event.target === backdrop) {
    state = closeTaskDetail(state);
    render();
    return;
  }

  const backButton = event.target.closest('[data-action="go-projects"]');
  if (backButton) {
    state = {
      ...state,
      view: "projects",
      selectedProjectId: null,
      selectedTaskId: null,
      taskDetailOpen: false
    };
    render();
  }
});

render();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/main.js tests/renderer-smoke.test.js
git commit -m "feat: wire task detail popup interactions"
```

## Task 5: Update Manual Verification For The Corrected UX Flow

**Files:**
- Modify: `docs/mockup-manual-checklist.md`
- Verify: `mockup/index.html`

- [ ] **Step 1: Write the revised manual checklist**

Replace `docs/mockup-manual-checklist.md` with:

```md
# Mockup Manual Checklist

- Open `mockup/index.html` in a browser.
- Confirm the header shows the Diffs logo from `design-reference/diffs_logo.png`.
- Confirm the launcher has a simple `Create Project` entry point and no oversized explanatory hero copy.
- Confirm each project card shows only name, last activity, and one-line current status.
- Click a project card and confirm the workspace opens with chat in the center.
- Confirm the left rail shows task groups (`Research`, `Drafts`, `Concept`, `Scenario`, `Storyboard`, `QA`) rather than individual agents.
- Confirm each task group shows a simple status such as `Running`, `Ready`, `Waiting for user`, `Blocked`, or `Done`.
- Click a task group and confirm a popup opens with status reason, used agents, recent outputs, and next action.
- Confirm the chat feed reads as a decision log: user message, system proposal, status row, result card, and next action.
- Confirm blocked or waiting states are visible in both the left rail and the chat feed.
- Confirm the right panel only shows the current focus result, not a full dashboard.
- Confirm the approve bar appears as a decision aid and does not overpower the chat feed.
```

- [ ] **Step 2: Serve the mockup locally**

Run: `python3 -m http.server 4173`
Expected: `Serving HTTP on :: port 4173` or `Serving HTTP on 0.0.0.0 port 4173`

- [ ] **Step 3: Walk through the manual checklist**

Open: `http://localhost:4173/mockup/index.html`

Validate every checklist item.

- [ ] **Step 4: Rerun automated tests after any polish fixes**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/mockup-manual-checklist.md
git commit -m "docs: update mockup verification checklist"
```

## Self-Review

### Spec Coverage

- Project launcher with lightweight status cards: covered in Task 2
- Chat-centered workspace: covered in Task 3
- Left task-status rail: covered in Tasks 1 and 3
- Task detail popup with used-agent drilldown: covered in Tasks 1 and 3
- Feed object order and semantics: covered in Task 3
- Popup open/close interactions: covered in Task 4
- Manual verification of corrected UX: covered in Task 5

### Placeholder Scan

- No `TBD`, `TODO`, or deferred placeholders remain.
- Each implementation step includes concrete code or exact commands.
- Each test step names the exact command and expected result.

### Type Consistency

- State keys remain `view`, `projects`, `selectedProjectId`, `tasks`, `selectedTaskId`, `taskDetailOpen`, `feedItems`, `focusPanel`, `approveGate`, and `composer`.
- Renderers consume the same task and project shapes defined in `data.js` and `state.js`.

