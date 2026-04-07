# Project Management And Workspace Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity static mockup that starts at a project management tab, creates folder-style projects from a name-only form, and enters a chat-first project workspace with agent status/detail panels.

**Architecture:** Use a small static frontend with one HTML entry point, one shared stylesheet, and focused vanilla JS modules for seeded data, state transitions, and rendering. Keep behavior deterministic and test state logic with `node --test`, while visual verification happens in the browser against the existing `design-reference` theme.

**Tech Stack:** HTML, CSS, vanilla JavaScript (ES modules), Node built-in test runner

---

## File Structure

### Create

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

- `mockup/index.html`: Shell markup for app header, root mount node, and template fragments if needed.
- `mockup/styles/theme.css`: Shared design language derived from `design-reference/index.html`, including project launcher, folder cards, chat bubbles, agent rail, detail panel, and approve bar.
- `mockup/scripts/data.js`: Seed project data and seed workspace content used by the mockup.
- `mockup/scripts/state.js`: Pure state helpers for creating projects, selecting a project, selecting an agent, and toggling workspace panels.
- `mockup/scripts/render-projects.js`: Render the project management tab and folder-card launcher view.
- `mockup/scripts/render-workspace.js`: Render the workspace shell, chat feed, agent panel, and right context panel.
- `mockup/scripts/main.js`: Wire events to state transitions and switch between management and workspace views.
- `tests/state.test.js`: Node tests for name-only project creation and workspace selection rules.
- `docs/mockup-manual-checklist.md`: Browser verification checklist for layout, theme, and interaction behavior.

### Existing References

- `design-reference/index.html`
- `docs/superpowers/specs/2026-04-05-project-management-and-workspace-design.md`

## Task 1: Scaffold The Mockup Entry

**Files:**
- Create: `mockup/index.html`
- Create: `mockup/styles/theme.css`
- Create: `mockup/scripts/main.js`

- [ ] **Step 1: Write the failing structural smoke test**

Create `tests/state.test.js` with this initial smoke test so the repo starts with a failing test:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../mockup/scripts/state.js";

test("createProject trims name and creates a launcher card model", () => {
  const project = createProject("  Nike Night Run  ");

  assert.equal(project.name, "Nike Night Run");
  assert.equal(project.status, "Draft selection pending");
  assert.equal(project.type, "project");
  assert.match(project.id, /^project-/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../mockup/scripts/state.js`

- [ ] **Step 3: Create the minimal HTML shell**

Create `mockup/index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Diffs Orchestrator Mockup</title>
    <link rel="stylesheet" href="./styles/theme.css" />
  </head>
  <body>
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-copy">
          <strong>Diffs Orchestrator</strong>
          <span>Project Management</span>
        </div>
      </header>
      <main id="app"></main>
    </div>
    <script type="module" src="./scripts/main.js"></script>
  </body>
</html>
```

Create `mockup/styles/theme.css`:

```css
:root {
  --app-bg: #0a0a0a;
  --app-surface: #141414;
  --app-surface-2: #1a1a1a;
  --app-border: #2a2a2a;
  --app-border-light: #333333;
  --app-text: #ffffff;
  --app-text-muted: #999999;
  --app-text-dim: #555555;
  --accent-blue: #2563eb;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.04), transparent 24%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.03), transparent 22%),
    var(--app-bg);
  color: var(--app-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}

body { padding: 24px; }

.app-shell {
  min-height: calc(100vh - 48px);
  border: 1px solid var(--app-border);
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0)), var(--app-bg);
  box-shadow: 0 24px 80px rgba(0,0,0,0.45);
}

.topbar {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--app-border);
  background: rgba(20, 20, 20, 0.92);
}

.brand-copy strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
}

.brand-copy span {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--app-text-dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

#app { min-height: calc(100vh - 85px); }
```

Create `mockup/scripts/main.js`:

```js
document.getElementById("app").innerHTML = `
  <section style="padding: 32px;">
    <h1 style="margin: 0 0 12px;">Loading mockup...</h1>
    <p style="margin: 0; color: #999999;">State and render modules will replace this shell.</p>
  </section>
`;
```

- [ ] **Step 4: Run test to verify it still fails for the intended missing module**

Run: `node --test tests/state.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../mockup/scripts/state.js`

- [ ] **Step 5: Commit**

```bash
git add mockup/index.html mockup/styles/theme.css mockup/scripts/main.js tests/state.test.js
git commit -m "chore: scaffold mockup entry shell"
```

## Task 2: Add Pure State Model For Project Creation And Selection

**Files:**
- Create: `mockup/scripts/state.js`
- Create: `mockup/scripts/data.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Extend the failing tests for state transitions**

Update `tests/state.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  createInitialState,
  selectProject,
  selectAgent
} from "../mockup/scripts/state.js";

test("createProject trims name and creates a launcher card model", () => {
  const project = createProject("  Nike Night Run  ");

  assert.equal(project.name, "Nike Night Run");
  assert.equal(project.status, "Draft selection pending");
  assert.equal(project.type, "project");
  assert.match(project.id, /^project-/);
});

test("selectProject switches the view to workspace and preserves project id", () => {
  const state = createInitialState();
  const nextState = selectProject(state, state.projects[0].id);

  assert.equal(nextState.view, "workspace");
  assert.equal(nextState.selectedProjectId, state.projects[0].id);
  assert.equal(nextState.selectedAgentId, "research-agent");
});

test("selectAgent updates the selected agent without mutating project selection", () => {
  const state = selectProject(createInitialState(), "project-seed-1");
  const nextState = selectAgent(state, "copy-draft-workers");

  assert.equal(nextState.selectedProjectId, "project-seed-1");
  assert.equal(nextState.selectedAgentId, "copy-draft-workers");
});

test("createProject rejects empty names", () => {
  assert.throws(() => createProject("   "), /Project name is required/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL because `state.js` does not export the required functions

- [ ] **Step 3: Write the minimal seed data and state implementation**

Create `mockup/scripts/data.js`:

```js
export const seedProjects = [
  {
    id: "project-seed-1",
    type: "project",
    name: "Nike Night Run",
    updatedAt: "10 minutes ago",
    status: "Draft selection pending"
  },
  {
    id: "project-seed-2",
    type: "project",
    name: "Samsung Home AI Launch",
    updatedAt: "2 hours ago",
    status: "Scenario review"
  }
];

export const seedAgents = [
  {
    id: "research-agent",
    name: "Research Agent",
    status: "경쟁사 캠페인 분석 중",
    detail: "최근 스포츠 브랜드 캠페인과 야간 러닝 카테고리 사례를 정리하고 있습니다."
  },
  {
    id: "copy-draft-workers",
    name: "Copy Draft Workers",
    status: "3개 방향 초안 생성 중",
    detail: "감성형, 직설형, 리듬형 드래프트를 병렬 생성하고 있습니다."
  },
  {
    id: "memory-agent",
    name: "Memory Agent",
    status: "브랜드 톤 기록 조회 완료",
    detail: "이전 스포츠 캠페인에서 선택된 어조와 금지 표현을 가져왔습니다."
  }
];
```

Create `mockup/scripts/state.js`:

```js
import { seedAgents, seedProjects } from "./data.js";

export function createProject(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Project name is required");
  }

  return {
    id: `project-${Date.now()}`,
    type: "project",
    name: trimmed,
    updatedAt: "just now",
    status: "Draft selection pending"
  };
}

export function createInitialState() {
  return {
    view: "projects",
    projects: [...seedProjects],
    selectedProjectId: null,
    agents: [...seedAgents],
    selectedAgentId: null
  };
}

export function selectProject(state, projectId) {
  return {
    ...state,
    view: "workspace",
    selectedProjectId: projectId,
    selectedAgentId: state.agents[0]?.id ?? null
  };
}

export function selectAgent(state, agentId) {
  return {
    ...state,
    selectedAgentId: agentId
  };
}

export function addProject(state, name) {
  const project = createProject(name);
  return {
    ...state,
    projects: [project, ...state.projects]
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/data.js mockup/scripts/state.js tests/state.test.js
git commit -m "feat: add mockup state model"
```

## Task 3: Render The Project Management Tab

**Files:**
- Create: `mockup/scripts/render-projects.js`
- Modify: `mockup/styles/theme.css`
- Modify: `mockup/scripts/main.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Add a view-level test for project insertion order**

Update `tests/state.test.js`:

```js
import { addProject } from "../mockup/scripts/state.js";

test("addProject inserts new projects at the front of the launcher list", () => {
  const state = createInitialState();
  const nextState = addProject(state, "New Client Pitch");

  assert.equal(nextState.projects[0].name, "New Client Pitch");
  assert.equal(nextState.projects[1].id, state.projects[0].id);
});
```

- [ ] **Step 2: Run test to verify it fails if addProject is missing or wrong**

Run: `node --test tests/state.test.js`
Expected: FAIL if `addProject` is not exported or does not insert at index 0

- [ ] **Step 3: Build the project management renderer and launcher styles**

Create `mockup/scripts/render-projects.js`:

```js
export function renderProjectsView(state) {
  const cards = state.projects.map((project) => `
    <button class="folder-card" data-action="open-project" data-project-id="${project.id}">
      <span class="folder-card__tab"></span>
      <span class="folder-card__title">${project.name}</span>
      <span class="folder-card__meta">${project.updatedAt}</span>
      <span class="folder-card__status">${project.status}</span>
    </button>
  `).join("");

  return `
    <section class="launcher">
      <div class="launcher__hero">
        <p class="eyebrow">Project Management</p>
        <h1>프로젝트를 만들고 바로 작업에 들어갑니다.</h1>
        <form class="project-form" data-action="create-project">
          <input
            class="project-form__input"
            type="text"
            name="projectName"
            placeholder="프로젝트 이름을 입력하세요"
            autocomplete="off"
          />
          <button class="project-form__submit" type="submit">Create</button>
        </form>
      </div>
      <div class="project-grid">
        ${cards}
      </div>
    </section>
  `;
}
```

Append to `mockup/styles/theme.css`:

```css
.launcher {
  padding: 32px;
}

.launcher__hero {
  padding: 28px;
  border-bottom: 1px solid var(--app-border);
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--app-text-dim);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.launcher__hero h1 {
  margin: 0 0 20px;
  font-size: 34px;
  line-height: 1.15;
}

.project-form {
  display: flex;
  gap: 12px;
  max-width: 720px;
}

.project-form__input,
.project-form__submit {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 14px 16px;
  font: inherit;
}

.project-form__input {
  flex: 1;
  background: var(--app-surface);
  color: var(--app-text);
}

.project-form__submit {
  background: var(--app-text);
  color: #0a0a0a;
  font-weight: 700;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  padding: 28px 0 0;
}

.folder-card {
  position: relative;
  display: grid;
  gap: 8px;
  min-height: 180px;
  border: 1px solid var(--app-border);
  border-radius: 24px;
  padding: 24px 20px 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), var(--app-surface);
  color: var(--app-text);
  text-align: left;
}

.folder-card__tab {
  width: 72px;
  height: 18px;
  border-radius: 12px 12px 0 0;
  background: var(--app-surface-2);
  border: 1px solid var(--app-border-light);
  border-bottom: 0;
}

.folder-card__title {
  font-size: 20px;
  font-weight: 650;
}

.folder-card__meta,
.folder-card__status {
  color: var(--app-text-muted);
  font-size: 13px;
}
```

Replace `mockup/scripts/main.js`:

```js
import { createInitialState } from "./state.js";
import { renderProjectsView } from "./render-projects.js";

const app = document.getElementById("app");
const state = createInitialState();

app.innerHTML = renderProjectsView(state);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/render-projects.js mockup/scripts/main.js mockup/styles/theme.css tests/state.test.js
git commit -m "feat: render project management launcher"
```

## Task 4: Wire Name-Only Project Creation In The Browser

**Files:**
- Modify: `mockup/scripts/main.js`
- Modify: `mockup/scripts/render-projects.js`
- Modify: `mockup/styles/theme.css`
- Test: `tests/state.test.js`

- [ ] **Step 1: Add a test for preserving existing selection fields when creating projects**

Update `tests/state.test.js`:

```js
test("addProject keeps the view on project management and does not force a selection", () => {
  const state = createInitialState();
  const nextState = addProject(state, "Launch Film");

  assert.equal(nextState.view, "projects");
  assert.equal(nextState.selectedProjectId, null);
  assert.equal(nextState.selectedAgentId, null);
});
```

- [ ] **Step 2: Run test to verify it fails if addProject changes unrelated fields**

Run: `node --test tests/state.test.js`
Expected: FAIL if `addProject` changes `view`, `selectedProjectId`, or `selectedAgentId`

- [ ] **Step 3: Add form handling and empty-state fallback copy**

Update `mockup/scripts/render-projects.js`:

```js
export function renderProjectsView(state) {
  const cards = state.projects.length
    ? state.projects.map((project) => `
        <button class="folder-card" data-action="open-project" data-project-id="${project.id}">
          <span class="folder-card__tab"></span>
          <span class="folder-card__title">${project.name}</span>
          <span class="folder-card__meta">${project.updatedAt}</span>
          <span class="folder-card__status">${project.status}</span>
        </button>
      `).join("")
    : `
        <div class="empty-state">
          <h2>첫 프로젝트를 만들어 시작하세요.</h2>
          <p>프로젝트 이름만 입력하면 바로 폴더가 생성되고 작업 화면으로 진입할 준비가 됩니다.</p>
        </div>
      `;

  return `
    <section class="launcher">
      <div class="launcher__hero">
        <p class="eyebrow">Project Management</p>
        <h1>프로젝트를 만들고 바로 작업에 들어갑니다.</h1>
        <form class="project-form" data-action="create-project">
          <input class="project-form__input" type="text" name="projectName" placeholder="프로젝트 이름을 입력하세요" autocomplete="off" />
          <button class="project-form__submit" type="submit">Create</button>
        </form>
      </div>
      <div class="project-grid">${cards}</div>
    </section>
  `;
}
```

Update `mockup/scripts/main.js`:

```js
import { addProject, createInitialState, selectProject } from "./state.js";
import { renderProjectsView } from "./render-projects.js";

const app = document.getElementById("app");
let state = createInitialState();

function render() {
  app.innerHTML = renderProjectsView(state);
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest('[data-action="create-project"]');
  if (!form) return;

  event.preventDefault();
  const formData = new FormData(form);
  const projectName = String(formData.get("projectName") ?? "");

  state = addProject(state, projectName);
  render();
});

app.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="open-project"]');
  if (!button) return;

  state = selectProject(state, button.dataset.projectId);
  render();
});

render();
```

Append to `mockup/styles/theme.css`:

```css
.empty-state {
  padding: 40px;
  border: 1px dashed var(--app-border-light);
  border-radius: 24px;
  background: rgba(255,255,255,0.02);
}

.empty-state h2 {
  margin: 0 0 10px;
}

.empty-state p {
  margin: 0;
  color: var(--app-text-muted);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/main.js mockup/scripts/render-projects.js mockup/styles/theme.css tests/state.test.js
git commit -m "feat: support name-only project creation"
```

## Task 5: Render The Project Workspace Shell

**Files:**
- Create: `mockup/scripts/render-workspace.js`
- Modify: `mockup/styles/theme.css`
- Modify: `mockup/scripts/main.js`
- Modify: `mockup/scripts/data.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Add a test for the default selected agent in workspace**

Update `tests/state.test.js`:

```js
test("selectProject defaults to the first agent detail panel", () => {
  const state = createInitialState();
  const nextState = selectProject(state, "project-seed-2");

  assert.equal(nextState.selectedAgentId, "research-agent");
});
```

- [ ] **Step 2: Run test to verify it fails if workspace selection breaks**

Run: `node --test tests/state.test.js`
Expected: FAIL if `selectProject` no longer defaults to the first agent

- [ ] **Step 3: Build the workspace renderer with left agents, center chat, right context**

Append to `mockup/scripts/data.js`:

```js
export const seedMessages = [
  {
    id: "message-1",
    role: "system",
    type: "reply",
    text: "러닝 캠페인 방향을 더 젊고 대담하게 잡기 위해 레퍼런스와 기존 메모리를 먼저 확인하겠습니다."
  },
  {
    id: "message-2",
    role: "user",
    type: "reply",
    text: "도시 야간 러닝의 에너지가 느껴졌으면 좋겠어요."
  },
  {
    id: "message-3",
    role: "system",
    type: "status",
    text: "Copy Draft Workers — 감성형, 직설형, 리듬형 드래프트 생성 중..."
  }
];
```

Create `mockup/scripts/render-workspace.js`:

```js
import { seedMessages } from "./data.js";

export function renderWorkspaceView(state) {
  const selectedProject = state.projects.find((project) => project.id === state.selectedProjectId);
  const selectedAgent = state.agents.find((agent) => agent.id === state.selectedAgentId);

  const agentItems = state.agents.map((agent) => `
    <button class="agent-item${agent.id === state.selectedAgentId ? " is-active" : ""}" data-action="select-agent" data-agent-id="${agent.id}">
      <span class="agent-item__name">${agent.name}</span>
      <span class="agent-item__status">${agent.status}</span>
    </button>
  `).join("");

  const messages = seedMessages.map((message) => {
    if (message.type === "status") {
      return `<div class="chat-status">${message.text}</div>`;
    }

    return `
      <div class="chat-row ${message.role === "user" ? "is-user" : "is-system"}">
        <div class="chat-bubble">${message.text}</div>
      </div>
    `;
  }).join("");

  return `
    <section class="workspace">
      <aside class="workspace__agents">
        <div class="panel-heading">
          <p class="eyebrow">Agents</p>
          <h2>${selectedProject?.name ?? "Project"}</h2>
        </div>
        <div class="agent-list">${agentItems}</div>
        <div class="agent-detail">
          <h3>${selectedAgent?.name ?? ""}</h3>
          <p>${selectedAgent?.detail ?? ""}</p>
        </div>
      </aside>
      <section class="workspace__chat">
        <div class="chat-feed">${messages}</div>
        <div class="approve-bar">
          <span>드래프트 3안 정리 완료</span>
          <div class="approve-bar__actions">
            <button type="button">수정 요청</button>
            <button type="button" class="is-primary">승인 →</button>
          </div>
        </div>
        <form class="composer">
          <input type="text" placeholder="A와 B를 합쳐서 더 대담하게 가줘" />
          <button type="button">Send</button>
        </form>
      </section>
      <aside class="workspace__context">
        <div class="panel-heading">
          <p class="eyebrow">Current Context</p>
          <h2>Selected Draft</h2>
        </div>
        <div class="context-card">
          <strong>Own the pace. Own the night.</strong>
          <p>현재 승인 대기 중인 기준안입니다.</p>
        </div>
      </aside>
    </section>
  `;
}
```

Append to `mockup/styles/theme.css`:

```css
.workspace {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 320px;
  min-height: calc(100vh - 85px);
}

.workspace__agents,
.workspace__chat,
.workspace__context {
  padding: 24px;
}

.workspace__agents,
.workspace__context {
  border-right: 1px solid var(--app-border);
}

.workspace__context {
  border-right: 0;
  border-left: 1px solid var(--app-border);
}

.panel-heading h2 {
  margin: 0;
  font-size: 18px;
}

.agent-list {
  display: grid;
  gap: 10px;
  margin: 20px 0;
}

.agent-item {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
}

.agent-item.is-active {
  border-color: rgba(37, 99, 235, 0.45);
  background: #12151a;
}

.agent-item__name {
  font-weight: 600;
}

.agent-item__status,
.agent-detail p,
.context-card p {
  color: var(--app-text-muted);
}

.agent-detail,
.context-card {
  border: 1px solid var(--app-border);
  border-radius: 18px;
  padding: 16px;
  background: var(--app-surface);
}

.chat-feed {
  display: grid;
  gap: 14px;
  padding: 12px 0 24px;
}

.chat-row {
  display: flex;
}

.chat-row.is-user {
  justify-content: flex-end;
}

.chat-row.is-system {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 72%;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
}

.chat-row.is-user .chat-bubble {
  background: rgba(37, 99, 235, 0.16);
  border-color: rgba(37, 99, 235, 0.34);
}

.chat-status {
  padding: 12px 14px;
  border-radius: 14px;
  background: #111315;
  color: var(--app-text-muted);
  border: 1px dashed var(--app-border-light);
}

.approve-bar,
.composer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
}

.approve-bar {
  position: sticky;
  bottom: 88px;
  margin-top: 16px;
}

.approve-bar__actions,
.composer {
  gap: 10px;
}

.composer {
  position: sticky;
  bottom: 0;
  margin-top: 12px;
  background: #0f1012;
}

.composer input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--app-text);
  font: inherit;
}

.approve-bar button,
.composer button {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 10px 14px;
  background: var(--app-surface);
  color: var(--app-text);
}

.approve-bar .is-primary {
  background: var(--app-text);
  color: #0a0a0a;
}
```

Replace `mockup/scripts/main.js`:

```js
import { addProject, createInitialState, selectAgent, selectProject } from "./state.js";
import { renderProjectsView } from "./render-projects.js";
import { renderWorkspaceView } from "./render-workspace.js";

const app = document.getElementById("app");
let state = createInitialState();

function render() {
  app.innerHTML = state.view === "projects"
    ? renderProjectsView(state)
    : renderWorkspaceView(state);
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest('[data-action="create-project"]');
  if (!form) return;

  event.preventDefault();
  const projectName = String(new FormData(form).get("projectName") ?? "");
  state = addProject(state, projectName);
  render();
});

app.addEventListener("click", (event) => {
  const projectButton = event.target.closest('[data-action="open-project"]');
  if (projectButton) {
    state = selectProject(state, projectButton.dataset.projectId);
    render();
    return;
  }

  const agentButton = event.target.closest('[data-action="select-agent"]');
  if (agentButton) {
    state = selectAgent(state, agentButton.dataset.agentId);
    render();
  }
});

render();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/data.js mockup/scripts/render-workspace.js mockup/scripts/main.js mockup/styles/theme.css tests/state.test.js
git commit -m "feat: render project workspace shell"
```

## Task 6: Refine Workspace Detail Behavior And Theme Fidelity

**Files:**
- Modify: `mockup/scripts/data.js`
- Modify: `mockup/scripts/render-workspace.js`
- Modify: `mockup/styles/theme.css`
- Create: `docs/mockup-manual-checklist.md`
- Test: `tests/state.test.js`

- [ ] **Step 1: Add a test for agent detail persistence across agent changes**

Update `tests/state.test.js`:

```js
test("selectAgent only changes the selected agent field", () => {
  const initial = selectProject(createInitialState(), "project-seed-1");
  const next = selectAgent(initial, "memory-agent");

  assert.equal(next.view, "workspace");
  assert.equal(next.selectedProjectId, "project-seed-1");
  assert.equal(next.selectedAgentId, "memory-agent");
});
```

- [ ] **Step 2: Run test to verify it fails if state shape regresses**

Run: `node --test tests/state.test.js`
Expected: FAIL if `selectAgent` mutates unrelated fields

- [ ] **Step 3: Deepen the agent detail panel and align visuals more closely to the reference**

Replace the `seedAgents` export in `mockup/scripts/data.js`:

```js
export const seedAgents = [
  {
    id: "research-agent",
    name: "Research Agent",
    status: "경쟁사 캠페인 분석 중",
    detail: {
      summary: "최근 스포츠 브랜드 캠페인과 야간 러닝 카테고리 사례를 정리하고 있습니다.",
      input: "브랜드 메모리, 야간 러닝 맥락, 경쟁사 레퍼런스",
      output: "카테고리 인사이트 요약"
    }
  },
  {
    id: "copy-draft-workers",
    name: "Copy Draft Workers",
    status: "3개 방향 초안 생성 중",
    detail: {
      summary: "감성형, 직설형, 리듬형 드래프트를 병렬 생성하고 있습니다.",
      input: "리서치 결과, 브랜드 톤, 초기 사용자 요청",
      output: "드래프트 카드 3개"
    }
  },
  {
    id: "memory-agent",
    name: "Memory Agent",
    status: "브랜드 톤 기록 조회 완료",
    detail: {
      summary: "이전 스포츠 캠페인에서 선택된 어조와 금지 표현을 가져왔습니다.",
      input: "브랜드 메모리 저장소",
      output: "톤 가이드 요약"
    }
  }
];
```

Update the agent detail block in `mockup/scripts/render-workspace.js`:

```js
        <div class="agent-detail">
          <h3>${selectedAgent?.name ?? ""}</h3>
          <p>${selectedAgent?.detail?.summary ?? ""}</p>
          <dl class="agent-detail__meta">
            <div>
              <dt>Input</dt>
              <dd>${selectedAgent?.detail?.input ?? ""}</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>${selectedAgent?.detail?.output ?? ""}</dd>
            </div>
          </dl>
        </div>
```

Append to `mockup/styles/theme.css`:

```css
.agent-detail__meta {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
}

.agent-detail__meta dt {
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--app-text-dim);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.agent-detail__meta dd {
  margin: 0;
  color: var(--app-text);
}

.folder-card,
.agent-item,
.agent-detail,
.context-card,
.chat-bubble,
.approve-bar,
.composer {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}
```

Create `docs/mockup-manual-checklist.md`:

```md
# Mockup Manual Checklist

- Open `mockup/index.html` in a browser.
- Confirm the launcher uses the dark studio theme from `design-reference/index.html`.
- Create a project with only a name and confirm a new folder card appears first.
- Click a project card and confirm the workspace opens immediately.
- Confirm user chat bubbles align right and system bubbles align left.
- Confirm the left agent rail shows one-line status per agent.
- Click each agent and confirm the detail panel updates.
- Confirm the approve bar remains visually separate from the composer.
- Confirm the right panel shows current selected context rather than a full dashboard.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mockup/scripts/data.js mockup/scripts/render-workspace.js mockup/styles/theme.css docs/mockup-manual-checklist.md tests/state.test.js
git commit -m "feat: refine workspace detail panels"
```

## Task 7: Verify The Mockup End-To-End

**Files:**
- Verify: `mockup/index.html`
- Verify: `docs/mockup-manual-checklist.md`
- Verify: `tests/state.test.js`

- [ ] **Step 1: Run the automated state tests**

Run: `node --test tests/state.test.js`
Expected: PASS for all state tests

- [ ] **Step 2: Serve the mockup locally**

Run: `python3 -m http.server 4173`
Expected: `Serving HTTP on :: port 4173` or `Serving HTTP on 0.0.0.0 port 4173`

- [ ] **Step 3: Run the browser checklist**

Open: `http://localhost:4173/mockup/index.html`

Validate every item in `docs/mockup-manual-checklist.md`:

- launcher theme matches the reference direction
- new project creation works with name only
- project click enters the workspace
- user/system bubble alignment is correct
- agent click updates detail content
- approve bar and composer stay visually distinct

- [ ] **Step 4: Record any final polish fixes and rerun tests**

Run: `node --test tests/state.test.js`
Expected: PASS after final polish

- [ ] **Step 5: Commit**

```bash
git add mockup/index.html mockup/styles/theme.css mockup/scripts docs/mockup-manual-checklist.md tests/state.test.js
git commit -m "feat: deliver project workspace mockup"
```

## Self-Review

### Spec Coverage

- Project management tab: covered in Tasks 3 and 4
- Name-only project creation: covered in Tasks 2 and 4
- Folder-style project cards: covered in Task 3
- Click-through into workspace: covered in Tasks 2, 4, and 5
- Left agent panel with one-line status and click-through details: covered in Tasks 5 and 6
- Chat-first workspace with user-right/system-left bubbles: covered in Task 5
- Right context panel for selected output: covered in Task 5
- Approve bar separated from composer: covered in Tasks 5 and 6
- Theme fidelity to `design-reference`: covered in Tasks 1, 3, and 6

### Placeholder Scan

- No `TBD`, `TODO`, or deferred placeholders remain.
- Each code step includes concrete file content or commands.
- Testing steps name exact commands and expected outcomes.

### Type Consistency

- State keys remain `view`, `projects`, `selectedProjectId`, `agents`, and `selectedAgentId` throughout the plan.
- Render modules consume the same agent and project shapes defined in `data.js` and `state.js`.

