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
        <span class="folder-card__thumb-eyebrow">아직 결과물 없음</span>
        <strong class="folder-card__thumb-title">새 프로젝트</strong>
        <span class="folder-card__thumb-copy">메시지를 보내면 에이전트가 시작됩니다.</span>
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
  const name = escapeHtml(project?.name || "제목 없는 프로젝트");
  const updatedAt = escapeHtml(project?.updatedAt || "최근 업데이트");
  const status = escapeHtml(project?.status || "초안 선택 대기 중");
  const statusKind = escapeHtml(project?.statusKind || "default");
  const needsAttention = project?.statusKind === "waiting";

  const badgeLabel = needsAttention ? "결정 필요" : statusKind === "default" ? "새 프로젝트" : "진행 중";

  return `
    <button
      type="button"
      class="folder-card"
      data-action="open-project"
      data-project-id="${id}"
      aria-label="프로젝트 열기: ${name}"
    >
      <span class="folder-card__tab" aria-hidden="true"></span>
      ${renderThumbnail(project)}
      <span class="folder-card__status-badge folder-card__status-badge--${statusKind}">
        ${badgeLabel}
      </span>
      <span class="folder-card__title">${name}</span>
      <span class="folder-card__meta">업데이트 ${updatedAt}</span>
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

function renderCreateProjectDialog() {
  return `
    <div class="dialog-backdrop" data-action="cancel-create-project">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 class="dialog__title" id="dialog-title">새 프로젝트</h2>
        <p class="dialog__body">광고 캠페인이나 브랜드 이름을 입력하세요.</p>
        <input
          id="create-project-input"
          type="text"
          class="dialog__input"
          placeholder="예: Nike Winter Campaign"
          maxlength="60"
          autocomplete="off"
        />
        <div class="dialog__actions">
          <button type="button" class="button button--secondary" data-action="cancel-create-project">취소</button>
          <button type="button" class="button button--primary" data-action="submit-create-project">만들기</button>
        </div>
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
    <section class="launcher" aria-label="프로젝트 관리">
      <header class="launcher__topbar">
        <div class="launcher__heading">
          <h1>Projects</h1>
        </div>
        <button type="button" class="button button--primary" data-action="create-project-button">
          Create Project
        </button>
      </header>

      <div class="launcher__body">
        <div class="launcher__summary">
          <span class="launcher__summary-chip launcher__summary-chip--attention">결정 대기 중</span>
          <span class="launcher__summary-chip">${projects.length}개 프로젝트</span>
        </div>
        ${projects.length > 0 ? `<div class="project-grid">${cards}</div>` : renderEmptyState()}
      </div>
    </section>
    ${state?.createProjectModalOpen ? renderCreateProjectDialog() : ""}
  `;
}
