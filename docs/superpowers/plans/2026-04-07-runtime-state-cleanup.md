# Runtime State Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unused demo seed data and legacy client state so the mockup operates only on the runtime state contract that the current UI and pipeline actually use.

**Architecture:** Shrink the client data layer down to a minimal launcher helper, then simplify `state.js` to only hold project, session, task, feed, pipeline, and history data. Finally, simplify `render-workspace.js` so it consumes explicit runtime state rather than inventing demo fallback tasks, and update tests to lock the leaner contract in.

**Tech Stack:** Vanilla browser JavaScript, Node.js, `node:test`

---

### Task 1: Remove unused demo seed exports from the data layer

**Files:**
- Modify: `mockup/scripts/data.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/state.test.js` so it asserts the initial launcher state is built without any imported seed project/task/feed/session data and only exposes the empty launcher collections used by `createInitialState()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL if `state.js` still relies on seed-backed imports from `data.js`

- [ ] **Step 3: Write minimal implementation**

Update `mockup/scripts/data.js` to export only:

```js
export function createEmptyLauncherCollections() {
  return {
    projects: [],
    tasks: [],
    feedItems: [],
    sessions: [],
    activeSubAgents: []
  };
}
```

Delete all `seed*` exports from this file.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

### Task 2: Remove legacy state helpers and fields from `state.js`

**Files:**
- Modify: `mockup/scripts/state.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/state.test.js` to assert that `createInitialState()` and `selectProject()` no longer expose these legacy fields:
- `approveGate`
- `agents`
- `messages`
- `selectedOutput`
- `workspaceBadge`
- `workspaceStatus`
- `agentModalOpen`

Also assert task detail open/close still works with the reduced state shape.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js`
Expected: FAIL because those fields still exist in the state shape

- [ ] **Step 3: Write minimal implementation**

In `mockup/scripts/state.js`:
- delete `cloneTask`, `cloneFeedItem`, `cloneFocusPanel`, `createBlankPanel`, `createBlankApproveGate`, `createLegacyAgent`, and `createLegacyMessages` if they are no longer needed after cleanup
- keep `createBlankComposer()`, `createFreshTasks()`, `createFreshSessions()`, route helpers, feed helpers, pipeline helpers, and history helpers
- remove the legacy fields from `createLauncherState()` and `createWorkspaceState()`
- simplify `openTaskDetail()` and `closeTaskDetail()` so they only update the fields still in use

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js`
Expected: PASS

### Task 3: Remove demo task fallback from the workspace renderer

**Files:**
- Modify: `mockup/scripts/render-workspace.js`
- Test: `tests/renderer-smoke.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/renderer-smoke.test.js` with a case where:
- `state.tasks` is an empty array
- `renderWorkspaceView()` should not render demo tasks like `Research`, `Copy`, `Scenario`, `Storyboard`
- the Current Flow / task-detail sections should remain stable without fabricating data

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/renderer-smoke.test.js`
Expected: FAIL because `render-workspace.js` still falls back to `getDefaultTasks()`

- [ ] **Step 3: Write minimal implementation**

In `mockup/scripts/render-workspace.js`:
- delete `getDefaultTasks()`
- update `getTasks(state)` to read only from `state.tasks`
- keep `getRawOutputs()` normalization for copy/scenario/storyboard outputs
- keep the empty-state rendering for Current Flow and task detail stable when no tasks are present
- remove any renderer references to deleted legacy state aliases that are no longer needed after Task 2

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/renderer-smoke.test.js`
Expected: PASS

### Task 4: Align the rest of the client code with the leaner state contract

**Files:**
- Modify: `mockup/scripts/main.js`
- Modify: `mockup/scripts/render-workspace.js`
- Test: `tests/renderer-smoke.test.js`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

Add or adjust assertions in the existing client tests so they confirm:
- project open/back/home flows still work with the reduced state shape
- approve-gate patching still works after removing legacy state fields
- copy gate collapse and streaming behavior still render correctly

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: FAIL if `main.js` or the renderer still reference removed fields

- [ ] **Step 3: Write minimal implementation**

Update any lingering references in `mockup/scripts/main.js` and `mockup/scripts/render-workspace.js` so they only use the reduced runtime state:

```js
// Example shape after cleanup
{
  view,
  projects,
  selectedProjectId,
  tasks,
  selectedTaskId,
  taskDetailOpen,
  feedItems,
  sessions,
  activeSessionId,
  sessionsPanelOpen,
  activeSubAgents,
  composer,
  selectedModel,
  pipelineRunning,
  pipelineStage,
  pipelineContext,
  storyboardImages,
  createProjectModalOpen,
  copyHistory,
  copyHistoryIdx,
  scenarioHistory,
  scenarioHistoryIdx
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/state.test.js tests/renderer-smoke.test.js`
Expected: PASS

### Task 5: Full regression verification

**Files:**
- Test: `tests/*.test.js`

- [ ] **Step 1: Run the full suite**

Run: `node --test tests/*.test.js`
Expected: PASS

- [ ] **Step 2: Manual code scan**

Run:

```bash
rg -n "seedProjects|seedTasks|seedFeedItems|seedFocusPanel|seedApproveGate|seedComposer|seedActiveSubAgents|seedSessions|createLegacyAgent|createLegacyMessages|selectedOutput|workspaceBadge|workspaceStatus|agentModalOpen|messages:|agents:" mockup/scripts
```

Expected: no matches for removed seed exports or deleted legacy helpers/fields, aside from legitimate `task.agents` usage inside actual task payload rendering.
