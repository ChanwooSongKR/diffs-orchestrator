# Agent Registry And Research Clarification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move agent instructions into per-agent Markdown files, centralize agent execution metadata in a registry, and add a research clarification stage that can pause the pipeline to ask the user for missing campaign information.

**Architecture:** Add a small server-side agent registry that maps each agent to its Markdown instruction file and response shape. Keep the existing route-level orchestration, but route each agent through shared instruction loading and shared research result handling. On the frontend, extend the existing approve gate pattern with a dedicated research clarification gate and keep all state transitions explicit through `pipelineStage`.

**Tech Stack:** Node.js, CommonJS server modules, browser-side vanilla JS, `node:test`

---

### Task 1: Add server-side instruction loading and registry

**Files:**
- Create: `server/agents/instructions/research.md`
- Create: `server/agents/instructions/copy.md`
- Create: `server/agents/instructions/scenario.md`
- Create: `server/agents/instructions/storyboard.md`
- Create: `server/agents/registry.js`
- Test: `tests/agent-registry.test.js`

- [ ] **Step 1: Write the failing test**

Add `tests/agent-registry.test.js` covering:
- registry returns metadata for `research`, `copy`, `scenario`, `storyboard`
- each entry resolves a non-empty Markdown instruction string

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/agent-registry.test.js`
Expected: FAIL because `server/agents/registry.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create a shared loader in `server/agents/registry.js` that:
- reads Markdown files from `server/agents/instructions`
- exports `getAgentConfig(name)`
- caches file reads per process

Move each current `SYSTEM` instruction into the corresponding Markdown file.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/agent-registry.test.js`
Expected: PASS

### Task 2: Migrate agent modules to the registry

**Files:**
- Modify: `server/agents/research.js`
- Modify: `server/agents/copy.js`
- Modify: `server/agents/scenario.js`
- Modify: `server/agents/storyboard.js`
- Test: `tests/agent-registry.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/agent-registry.test.js` to assert the registry-backed config is consumable from agent modules.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/agent-registry.test.js`
Expected: FAIL because the agents still use inline `SYSTEM` strings

- [ ] **Step 3: Write minimal implementation**

Update each agent to:
- import `getAgentConfig`
- use `getAgentConfig("<name>").system`
- keep current prompt bodies and runtime behavior intact

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/agent-registry.test.js`
Expected: PASS

### Task 3: Add research clarification result handling on the server

**Files:**
- Modify: `server/agents/research.js`
- Modify: `server/routes/chat.js`
- Create: `tests/research-flow.test.js`

- [ ] **Step 1: Write the failing test**

Add `tests/research-flow.test.js` covering:
- research can produce `{ status: "needs_input", question, missingFields, reason }`
- `initial` stage stops before copy and emits `approve_gate.type === "research_input"`
- `research_followup` merges the original message and user clarification, then proceeds once research returns `ready`

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/research-flow.test.js`
Expected: FAIL because the research clarification branch does not exist

- [ ] **Step 3: Write minimal implementation**

Update `runResearch()` so it returns structured status:
- `status: "ready"` with research data
- `status: "needs_input"` with question data

Update `server/routes/chat.js`:
- stop the `initial` stage if research needs input
- emit `approve_gate` with `type: "research_input"`
- add a new `research_followup` stage

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/research-flow.test.js`
Expected: PASS

### Task 4: Add frontend support for research clarification and collapse icon UX

**Files:**
- Modify: `mockup/scripts/state.js`
- Modify: `mockup/scripts/main.js`
- Modify: `mockup/scripts/render-workspace.js`
- Modify: `mockup/styles/theme.css`
- Modify: `tests/renderer-smoke.test.js`
- Modify: `tests/state.test.js`

- [ ] **Step 1: Write the failing test**

Add or extend browser-side tests so they cover:
- `waiting_research_input` gate rendering
- research clarification controls use the existing approve gate slot
- collapsed stream bubbles render icon-only toggle and hide text fully

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/renderer-smoke.test.js tests/state.test.js`
Expected: FAIL because the research clarification stage is not rendered yet

- [ ] **Step 3: Write minimal implementation**

Update the frontend to:
- support `pipelineStage === "waiting_research_input"`
- render question text plus one input and continue button
- post that answer through `research_followup`
- keep collapsed stream bubble body hidden until expanded

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/renderer-smoke.test.js tests/state.test.js`
Expected: PASS

### Task 5: Regression verification

**Files:**
- Test: `tests/*.test.js`

- [ ] **Step 1: Run the full suite**

Run: `node --test tests/*.test.js`
Expected: PASS

- [ ] **Step 2: Manually inspect copy messaging and research gate strings**

Confirm:
- copy running status says `10가지 방향`
- result card says `10안`
- research clarification gate is distinct from copy/scenario selection
