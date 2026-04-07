function normalizePathname(pathname) {
  if (typeof pathname !== "string") return "/";

  const trimmed = pathname.trim();
  if (!trimmed) return "/";

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash === "/") return "/";

  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function buildLauncherRoute() {
  return "/";
}

export function buildProjectRoute(projectId) {
  return `/projects/${encodeURIComponent(String(projectId))}`;
}

export function buildSessionRoute(projectId, sessionId) {
  return `/projects/${encodeURIComponent(String(projectId))}/sessions/${encodeURIComponent(String(sessionId))}`;
}

export function parseRoute(pathname) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") {
    return { view: "projects" };
  }

  const segments = normalized.split("/").filter(Boolean).map(decodeSegment);
  if (segments[0] !== "projects" || !segments[1]) {
    return { view: "projects" };
  }

  if (segments.length === 2) {
    return {
      view: "workspace",
      projectId: segments[1],
      sessionId: null
    };
  }

  if (segments.length === 4 && segments[2] === "sessions" && segments[3]) {
    return {
      view: "workspace",
      projectId: segments[1],
      sessionId: segments[3]
    };
  }

  return { view: "projects" };
}
