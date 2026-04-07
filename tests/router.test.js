import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLauncherRoute,
  buildProjectRoute,
  buildSessionRoute,
  parseRoute
} from "../mockup/scripts/router.js";

test("parseRoute normalizes the launcher route", () => {
  assert.deepEqual(parseRoute("/"), { view: "projects" });
  assert.deepEqual(parseRoute("/broken/path"), { view: "projects" });
});

test("parseRoute reads project and session routes", () => {
  assert.deepEqual(parseRoute("/projects/p1"), {
    view: "workspace",
    projectId: "p1",
    sessionId: null
  });

  assert.deepEqual(parseRoute("/projects/p1/sessions/s2"), {
    view: "workspace",
    projectId: "p1",
    sessionId: "s2"
  });
});

test("buildRoute helpers create canonical URLs", () => {
  assert.equal(buildLauncherRoute(), "/");
  assert.equal(buildProjectRoute("p1"), "/projects/p1");
  assert.equal(buildSessionRoute("p1", "s2"), "/projects/p1/sessions/s2");
});
