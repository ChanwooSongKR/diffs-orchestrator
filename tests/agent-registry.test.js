import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { getAgentConfig } = require("../server/agents/registry.js");
const { runResearch } = require("../server/agents/research.js");
const { runCopy } = require("../server/agents/copy.js");
const { runScenario } = require("../server/agents/scenario.js");
const { runStoryboard } = require("../server/agents/storyboard.js");

test("agent registry exposes markdown-backed configs for all pipeline agents", () => {
  for (const name of ["research", "copy", "scenario", "storyboard"]) {
    const config = getAgentConfig(name);
    assert.equal(config.name, name);
    assert.ok(config.system.includes("당신은"));
    assert.ok(config.system.length > 30);
  }
});

test("pipeline agents expose registry-backed system instructions", () => {
  assert.equal(runResearch.agentName, "research");
  assert.equal(runResearch.system, getAgentConfig("research").system);

  assert.equal(runCopy.agentName, "copy");
  assert.equal(runCopy.system, getAgentConfig("copy").system);

  assert.equal(runScenario.agentName, "scenario");
  assert.equal(runScenario.system, getAgentConfig("scenario").system);

  assert.equal(runStoryboard.agentName, "storyboard");
  assert.equal(runStoryboard.system, getAgentConfig("storyboard").system);
});
