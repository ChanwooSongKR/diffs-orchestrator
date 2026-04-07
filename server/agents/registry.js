const fs = require("node:fs");
const path = require("node:path");

const instructionCache = new Map();

const AGENT_CONFIGS = {
  research: {
    name: "research",
    instructionPath: path.join(__dirname, "instructions", "research.md")
  },
  copy: {
    name: "copy",
    instructionPath: path.join(__dirname, "instructions", "copy.md")
  },
  scenario: {
    name: "scenario",
    instructionPath: path.join(__dirname, "instructions", "scenario.md")
  },
  storyboard: {
    name: "storyboard",
    instructionPath: path.join(__dirname, "instructions", "storyboard.md")
  }
};

function loadInstruction(instructionPath) {
  if (!instructionCache.has(instructionPath)) {
    instructionCache.set(instructionPath, fs.readFileSync(instructionPath, "utf8").trim());
  }
  return instructionCache.get(instructionPath);
}

function getAgentConfig(name) {
  const config = AGENT_CONFIGS[name];
  if (!config) throw new Error(`Unknown agent config: ${name}`);
  return {
    ...config,
    system: loadInstruction(config.instructionPath)
  };
}

module.exports = { getAgentConfig };
