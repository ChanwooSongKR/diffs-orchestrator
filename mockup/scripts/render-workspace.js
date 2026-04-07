import { formatStreamTextForDisplay } from "./streaming.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getProjects(state) {
  return normalizeArray(state?.projects);
}

function getRawOutputs(task) {
  const raw = task.outputs ?? task.artifacts ?? task.results;
  // scenario outputs is a plain object (not array) — preserve as-is
  if (raw && !Array.isArray(raw) && typeof raw === "object") return raw;
  return normalizeArray(raw);
}

function getTasks(state) {
  return normalizeArray(state?.tasks).map((task, index) => ({
    id: task.id ?? `task-${index}`,
    name: task.name ?? task.label ?? "Task",
    status: task.status ?? "",
    summary: task.summary ?? task.description ?? "",
    reason: task.reason ?? task.why ?? "",
    agents: normalizeArray(task.agents ?? task.workers ?? task.assignees),
    outputs: getRawOutputs(task),
    nextAction: task.nextAction ?? task.nextStep ?? task.next ?? "",
  }));
}

function getSelectedTaskId(state) {
  return state?.selectedTaskId ?? null;
}

function getSelectedTask(tasks, selectedTaskId) {
  return tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
}

function getSelectedProject(state) {
  const projects = getProjects(state);
  return projects.find((project) => project.id === state?.selectedProjectId) ?? projects[0] ?? null;
}

function getTaskStatusMeta(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "running") return { cls: "running", label: "Running", indicator: "pulse" };
  if (s === "ready") return { cls: "ready", label: "Ready", indicator: "check" };
  if (s.includes("waiting")) return { cls: "waiting", label: "대기 중", indicator: "wait" };
  if (s === "done") return { cls: "done", label: "Done", indicator: "done" };
  if (s === "blocked") return { cls: "blocked", label: "Blocked", indicator: "block" };
  return { cls: "default", label: status, indicator: "none" };
}

function renderStatusIndicator(indicator) {
  if (indicator === "pulse") {
    return `<span class="status-dot status-dot--pulse" title="Running"><span></span></span>`;
  }
  if (indicator === "check") {
    return `<span class="status-dot status-dot--check" title="Ready">✓</span>`;
  }
  if (indicator === "wait") {
    return `<span class="status-dot status-dot--wait" title="Waiting">⋯</span>`;
  }
  if (indicator === "done") {
    return `<span class="status-dot status-dot--done" title="Done">✓</span>`;
  }
  if (indicator === "block") {
    return `<span class="status-dot status-dot--block" title="Blocked">–</span>`;
  }
  return `<span class="status-dot status-dot--none"></span>`;
}

function renderSessionsRail(state) {
  const sessions = normalizeArray(state.sessions);
  const activeId = state.activeSessionId;

  const sessionItems = sessions.map(session => {
    const isActive = session.id === activeId;
    const dot = session.status === "active"
      ? `<span class="srail-dot srail-dot--active"></span>`
      : `<span class="srail-dot"></span>`;
    return `
      <button
        type="button"
        class="srail-item${isActive ? " is-active" : ""}"
        data-action="select-session"
        data-session-id="${escapeHtml(session.id)}"
      >
        <div class="srail-item__top">
          ${dot}
          <span class="srail-item__label">${escapeHtml(session.label)}</span>
          <span class="srail-item__time">${escapeHtml(session.timestamp)}</span>
        </div>
        <p class="srail-item__preview">${escapeHtml(session.preview)}</p>
      </button>
    `;
  }).join("");

  return `
    <aside class="workspace__rail workspace__rail--sessions" aria-label="Chat sessions">
      <div class="srail-heading">
        <p class="panel-kicker">Chat Sessions</p>
        <button type="button" class="srail-new-btn" data-action="new-session">+ 새 세션</button>
      </div>
      <div class="srail-list">
        ${sessionItems || `<p class="empty-rail">세션 없음</p>`}
      </div>
    </aside>
  `;
}

function renderStatusRail(state) {
  const subAgents = normalizeArray(state?.activeSubAgents);
  const runtimeAgentItems = subAgents.map((agent) => `
    <div class="sub-agent-item" data-agent-id="${escapeHtml(agent.id ?? "")}">
      <span class="sub-agent-spinner"></span>
      <div class="sub-agent-body">
        <span class="sub-agent-name">${escapeHtml(agent.name)}</span>
        <span class="sub-agent-activity">${escapeHtml(agent.activity)}</span>
      </div>
    </div>
  `).join("");

  const runtimeAgentsRail = runtimeAgentItems || `
    <div class="empty-rail empty-rail--agents">
      활성 에이전트 없음
    </div>
  `;

  return `
    <aside class="workspace__rail workspace__rail--status" aria-label="Task status and agents">
      <div class="panel-heading">
        <p class="panel-kicker">Current Flow</p>
      </div>
      <div class="status-rail-list">
        ${runtimeAgentsRail}
      </div>
    </aside>
  `;
}

function renderFeedItem(item) {
  const type = item?.type ?? item?.role ?? "system_message";

  if (type === "status") {
    return `
      <div class="chat-status-row is-system" data-feed-type="status">
        <div class="chat-status">${escapeHtml(item.text ?? item.body ?? "")}</div>
      </div>
    `;
  }

  if (type === "stream_text") {
    const text = formatStreamTextForDisplay(item?.text ?? "");
    const isStreaming = item?.isStreaming !== false;
    const isCollapsed = !isStreaming && item?.isCollapsed !== false;
    const toggleLabel = isCollapsed ? "펼치기" : "접기";
    const toggleIcon = isCollapsed
      ? `<svg class="stream-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5.5L7 9L11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      : `<svg class="stream-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8.5L7 5L11 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    return `
      <div class="chat-row is-system" data-feed-type="stream_text" data-stream-id="${escapeHtml(item.id)}">
        <div class="chat-bubble is-bubble stream-bubble">
          ${!isStreaming && text
            ? `<div class="stream-bubble__toolbar">
                <button
                  type="button"
                  class="stream-toggle-btn"
                  data-action="toggle-stream-collapse"
                  data-stream-id="${escapeHtml(item.id)}"
                  aria-label="${toggleLabel}"
                  aria-expanded="${isCollapsed ? "false" : "true"}"
                >${toggleIcon}</button>
              </div>`
            : ""}
          ${text && (!isCollapsed || isStreaming)
            ? `<pre class="stream-text${isCollapsed ? " is-collapsed" : ""}">${escapeHtml(text)}</pre>`
            : isStreaming
              ? `<span class="typing-dots"><span></span><span></span><span></span></span>`
              : ""}
        </div>
      </div>
    `;
  }

  if (type === "scenario_card") {
    const s = item.scenario ?? {};
    const acts = Array.isArray(s.acts) ? s.acts : [];
    const actSummary = acts.map(a =>
      `<li><strong>${escapeHtml(a.title ?? `ACT ${a.act}`)}</strong> — ${(a.scenes ?? []).length}장면</li>`
    ).join("");
    return `
      <div class="chat-row is-system" data-feed-type="scenario_card">
        <div class="scenario-feed-card">
          <p class="scenario-feed-card__eyebrow">🎬 시나리오</p>
          <h4 class="scenario-feed-card__title">${escapeHtml(s.title ?? "")}</h4>
          <p class="scenario-feed-card__subtitle">${escapeHtml(s.subtitle ?? "")}</p>
          <ul class="scenario-feed-card__acts">${actSummary}</ul>
          <p class="scenario-feed-card__meta">${escapeHtml(s.duration ?? "")} · ${acts.length}막</p>
        </div>
      </div>
    `;
  }

  if (type === "storyboard_done") {
    return `
      <div class="chat-row is-system" data-feed-type="storyboard_done">
        <div class="chat-bubble is-bubble">
          스토리보드 생성이 완료되었습니다.
          <div style="margin-top:10px;">
            <button type="button" class="button button--primary" data-action="open-task-detail" data-task-id="storyboard">
              스토리보드 열기 →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (type === "result_card") {
    const meta = normalizeArray(item.meta);

    return `
      <article class="result-card-feed" data-feed-type="result_card">
        <p class="panel-kicker">Result Card</p>
        <h3>${escapeHtml(item.title ?? "Result")}</h3>
        ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
        ${
          meta.length
            ? `<dl class="result-card-feed__meta">
                ${meta
                  .map(
                    (entry) => `
                      <div>
                        <dt>${escapeHtml(entry.label)}</dt>
                        <dd>${escapeHtml(entry.value)}</dd>
                      </div>
                    `
                  )
                  .join("")}
              </dl>`
            : ""
        }
      </article>
    `;
  }

  const isUser = type === "user_message" || item?.role === "user";
  const alignmentClass = isUser ? "is-user" : "is-system";
  const text = item?.text ?? item?.body ?? "";

  return `
    <div class="chat-row ${alignmentClass}" data-feed-type="${escapeHtml(type)}">
      <div class="chat-bubble ${isUser ? "is-bubble" : "is-bubble"}">
        ${escapeHtml(text)}
      </div>
    </div>
  `;
}

function renderChevronIcon(direction = "down") {
  if (direction === "up") {
    return `<svg class="stream-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8.5L7 5L11 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  return `<svg class="stream-toggle-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5.5L7 9L11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function renderApproveGate(state) {
  const stage = state?.pipelineStage;

  if (stage === "waiting_research_input") {
    const question = state?.pipelineContext?.researchQuestion ?? "추가 정보가 필요합니다.";
    const missingFields = normalizeArray(state?.pipelineContext?.researchMissingFields);
    const reason = state?.pipelineContext?.researchReason ?? "";

    return `
      <section class="approve-gate" aria-label="리서치 추가 정보 요청">
        <p class="panel-kicker">추가 정보 요청</p>
        ${reason ? `<p class="approve-gate__hint">${escapeHtml(reason)}</p>` : ""}
        <p class="approve-gate__hint">${escapeHtml(question)}</p>
        ${missingFields.length
          ? `<p class="approve-gate__hint">필요 항목: ${escapeHtml(missingFields.join(", "))}</p>`
          : ""}
        <div class="approve-gate__actions">
          <input
            type="text"
            class="approve-feedback-input"
            placeholder="예: 타깃은 20대 도시 러너, 출시 시점은 9월"
          />
          <div class="approve-gate__btns">
            <button type="button" class="button button--primary" data-action="confirm-research-info">이 정보로 계속</button>
          </div>
        </div>
      </section>
    `;
  }

  if (stage === "waiting_copy") {
    const copies = normalizeArray(state?.pipelineContext?.copies);
    const selectedIdx = state?.pipelineContext?.selectedCopyIndex ?? 0;
    const isCollapsed = state?.pipelineContext?.approveGateCollapsed === true;
    const selectedCopy = copies[selectedIdx] ?? copies[0] ?? null;

    const copyCards = copies.map((copy, i) => `
      <button
        type="button"
        class="approve-copy-card${i === selectedIdx ? " is-selected" : ""}"
        data-action="select-copy"
        data-copy-index="${i}"
      >
        <span class="approve-copy-label">Copy ${i + 1}</span>
        <p class="approve-copy-headline">${escapeHtml(copy.headline ?? "")}</p>
        <p class="approve-copy-desc">${escapeHtml(copy.desc ?? "")}</p>
      </button>
    `).join("");

    return `
      <section class="approve-gate${isCollapsed ? " is-collapsed" : ""}" aria-label="카피 검토">
        <div class="approve-gate__header">
          <p class="panel-kicker">카피 선택</p>
          <button
            type="button"
            class="stream-toggle-btn"
            data-action="toggle-approve-gate-collapse"
            aria-label="${isCollapsed ? "펼치기" : "접기"}"
            aria-expanded="${isCollapsed ? "false" : "true"}"
          >${renderChevronIcon(isCollapsed ? "down" : "up")}</button>
        </div>
        ${isCollapsed
          ? `
            <div class="approve-gate__summary">
              <strong class="approve-gate__summary-title">${escapeHtml(selectedCopy?.headline ?? "선택된 카피 없음")}</strong>
              ${selectedCopy?.desc ? `<p class="approve-gate__summary-copy">${escapeHtml(selectedCopy.desc)}</p>` : ""}
            </div>
          `
          : `
            <div class="approve-gate__body approve-gate__body--copy">
              <div class="approve-copy-grid">${copyCards || "<p>카피를 불러오는 중...</p>"}</div>
            </div>
            <div class="approve-gate__actions">
              <input
                type="text"
                class="approve-feedback-input"
                placeholder="수정 방향을 입력하세요 (예: '더 도발적으로', '여성 타깃으로')"
              />
              <div class="approve-gate__btns">
                <button type="button" class="button button--secondary" data-action="regen-copy">다시 생성</button>
                <button type="button" class="button button--primary" data-action="confirm-copy">이 카피로 진행 →</button>
              </div>
            </div>
          `}
      </section>
    `;
  }

  if (stage === "waiting_scenario") {
    const scenario = state?.pipelineContext?.scenario ?? {};
    const acts = Array.isArray(scenario.acts) ? scenario.acts : [];
    const actsHtml = acts.map(act => `
      <div class="approve-scenario-act">
        <p class="approve-scenario-act__label">ACT ${escapeHtml(String(act.act ?? ""))} — ${escapeHtml(act.title ?? "")}</p>
        <ul class="approve-scenario-act__scenes">
          ${(act.scenes ?? []).map(sc => `
            <li><strong>${escapeHtml(sc.location ?? "")}</strong> ${escapeHtml(sc.desc ?? "")}</li>
          `).join("")}
        </ul>
      </div>
    `).join("");

    return `
      <section class="approve-gate" aria-label="시나리오 검토">
        <div class="approve-gate__scenario-info">
          <p class="panel-kicker">시나리오 검토</p>
          ${scenario.title ? `
            <div class="approve-scenario-header">
              <h4 class="approve-scenario-title">${escapeHtml(scenario.title)}</h4>
              <p class="approve-scenario-subtitle">${escapeHtml(scenario.subtitle ?? "")}</p>
              <p class="approve-scenario-meta">${escapeHtml(scenario.duration ?? "")} · ${escapeHtml(scenario.tone ?? "").slice(0, 60)}</p>
            </div>
            <div class="approve-scenario-acts">${actsHtml}</div>
          ` : `<p class="approve-gate__hint">시나리오를 불러오는 중...</p>`}
        </div>
        <div class="approve-gate__actions">
          <input
            type="text"
            class="approve-feedback-input"
            placeholder="수정 방향을 입력하세요 (예: '2막을 더 극적으로', '나레이션 없이')"
          />
          <div class="approve-gate__btns">
            <button type="button" class="button button--secondary" data-action="regen-scenario">수정 요청</button>
            <button type="button" class="button button--primary" data-action="confirm-scenario">이 시나리오로 진행 →</button>
          </div>
        </div>
      </section>
    `;
  }

  return "";
}

function renderComposer(state) {
  const composer = state?.composer ?? {};
  const placeholder = composer.placeholder ?? "Type a message to continue the workspace conversation.";
  const isRunning = Boolean(state?.pipelineRunning);
  const selectedModel = state?.selectedModel ?? "Gemini 3 Flash";
  const models = ["Gemini 3 Pro", "Gemini 3 Flash", "GPT-5", "GPT-4.1 mini"];

  return `
    <div class="composer-wrap">
      <form class="composer${isRunning ? " composer--running" : ""}">
        <button type="button" class="composer-attach-btn" aria-label="파일 첨부" ${isRunning ? "disabled" : ""}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 7.5L7.5 13.5C6.1 14.9 3.9 14.9 2.5 13.5C1.1 12.1 1.1 9.9 2.5 8.5L8.5 2.5C9.4 1.6 10.9 1.6 11.8 2.5C12.7 3.4 12.7 4.9 11.8 5.8L5.8 11.8C5.3 12.3 4.6 12.3 4.1 11.8C3.6 11.3 3.6 10.6 4.1 10.1L9.5 4.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <label class="sr-only" for="workspace-composer-input">Workspace message</label>
        <input
          id="workspace-composer-input"
          type="text"
          value="${escapeHtml(composer.value ?? "")}"
          placeholder="${isRunning ? "Agent pipeline running..." : escapeHtml(placeholder)}"
          ${isRunning ? "disabled" : ""}
        />
        <div class="llm-select-wrap">
          <select class="llm-select" aria-label="모델 선택" ${isRunning ? "disabled" : ""}>
            ${models.map(m => `<option${m === selectedModel ? " selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
        </div>
        <button
          type="button"
          class="composer-send-btn"
          data-action="send-message"
          ${isRunning ? "disabled" : ""}
        >${isRunning ? "Running…" : escapeHtml(composer.actionLabel ?? "Send")}</button>
      </form>
    </div>
  `;
}

function renderFocusPanel(state) {
  const panel = state?.focusPanel ?? {};
  const eyebrow = panel.eyebrow ?? panel.kicker ?? "Current focus";
  const title = panel.title ?? panel.name ?? "Selected output";
  const body = panel.body ?? panel.summary ?? "";
  const meta = normalizeArray(panel.meta);

  return `
    <aside class="workspace__rail workspace__rail--context" aria-label="Focus panel">
      <div class="panel-heading">
        <p class="panel-kicker">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="context-card">
        ${body ? `<p class="context-card__body">${escapeHtml(body)}</p>` : ""}
        ${
          meta.length
            ? `<dl class="context-card__meta">
                ${meta
                  .map(
                    (item) => `
                      <div>
                        <dt>${escapeHtml(item.label)}</dt>
                        <dd>${escapeHtml(item.value)}</dd>
                      </div>
                    `
                  )
                  .join("")}
              </dl>`
            : ""
        }
      </div>
    </aside>
  `;
}

function renderCopyOutputs(outputs) {
  if (!outputs.length) return `<p class="task-detail-empty">생성된 카피가 없습니다.</p>`;
  return outputs.map((output, i) => {
    if (typeof output === "string") {
      return `<div class="copy-card"><p class="copy-card__headline">${escapeHtml(output)}</p></div>`;
    }
    const label = ["A", "B", "C"][i] ?? String(i + 1);
    return `
      <div class="copy-card">
        <span class="copy-card__label">Copy ${escapeHtml(label)}</span>
        <p class="copy-card__headline">${escapeHtml(output.headline ?? "")}</p>
        <p class="copy-card__desc">${escapeHtml(output.desc ?? "")}</p>
      </div>
    `;
  }).join("");
}

function renderStoryboardOutputs(outputs, storyboardImages = {}) {
  const cuts = Array.isArray(outputs) ? outputs : [];
  if (!cuts.length) return `<p class="task-detail-empty">생성된 컷이 없습니다.</p>`;

  const byAct = {};
  cuts.forEach(cut => {
    const act = cut.act ?? "기타";
    if (!byAct[act]) byAct[act] = [];
    byAct[act].push(cut);
  });

  return Object.entries(byAct).map(([actName, actCuts]) => `
    <div class="sb-act-group">
      <p class="sb-act-label">${escapeHtml(actName)}</p>
      <div class="sb-strip">
        ${actCuts.map(cut => {
          const timecode = cut.timecode ? `<span class="sb-cut__timecode">${escapeHtml(cut.timecode)}</span>` : "";
          const sceneNum = cut.scene != null ? `<span class="sb-cut__num" style="color:${escapeHtml(cut.accent ?? "#6B8FA3")}">#${escapeHtml(String(cut.scene))}</span>` : "";
          const imgUrl = storyboardImages[cut.scene];
          const frameInner = imgUrl
            ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(cut.title ?? "")}" class="sb-cut__img" loading="lazy" />`
            : `
              <div class="sb-cut__silhouette" style="border-color:${escapeHtml(cut.accent ?? "#6B8FA3")}50;"></div>
              <div class="sb-cut__glow" style="background:${escapeHtml(cut.accent ?? "#6B8FA3")};"></div>
            `;
          return `
            <div class="sb-cut">
              <div class="sb-cut__frame" style="background:${escapeHtml(cut.color ?? "#1a1a2e")}; border-color:${escapeHtml(cut.accent ?? "#6B8FA3")}30;">
                ${timecode}
                ${frameInner}
              </div>
              <div class="sb-cut__meta">
                ${sceneNum}
                <p class="sb-cut__title">${escapeHtml(cut.title ?? "")}</p>
                <p class="sb-cut__desc">${escapeHtml(cut.desc ?? "")}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");
}

function renderScenarioOutputs(outputs) {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    return `<p class="task-detail-empty">생성된 시나리오가 없습니다.</p>`;
  }
  const acts = Array.isArray(outputs.acts) ? outputs.acts : [];
  const toneLines = (outputs.tone ?? "").split("\n");

  return `
    <div class="scenario-doc">
      <div class="scenario-doc__hero">
        <p class="scenario-doc__eyebrow">🎬 시나리오</p>
        <h3 class="scenario-doc__title">${escapeHtml(outputs.title ?? "")}</h3>
        <p class="scenario-doc__subtitle">${escapeHtml(outputs.subtitle ?? "")}</p>
        <div class="scenario-doc__chips">
          <span class="scenario-chip">⏱ ${escapeHtml(outputs.duration ?? "")}</span>
          ${toneLines.map(l => l.trim() ? `<span class="scenario-chip">${escapeHtml(l)}</span>` : "").join("")}
        </div>
      </div>
      ${acts.map(act => `
        <div class="scenario-act">
          <p class="scenario-act__label">ACT ${escapeHtml(String(act.act ?? ""))}</p>
          <h4 class="scenario-act__title">${escapeHtml(act.title ?? "")}</h4>
          ${(act.scenes ?? []).map(scene => `
            <div class="scenario-scene">
              <div class="scenario-scene__header">
                <span class="scenario-scene__id">[장면 ${escapeHtml(scene.id ?? "")}]</span>
                <span class="scenario-scene__location">${escapeHtml(scene.location ?? "")}</span>
              </div>
              <p class="scenario-scene__desc">${escapeHtml(scene.desc ?? "")}</p>
              ${scene.narration ? `<div class="scenario-scene__narration"><span class="scenario-tag">나레이션</span> ${escapeHtml(scene.narration)}</div>` : ""}
              ${scene.caption ? `<div class="scenario-scene__caption"><span class="scenario-tag">자막</span> ${escapeHtml(scene.caption)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      `).join("")}
      ${outputs.sound ? `
        <div class="scenario-sound">
          <p class="scenario-tag">🎧 사운드 가이드</p>
          <p class="scenario-sound__body">${escapeHtml(outputs.sound).replace(/\n/g, "<br>")}</p>
        </div>
      ` : ""}
    </div>
  `;
}

function renderHistoryNav(type, idx, total) {
  if (total <= 1) return "";
  return `
    <div class="history-nav">
      <button type="button" class="history-nav__btn" data-action="history-nav" data-history-type="${type}" data-history-dir="prev" ${idx <= 0 ? "disabled" : ""}>‹</button>
      <span class="history-nav__label">${idx + 1} / ${total}</span>
      <button type="button" class="history-nav__btn" data-action="history-nav" data-history-type="${type}" data-history-dir="next" ${idx >= total - 1 ? "disabled" : ""}>›</button>
    </div>
  `;
}

function renderTaskDetailPopup(task, isOpen, storyboardImages = {}, historyState = {}) {
  if (!isOpen || !task) {
    return "";
  }

  const isStoryboard = task.id === "storyboard";
  const isScenario = task.id === "scenario";
  const isCopy = task.id === "copy";

  const agents = task.agents.length
    ? task.agents.map((agent) => `<li>${escapeHtml(agent)}</li>`).join("")
    : "<li>None listed</li>";

  let outputsHtml;
  if (isCopy) {
    const copyHistory = historyState.copyHistory ?? [];
    const copyIdx = historyState.copyHistoryIdx ?? copyHistory.length - 1;
    const historicOutputs = copyHistory[copyIdx] ?? task.outputs ?? [];
    outputsHtml = `
      <div class="task-detail-card__section">
        <div class="task-detail-section-header">
          <p class="panel-kicker">Generated Copy</p>
          ${renderHistoryNav("copy", copyIdx, copyHistory.length)}
        </div>
        <div class="copy-output-list">${renderCopyOutputs(historicOutputs)}</div>
      </div>
    `;
  } else if (isScenario) {
    const scenarioHistory = historyState.scenarioHistory ?? [];
    const scenarioIdx = historyState.scenarioHistoryIdx ?? scenarioHistory.length - 1;
    const historicScenario = scenarioHistory[scenarioIdx] ?? task.outputs;
    outputsHtml = `
      <div class="task-detail-card__section task-detail-card__section--scenario">
        <div class="task-detail-section-header">
          <p class="panel-kicker">Generated Scenario</p>
          ${renderHistoryNav("scenario", scenarioIdx, scenarioHistory.length)}
        </div>
        ${renderScenarioOutputs(historicScenario)}
      </div>
    `;
  } else if (isStoryboard) {
    outputsHtml = `
      <div class="task-detail-card__section task-detail-card__section--storyboard">
        <p class="panel-kicker">Storyboard Cuts</p>
        ${renderStoryboardOutputs(task.outputs, storyboardImages)}
      </div>
    `;
  } else {
    const rawOutputs = Array.isArray(task.outputs) ? task.outputs : [];
    const listItems = rawOutputs.length
      ? rawOutputs.map((o) => `<li>${escapeHtml(typeof o === "string" ? o : o.headline ?? o.title ?? "")}</li>`).join("")
      : "<li>None yet</li>";
    outputsHtml = `
      <div class="task-detail-card__section">
        <p class="panel-kicker">Recent Outputs</p>
        <ul>${listItems}</ul>
      </div>
    `;
  }

  const modalClass = isStoryboard ? "task-modal task-modal--wide" : "task-modal";

  return `
    <div class="task-modal-backdrop" data-action="close-task-detail-backdrop">
      <section class="${modalClass}" aria-label="${escapeHtml(task.name)} detail modal">
        <div class="task-modal__header">
          <div>
            <p class="panel-kicker">Task Detail</p>
            <h2>${escapeHtml(task.name)}</h2>
          </div>
          <button type="button" class="context-chip" data-action="close-task-detail">Close</button>
        </div>
        <div class="task-detail-card">
          <dl class="task-detail-card__meta">
            <div><dt>Status</dt><dd>${escapeHtml(task.status)}</dd></div>
            <div><dt>Why</dt><dd>${escapeHtml(task.reason || task.summary)}</dd></div>
            <div><dt>Next action</dt><dd>${escapeHtml(task.nextAction)}</dd></div>
          </dl>
          <div class="task-detail-card__section">
            <p class="panel-kicker">Agents Used</p>
            <ul>${agents}</ul>
          </div>
          ${outputsHtml}
        </div>
      </section>
    </div>
  `;
}

function renderSessionsPanel(state) {
  if (!state.sessionsPanelOpen) return "";
  const sessions = normalizeArray(state.sessions);
  const activeId = state.activeSessionId;

  const sessionItems = sessions.map(session => {
    const isActive = session.id === activeId;
    const statusDot = session.status === "active"
      ? `<span class="session-item__dot session-item__dot--active"></span>`
      : `<span class="session-item__dot"></span>`;
    return `
      <button
        type="button"
        class="session-item${isActive ? " is-active" : ""}"
        data-action="select-session"
        data-session-id="${escapeHtml(session.id)}"
      >
        <div class="session-item__top">
          ${statusDot}
          <span class="session-item__label">${escapeHtml(session.label)}</span>
          <span class="session-item__time">${escapeHtml(session.timestamp)}</span>
        </div>
        <p class="session-item__preview">${escapeHtml(session.preview)}</p>
        <span class="session-item__count">${escapeHtml(String(session.messageCount))}개 메시지</span>
      </button>
    `;
  }).join("");

  return `
    <div class="sessions-panel-backdrop" data-action="close-sessions-panel">
      <aside class="sessions-panel" aria-label="Chat sessions">
        <div class="sessions-panel__header">
          <h3>Chat Sessions</h3>
          <button type="button" class="context-chip" data-action="close-sessions-panel-btn">닫기</button>
        </div>
        <button type="button" class="session-new-btn" data-action="new-session">
          + 새 세션 시작
        </button>
        <div class="sessions-list">
          ${sessionItems || `<p class="task-detail-empty">세션이 없습니다.</p>`}
        </div>
      </aside>
    </div>
  `;
}

export function renderWorkspaceView(state = {}) {
  const selectedProject = getSelectedProject(state);
  const tasks = getTasks(state);
  const selectedTaskId = getSelectedTaskId(state);
  const selectedTask = getSelectedTask(tasks, selectedTaskId);
  const feedItems = normalizeArray(state?.feedItems);

  return `
    <section class="workspace" data-view="workspace" data-project-id="${escapeHtml(selectedProject?.id ?? "")}">
      ${renderSessionsRail(state)}
      <section class="workspace__chat">
        <header class="workspace__header">
          <div class="workspace__header-copy">
            <p class="panel-kicker">Workspace</p>
            <h1>${escapeHtml(selectedProject?.name ?? "Project workspace")}</h1>
          </div>
          <div class="workspace__header-meta">
            <button type="button" class="context-chip" data-action="go-projects">All Projects</button>
          </div>
        </header>
        <div class="chat-feed" aria-label="Chat feed">
          ${feedItems.map(renderFeedItem).join("")}
        </div>
        ${renderApproveGate(state)}
        ${renderComposer(state)}
      </section>
      ${renderStatusRail(state)}
      ${renderTaskDetailPopup(selectedTask, state.taskDetailOpen, state.storyboardImages ?? {}, state)}
    </section>
  `;
}
