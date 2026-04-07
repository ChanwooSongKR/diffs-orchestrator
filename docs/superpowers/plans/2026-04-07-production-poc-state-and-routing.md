# Production PoC State And Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove demo launcher projects, drive Current flow from real runtime agent activity, and add project/session URLs with browser navigation support.

**Architecture:** Strip seed-driven launcher/workspace state out of the initial client state and only construct workspace state when a project is opened. Add a small client-side router module that translates `window.location.pathname` into launcher, project, and session selections. Emit explicit `agent_activity` SSE events from the server so the client can maintain `activeSubAgents` without parsing task labels.

**Tech Stack:** Node.js, Express SSE, browser-side vanilla JS, `node:test`

---

### Task 1: Remove launcher demo seed state

**Files:**
- Modify: `mockup/scripts/data.js`
- Modify: `mockup/scripts/state.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/state.test.js` with assertions that:
- `createInitialState().projects` is an empty array
- `createInitialState().sessions`, `tasks`, `feedItems`, and `activeSubAgents` are empty arrays
- `createInitialState().view` remains the launcher/projects view

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL because the initial state still imports and clones the seed launcher/workspace data

- [ ] **Step 3: Write minimal implementation**

Update `mockup/scripts/data.js` and `mockup/scripts/state.js` so:
- `seedProjects` and other demo launcher defaults are no longer used by `createInitialState()`
- the initial launcher state is empty and idle
- workspace defaults are created through small helpers when `addProject()` or `selectProject()` opens a project
- existing new-project session reset behavior stays intact

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

### Task 2: Add route parsing and route-driven selection state

**Files:**
- Create: `mockup/scripts/router.js`
- Modify: `mockup/scripts/state.js`
- Modify: `mockup/scripts/main.js`
- Test: `tests/state.test.js`
- Test: `tests/router.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/router.test.js` covering:
- `parseRoute("/")` returns the launcher route
- `parseRoute("/projects/p1")` returns `{ view: "workspace", projectId: "p1", sessionId: null }`
- `parseRoute("/projects/p1/sessions/s2")` returns `{ view: "workspace", projectId: "p1", sessionId: "s2" }`
- invalid paths fall back to the launcher route

Extend `tests/state.test.js` with assertions that selecting a project/session can be driven by route data.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/router.test.js tests/state.test.js`
Expected: FAIL because `mockup/scripts/router.js` does not exist and state helpers do not accept route-driven selection yet

- [ ] **Step 3: Write minimal implementation**

Create `mockup/scripts/router.js` with helpers to:
- parse `window.location.pathname`
- build launcher, project, and session URLs
- normalize unknown paths to the launcher route

Update `mockup/scripts/state.js` so route application can:
- open the launcher when no project is selected
- open a project and choose its active/default session
- repair missing session IDs by selecting the project default session

Update `mockup/scripts/main.js` so startup applies the current route before the first render.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/router.test.js tests/state.test.js`
Expected: PASS

### Task 3: Sync navigation with browser history

**Files:**
- Modify: `mockup/scripts/main.js`
- Modify: `mockup/scripts/state.js`
- Test: `tests/router.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/router.test.js` to cover:
- creating a project pushes `/projects/:projectId/sessions/:sessionId`
- session switching updates the URL
- a simulated `popstate` applies the previous route without corrupting state

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/router.test.js`
Expected: FAIL because navigation does not currently call `history.pushState()` or handle `popstate`

- [ ] **Step 3: Write minimal implementation**

Update `mockup/scripts/main.js` so:
- launcher-to-project navigation pushes route changes
- session selection pushes route changes
- returning to the launcher pushes `/`
- `window.onpopstate` re-applies route-derived state and re-renders
- project creation still focuses `#workspace-composer-input` after route navigation

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/router.test.js`
Expected: PASS

### Task 4: Replace seeded Current flow agents with runtime agent activity

**Files:**
- Modify: `mockup/scripts/state.js`
- Modify: `mockup/scripts/render-workspace.js`
- Modify: `mockup/scripts/main.js`
- Test: `tests/state.test.js`
- Test: `tests/renderer-smoke.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/state.test.js` and `tests/renderer-smoke.test.js` to assert:
- initial `activeSubAgents` is empty
- applying a `running` agent activity adds that agent to state
- applying `waiting` updates the detail but keeps it active
- applying `completed` or `failed` removes the agent from Current flow
- the Current flow empty state renders when no active agents exist

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: FAIL because Current flow still depends on seeded agent data and lacks agent-activity reducers

- [ ] **Step 3: Write minimal implementation**

Add explicit state helpers in `mockup/scripts/state.js` for runtime agent activity:
- `applyAgentActivity(state, activity)`
- `clearActiveAgents(state)`

Update `mockup/scripts/main.js` to handle `agent_activity` SSE events and update state through those helpers.

Update `mockup/scripts/render-workspace.js` so the Current flow section:
- renders a stable empty-state message when `activeSubAgents` is empty
- renders only the current runtime agents otherwise

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: PASS

### Task 5: Emit explicit agent activity from the server

**Files:**
- Modify: `server/routes/chat.js`
- Modify: `server/agents/research.js`
- Modify: `server/agents/copy.js`
- Modify: `server/agents/scenario.js`
- Modify: `server/agents/storyboard.js`
- Test: `tests/research-flow.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/research-flow.test.js` to assert that:
- the `initial` stage emits `agent_activity` for `research` when research starts
- `research` emits `completed` before `copy` emits `running`
- clarification pauses emit `waiting` for `research`
- `scenario` and `storyboard` stages emit their own activity events

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/research-flow.test.js`
Expected: FAIL because the server does not emit `agent_activity` events yet

- [ ] **Step 3: Write minimal implementation**

Update the stage orchestration in `server/routes/chat.js` so it emits explicit `agent_activity` events around each agent boundary:
- `running` before an agent starts
- `waiting` when research requests more information
- `completed` when an agent finishes successfully
- `failed` inside the existing error path when the active agent errors

Keep the existing `task_update`, `feed`, `approve_gate`, and `done` events unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/research-flow.test.js`
Expected: PASS

### Task 6: Full regression verification

**Files:**
- Test: `tests/*.test.js`

- [ ] **Step 1: Run the full suite**

Run: `node --test tests/*.test.js`
Expected: PASS

- [ ] **Step 2: Manual smoke check**

Verify in the browser or rendered HTML output that:
- the launcher opens without demo projects
- creating a project lands on a session URL and keeps the composer focused
- Current flow stays empty until a real pipeline starts
- research/copy/scenario/storyboard activity appears only while those agents are active
