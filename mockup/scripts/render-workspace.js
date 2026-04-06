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

function getDefaultTasks() {
  return [
    {
      id: "research",
      name: "Research",
      status: "Running",
      summary: "시장, 경쟁사, 레퍼런스를 수집하는 중입니다.",
      reason: "초기 맥락을 넓히기 위해 리서치가 먼저 진행됩니다.",
      agents: ["External Research Agent", "Internal Reference Search Agent", "Memory Agent"],
      outputs: ["Competitor snapshot", "Reference cluster"],
      nextAction: "리서치 결과를 검토한 뒤 카피 방향을 좁힙니다.",
    },
    {
      id: "copy",
      name: "Copy",
      status: "Ready",
      summary: "비교 가능한 카피 3안이 준비되었습니다.",
      reason: "초기 카피 초안을 검토할 수 있습니다.",
      agents: ["Copy Draft Workers", "Copy Curator", "Memory Agent"],
      outputs: [
        { headline: "Own the pace. Own the night.", desc: "러닝의 리듬을 도시의 에너지로 연결한 직관적 카피" },
        { headline: "Your stride. Your city.", desc: "개인의 달리기를 도시 공간과 연결하는 소속감 중심 카피" },
        { headline: "Move before the city wakes.", desc: "새벽 러닝의 고독과 자유를 포착한 감성적 카피" }
      ],
      nextAction: "하나를 선택하거나 두 안을 조합하도록 지시하세요.",
    },
    {
      id: "scenario",
      name: "Scenario",
      status: "Ready",
      summary: "시나리오 1안이 생성되었습니다. 검토 후 방향을 확정하세요.",
      reason: "카피 'Own the pace. Own the night.' 기반으로 시나리오가 작성되었습니다.",
      agents: ["Scenario Writer Agent", "Shot Planning Agent"],
      outputs: {
        title: "NIKE NIGHT RUN",
        subtitle: "「THE PACE: From Routine to Ritual」",
        duration: "1분 30초",
        tone: "Wieden+Kennedy식 Quiet Power — 절제, 리듬, 그리고 압도적 존재감.",
        acts: [
          {
            act: 1, title: "PROLOGUE — \"Before the city wakes.\"",
            scenes: [
              { id: "1", location: "새벽 4시 58분, 도심 골목", desc: "러너의 발이 신발 끈을 조인다. 손목시계 — 04:58.", narration: "\"대부분의 사람들이 잠든 시간.\"", caption: "\"Before the city decides who you are.\"" },
              { id: "2", location: "엘리베이터 로비", desc: "러너가 로비로 나선다. 경비원이 고개를 끄덕인다. 문이 열리며 새벽 공기.", narration: null, caption: null }
            ]
          },
          {
            act: 2, title: "BUILD — \"The city as a track.\"",
            scenes: [
              { id: "3", location: "한강변 — 와이드샷", desc: "러너 한 명이 강을 따라 달린다. 드론으로 서서히 당겨진다.", narration: "\"길은 정해져 있지 않다.\"", caption: "\"Own the pace.\"" },
              { id: "4", location: "교차로 — 신호 대기", desc: "빨간불. 러너가 제자리 달리기로 박자를 유지한다. 신호 바뀌자 폭발 출발.", narration: null, caption: "\"Don't stop. Adapt.\"" },
              { id: "5", location: "터널 구간 — 클로즈업 시리즈", desc: "발 / 무릎 / 팔꿈치 / 턱선 — 연속 클로즈업. 땀방울이 불빛에 반사된다.", narration: "\"리듬은 훈련이 아니다. 존재 방식이다.\"", caption: null }
            ]
          },
          {
            act: 3, title: "CLIMAX — \"The city belongs to those who move.\"",
            scenes: [
              { id: "6", location: "남산 오르막 — 푸시", desc: "경사 끝이 보인다. 러너가 속도를 올린다. 심박수 UI가 잠깐 빛난다.", narration: "\"지금 이 순간, 도시 전체가 너의 것이다.\"", caption: "\"Own the night.\"" },
              { id: "7", location: "정상 — 서울 파노라마", desc: "러너가 멈춘다. 새벽 도시 전경. 도시의 빛이 천천히 밝아온다.", narration: null, caption: "\"Seoul, 05:31 AM.\"" }
            ]
          },
          {
            act: 4, title: "CLOSING — \"Own the pace. Own the night.\"",
            scenes: [
              { id: "8", location: "나이키 로고 컷", desc: "검은 화면. 나이키 스우시가 천천히 나타난다.", narration: null, caption: "\"Own the pace. Own the night.\"\nNike Night Run." }
            ]
          }
        ],
        sound: "초반: 도시 ambient + 발소리 리듬\n중반: 베이스 라인이 달리기 케이던스에 맞춰 빌드업\n후반: 오케스트라 서지, 엔딩은 발소리 하나로 페이드아웃"
      },
      nextAction: "이 시나리오를 승인하거나 수정 방향을 지시하세요.",
    },
    {
      id: "storyboard",
      name: "Storyboard",
      status: "Blocked",
      summary: "시나리오 확정 후 컷별 이미지를 생성합니다.",
      reason: "Scenario 작업군이 아직 진행되지 않았습니다.",
      agents: ["Storyboard Composition Agent", "Image Generation Agent"],
      outputs: [
        { scene: 1, title: "신발 끈 클로즈업", act: "PROLOGUE", timecode: "00:00", desc: "새벽 불빛 아래 손이 신발 끈을 조인다", color: "#0f0f1a", accent: "#6B8FA3" },
        { scene: 2, title: "손목시계 — 04:58", act: "PROLOGUE", timecode: "00:04", desc: "시계 페이스 클로즈업, 새벽 시각 확인", color: "#0a0a14", accent: "#6B8FA3" },
        { scene: 3, title: "골목 가로등", act: "PROLOGUE", timecode: "00:08", desc: "러너 실루엣이 가로등 불빛 속에 서 있다", color: "#12101e", accent: "#9B7EB4" },
        { scene: 4, title: "로비 — 문이 열린다", act: "PROLOGUE", timecode: "00:14", desc: "경비원 고개 끄덕임, 새벽 공기가 밀려든다", color: "#0d0d18", accent: "#9B7EB4" },
        { scene: 5, title: "한강변 와이드샷", act: "BUILD", timecode: "00:22", desc: "드론샷 — 강을 따라 달리는 러너, 서울 스카이라인", color: "#0a1628", accent: "#7BA67E" },
        { scene: 6, title: "신호 대기 — 교차로", act: "BUILD", timecode: "00:35", desc: "빨간불, 제자리 달리기로 리듬 유지", color: "#1a1008", accent: "#C4704B" },
        { scene: 7, title: "신호 전환 — 폭발 출발", act: "BUILD", timecode: "00:38", desc: "초록불과 동시에 폭발적으로 달려나가는 순간", color: "#0a1a0a", accent: "#7BA67E" },
        { scene: 8, title: "터널 클로즈업 시리즈", act: "BUILD", timecode: "00:45", desc: "발 / 무릎 / 팔꿈치 — 빠른 컷 편집, 땀방울", color: "#111111", accent: "#6B8FA3" },
        { scene: 9, title: "남산 오르막 — 푸시", act: "CLIMAX", timecode: "01:02", desc: "경사 끝에서 속도 올리는 러너, 심박 UI 플래시", color: "#1a0a0a", accent: "#C4704B" },
        { scene: 10, title: "정상 — 서울 파노라마", act: "CLIMAX", timecode: "01:12", desc: "도시 전경이 펼쳐지며 빛이 밝아온다", color: "#0a1020", accent: "#9B7EB4" },
        { scene: 11, title: "나이키 스우시 등장", act: "CLOSING", timecode: "01:24", desc: "검은 화면 위 스우시가 천천히 나타난다", color: "#080808", accent: "#eeeeee" },
        { scene: 12, title: "엔딩 카피", act: "CLOSING", timecode: "01:27", desc: "Own the pace. Own the night. — Nike Night Run", color: "#060606", accent: "#C4704B" }
      ],
      nextAction: "Scenario 단계가 준비되면 콘티 생성이 가능합니다.",
    },
  ];
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
  const tasks = normalizeArray(state?.tasks ?? state?.taskGroups ?? state?.taskRail);
  const sourceTasks = tasks.length ? tasks : getDefaultTasks();
  return sourceTasks.map((task, index) => ({
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
  return state?.selectedTaskId ?? state?.activeTaskId ?? state?.taskId ?? null;
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

function renderStatusRail(tasks, selectedTaskId, state) {
  const subAgents = normalizeArray(state?.activeSubAgents);

  const taskItems = tasks.map(task => {
    const meta = getTaskStatusMeta(task.status);
    const isActive = task.id === selectedTaskId ? " is-active" : "";
    const agentCount = task.agents?.length ?? 0;
    const agentLabel = meta.indicator === "pulse" && agentCount > 0
      ? `<span class="status-rail-item__agents">${normalizeArray(task.agents).map(a => `· ${escapeHtml(a)}`).join("<br>")}</span>`
      : "";

    return `
      <button
        type="button"
        class="status-rail-item status-rail-item--${escapeHtml(meta.cls)}${isActive}"
        data-action="open-task-detail"
        data-task-id="${escapeHtml(task.id)}"
      >
        <div class="status-rail-item__left">
          ${renderStatusIndicator(meta.indicator)}
          <div class="status-rail-item__body">
            <span class="status-rail-item__name">${escapeHtml(task.name)}</span>
            ${agentLabel}
          </div>
        </div>
        <span class="status-rail-item__badge status-rail-item__badge--${escapeHtml(meta.cls)}">${escapeHtml(meta.label)}</span>
      </button>
    `;
  }).join("");

  const subAgentItems = subAgents.map(agent => `
    <div class="sub-agent-item">
      <span class="sub-agent-spinner"></span>
      <div class="sub-agent-body">
        <span class="sub-agent-name">${escapeHtml(agent.name)}</span>
        <span class="sub-agent-activity">${escapeHtml(agent.activity)}</span>
      </div>
    </div>
  `).join("");

  return `
    <aside class="workspace__rail workspace__rail--status" aria-label="Task status and agents">
      <div class="panel-heading">
        <p class="panel-kicker">Current Flow</p>
      </div>
      <div class="status-rail-list">
        ${taskItems || `<div class="empty-rail">작업 없음</div>`}
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

function renderApproveBar(state) {
  const gate = state?.approveGate;

  if (!gate) {
    return "";
  }

  const summary = gate.summary ?? state?.approveSummary ?? "";
  const detail = gate.detail ?? state?.approveDetail ?? "";

  if (!summary && !detail) {
    return "";
  }

  return `
    <section class="approve-bar" aria-label="Approval gate">
      <div class="approve-bar__copy">
        <p class="panel-kicker">Approve bar</p>
        ${summary ? `<strong>${escapeHtml(summary)}</strong>` : ""}
        ${detail ? `<span>${escapeHtml(detail)}</span>` : ""}
      </div>
      <div class="approve-bar__actions">
        <button type="button" class="button button--secondary">수정 요청</button>
        <button type="button" class="button button--primary">승인 →</button>
      </div>
    </section>
  `;
}

function renderComposer(state) {
  const composer = state?.composer ?? {};
  const placeholder = composer.placeholder ?? "Type a message to continue the workspace conversation.";

  return `
    <form class="composer">
      <label class="sr-only" for="workspace-composer-input">Workspace message</label>
      <input
        id="workspace-composer-input"
        type="text"
        value="${escapeHtml(composer.value ?? "")}"
        placeholder="${escapeHtml(placeholder)}"
      />
      <button type="button" class="button button--primary">${escapeHtml(composer.actionLabel ?? "Send")}</button>
    </form>
  `;
}

function renderFocusPanel(state) {
  const panel = state?.focusPanel ?? state?.selectedOutput ?? state?.context ?? {};
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

function renderStoryboardOutputs(outputs) {
  const cuts = Array.isArray(outputs) ? outputs : [];
  if (!cuts.length) return `<p class="task-detail-empty">생성된 컷이 없습니다.</p>`;

  // Group by act
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
          return `
            <div class="sb-cut">
              <div class="sb-cut__frame" style="background:${escapeHtml(cut.color ?? "#1a1a2e")}; border-color:${escapeHtml(cut.accent ?? "#6B8FA3")}30;">
                ${timecode}
                <div class="sb-cut__silhouette" style="border-color:${escapeHtml(cut.accent ?? "#6B8FA3")}50;"></div>
                <div class="sb-cut__glow" style="background:${escapeHtml(cut.accent ?? "#6B8FA3")};"></div>
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

function renderTaskDetailPopup(task, isOpen) {
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
    outputsHtml = `
      <div class="task-detail-card__section">
        <p class="panel-kicker">Generated Copy</p>
        <div class="copy-output-list">${renderCopyOutputs(task.outputs)}</div>
      </div>
    `;
  } else if (isScenario) {
    outputsHtml = `
      <div class="task-detail-card__section task-detail-card__section--scenario">
        <p class="panel-kicker">Generated Scenario</p>
        ${renderScenarioOutputs(task.outputs)}
      </div>
    `;
  } else if (isStoryboard) {
    outputsHtml = `
      <div class="task-detail-card__section task-detail-card__section--storyboard">
        <p class="panel-kicker">Storyboard Cuts</p>
        ${renderStoryboardOutputs(task.outputs)}
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
  const feedItems = normalizeArray(state?.feedItems ?? state?.messages);

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
        ${renderComposer(state)}
      </section>
      ${renderStatusRail(tasks, selectedTaskId, state)}
      ${renderTaskDetailPopup(selectedTask, state.taskDetailOpen)}
    </section>
  `;
}
