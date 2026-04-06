function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPriority(project) {
  if (project?.statusKind === "waiting") return 0;
  if (project?.statusKind === "running") return 1;
  return 2;
}

function renderThumbnail(project) {
  const thumbnail = project?.thumbnail;
  const tone = escapeHtml(thumbnail?.tone || "placeholder");

  if (!thumbnail) {
    return `
      <div class="folder-card__thumb folder-card__thumb--placeholder">
        <span class="folder-card__thumb-eyebrow">No Output Yet</span>
        <strong class="folder-card__thumb-title">New Project</strong>
        <span class="folder-card__thumb-copy">Recent output thumbnail will appear here.</span>
      </div>
    `;
  }

  return `
    <div class="folder-card__thumb folder-card__thumb--${tone}">
      <span class="folder-card__thumb-eyebrow">${escapeHtml(thumbnail.eyebrow)}</span>
      <strong class="folder-card__thumb-title">${escapeHtml(thumbnail.title)}</strong>
      <span class="folder-card__thumb-copy">${escapeHtml(thumbnail.description)}</span>
    </div>
  `;
}

function renderProjectCard(project) {
  const id = escapeHtml(project?.id);
  const name = escapeHtml(project?.name || "Untitled project");
  const updatedAt = escapeHtml(project?.updatedAt || "Recently updated");
  const status = escapeHtml(project?.status || "Draft selection pending");
  const statusKind = escapeHtml(project?.statusKind || "default");
  const needsAttention = project?.statusKind === "waiting";

  return `
    <button
      type="button"
      class="folder-card"
      data-action="open-project"
      data-project-id="${id}"
      aria-label="Open project ${name}"
    >
      <span class="folder-card__tab" aria-hidden="true"></span>
      ${renderThumbnail(project)}
      <span class="folder-card__status-badge folder-card__status-badge--${statusKind}">
        ${needsAttention ? "Needs Decision" : "In Progress"}
      </span>
      <span class="folder-card__title">${name}</span>
      <span class="folder-card__meta">Updated ${updatedAt}</span>
      <span class="folder-card__status">${status}</span>
    </button>
  `;
}

function renderEmptyState() {
  return `
    <div class="launcher-empty">
      <div class="launcher-empty__copy">
        <h2>첫 프로젝트를 만들어 시작하세요</h2>
        <p>Create Project 버튼으로 이름만 입력하면 바로 새 프로젝트를 만들 수 있습니다.</p>
      </div>
    </div>
  `;
}

export function renderProjectsView(state) {
  const projects = Array.isArray(state?.projects)
    ? [...state.projects].sort((left, right) => {
        const priorityDelta = getPriority(left) - getPriority(right);
        if (priorityDelta !== 0) return priorityDelta;
        return (left?.updatedRank ?? Number.MAX_SAFE_INTEGER) - (right?.updatedRank ?? Number.MAX_SAFE_INTEGER);
      })
    : [];
  const cards = projects.map(renderProjectCard).join("");

  return `
    <section class="launcher" aria-label="Project management launcher">
      <header class="launcher__topbar">
        <div class="launcher__heading">
          <p class="eyebrow">Project Management</p>
          <h1>Projects</h1>
        </div>
        <button type="button" class="button button--primary" data-action="create-project-button">
          Create Project
        </button>
      </header>

      <div class="launcher__body">
        <div class="launcher__summary">
          <span class="launcher__summary-chip launcher__summary-chip--attention">Waiting for user first</span>
          <span class="launcher__summary-chip">${projects.length} Projects</span>
        </div>
        ${projects.length > 0 ? `<div class="project-grid">${cards}</div>` : renderEmptyState()}
      </div>
    </section>
  `;
}
