export const seedProjects = [
  {
    id: "project-seed-1",
    type: "project",
    name: "Nike Night Run",
    updatedAt: "10 minutes ago",
    updatedRank: 2,
    status: "Drafts ready",
    statusKind: "ready",
    thumbnail: {
      eyebrow: "Draft Cluster",
      title: "Night Run",
      description: "Urban pace / blue energy",
      tone: "night"
    }
  },
  {
    id: "project-seed-2",
    type: "project",
    name: "Samsung Home AI Launch",
    updatedAt: "2 hours ago",
    updatedRank: 1,
    status: "Waiting for concept decision",
    statusKind: "waiting",
    thumbnail: {
      eyebrow: "Concept Review",
      title: "Home AI",
      description: "Warm interior / product reveal",
      tone: "home"
    }
  },
  {
    id: "project-seed-3",
    type: "project",
    name: "Lotte Autumn Campaign",
    updatedAt: "Yesterday",
    updatedRank: 3,
    status: "Storyboard in progress",
    statusKind: "running",
    thumbnail: {
      eyebrow: "Storyboard",
      title: "Autumn Mood",
      description: "Editorial cut / seasonal tone",
      tone: "autumn"
    }
  }
];

export const seedTasks = [
  {
    id: "research",
    name: "Research",
    status: "Running",
    summary: "시장, 경쟁사, 레퍼런스 맥락을 수집하는 중입니다.",
    reason: "브랜드와 카테고리 정보가 아직 충분하지 않습니다.",
    agents: ["External Research Agent", "Internal Reference Search Agent", "Memory Agent"],
    outputs: ["Competitor snapshot", "Reference cluster"],
    nextAction: "리서치 완료 후 카피 생성을 요청하거나 바로 넘어갈 수 있습니다."
  },
  {
    id: "copy",
    name: "Copy",
    status: "Ready",
    summary: "비교 가능한 카피 3안이 준비되었습니다.",
    reason: "초기 방향 탐색용 카피가 생성 완료되었습니다.",
    agents: ["Copy Draft Workers", "Copy Curator", "Memory Agent"],
    outputs: [
      { headline: "Own the pace. Own the night.", desc: "러닝의 리듬을 도시의 에너지로 연결한 직관적 카피" },
      { headline: "Your stride. Your city.", desc: "개인의 달리기를 도시 공간과 연결하는 소속감 중심 카피" },
      { headline: "Move before the city wakes.", desc: "새벽 러닝의 고독과 자유를 포착한 감성적 카피" }
    ],
    nextAction: "하나를 선택하거나 두 안을 조합하라고 지시할 수 있습니다."
  },
  {
    id: "scenario",
    name: "Scenario",
    status: "Ready",
    summary: "시나리오 1안이 생성되었습니다. 검토 후 방향을 확정하세요.",
    reason: "선택된 카피 'Own the pace. Own the night.' 기반으로 시나리오가 작성되었습니다.",
    agents: ["Scenario Writer Agent", "Shot Planning Agent"],
    outputs: {
      title: "NIKE NIGHT RUN",
      subtitle: "「THE PACE: From Routine to Ritual」",
      duration: "1분 30초",
      tone: "Wieden+Kennedy식 Quiet Power — 절제, 리듬, 그리고 압도적 존재감.\n(Nike 'Find Your Greatness', Apple 'Shot on iPhone' 결합 톤)",
      acts: [
        {
          act: 1,
          title: "PROLOGUE — \"Before the city wakes.\"",
          scenes: [
            {
              id: "1",
              location: "새벽 4시 58분, 도심 골목",
              desc: "러너의 발이 신발 끈을 조인다. 손목시계 — 04:58. 골목에 가로등 불빛만.",
              narration: "\"대부분의 사람들이 잠든 시간.\"",
              caption: "\"Before the city decides who you are.\""
            },
            {
              id: "2",
              location: "엘리베이터 문이 열린다",
              desc: "러너가 로비로 나선다. 경비원이 고개를 끄덕인다. 문이 열리며 새벽 공기.",
              narration: null,
              caption: null
            }
          ]
        },
        {
          act: 2,
          title: "BUILD — \"The city as a track.\"",
          scenes: [
            {
              id: "3",
              location: "한강변 — 와이드샷",
              desc: "러너 한 명이 강을 따라 달린다. 멀리 서울 스카이라인. 카메라는 드론으로 서서히 당겨진다.",
              narration: "\"길은 정해져 있지 않다.\"",
              caption: "\"Own the pace.\""
            },
            {
              id: "4",
              location: "교차로 — 신호 대기",
              desc: "빨간불. 러너가 제자리 달리기로 박자를 유지한다. 신호 바뀌자 폭발적으로 출발.",
              narration: null,
              caption: "\"Don't stop. Adapt.\""
            },
            {
              id: "5",
              location: "터널 구간 — 클로즈업 시리즈",
              desc: "발 / 무릎 / 팔꿈치 / 턱선 — 연속 클로즈업. 땀방울이 터널 불빛에 반사된다.",
              narration: "\"리듬은 훈련이 아니다. 존재 방식이다.\"",
              caption: null
            }
          ]
        },
        {
          act: 3,
          title: "CLIMAX — \"The city belongs to those who move.\"",
          scenes: [
            {
              id: "6",
              location: "남산 오르막 — 푸시",
              desc: "경사 끝이 보인다. 러너가 속도를 올린다. 심박수 UI가 화면 구석에 잠깐 빛난다.",
              narration: "\"지금 이 순간, 도시 전체가 너의 것이다.\"",
              caption: "\"Own the night.\""
            },
            {
              id: "7",
              location: "정상 — 서울 파노라마",
              desc: "러너가 멈춘다. 새벽 도시 전경. 도시의 빛이 천천히 밝아온다. 숨을 고른다.",
              narration: null,
              caption: "\"Seoul, 05:31 AM.\""
            }
          ]
        },
        {
          act: 4,
          title: "CLOSING — \"Own the pace. Own the night.\"",
          scenes: [
            {
              id: "8",
              location: "나이키 로고 컷",
              desc: "검은 화면. 나이키 스우시가 천천히 나타난다. 그 위로 카피.",
              narration: null,
              caption: "\"Own the pace. Own the night.\"\nNike Night Run."
            }
          ]
        }
      ],
      sound: "초반: 도시 ambient + 발소리 리듬\n중반: 베이스 라인이 달리기 케이던스에 맞춰 빌드업\n후반: 브레이크 없는 오케스트라 서지, 엔딩은 발소리 하나로 페이드아웃"
    },
    nextAction: "이 시나리오를 승인하거나 수정 방향을 지시하세요."
  },
  {
    id: "storyboard",
    name: "Storyboard",
    status: "Blocked",
    summary: "시나리오 확정 후 컷별 이미지를 생성합니다.",
    reason: "Scenario 작업군이 아직 진행되지 않았습니다.",
    agents: ["Storyboard Composition Agent", "Image Generation Agent"],
    outputs: [
      { scene: 1, title: "신발 끈 클로즈업", act: "PROLOGUE", timecode: "00:00", desc: "새벽 불빛 아래 손이 신발 끈을 조인다", color: "#0f0f1a", accent: "#6B8FA3", aspectRatio: "16/9" },
      { scene: 2, title: "손목시계 — 04:58", act: "PROLOGUE", timecode: "00:04", desc: "시계 페이스 클로즈업, 새벽 시각 확인", color: "#0a0a14", accent: "#6B8FA3", aspectRatio: "16/9" },
      { scene: 3, title: "골목 가로등", act: "PROLOGUE", timecode: "00:08", desc: "러너 실루엣이 가로등 불빛 속에 서 있다", color: "#12101e", accent: "#9B7EB4", aspectRatio: "16/9" },
      { scene: 4, title: "로비 — 문이 열린다", act: "PROLOGUE", timecode: "00:14", desc: "경비원 고개 끄덕임, 새벽 공기가 밀려들다", color: "#0d0d18", accent: "#9B7EB4", aspectRatio: "16/9" },
      { scene: 5, title: "한강변 와이드샷", act: "BUILD", timecode: "00:22", desc: "드론샷 — 러너가 강을 따라 달린다, 서울 스카이라인", color: "#0a1628", accent: "#7BA67E", aspectRatio: "16/9" },
      { scene: 6, title: "신호 대기 — 교차로", act: "BUILD", timecode: "00:35", desc: "빨간불, 제자리 달리기로 리듬 유지", color: "#1a1008", accent: "#C4704B", aspectRatio: "16/9" },
      { scene: 7, title: "신호 전환 — 폭발 출발", act: "BUILD", timecode: "00:38", desc: "초록불과 동시에 폭발적으로 달려나가는 순간", color: "#0a1a0a", accent: "#7BA67E", aspectRatio: "16/9" },
      { scene: 8, title: "터널 클로즈업 시리즈", act: "BUILD", timecode: "00:45", desc: "발 / 무릎 / 팔꿈치 — 빠른 컷 편집, 땀방울", color: "#111111", accent: "#6B8FA3", aspectRatio: "16/9" },
      { scene: 9, title: "남산 오르막 — 푸시", act: "CLIMAX", timecode: "01:02", desc: "경사 끝에서 속도 올리는 러너, 심박 UI 플래시", color: "#1a0a0a", accent: "#C4704B", aspectRatio: "16/9" },
      { scene: 10, title: "정상 — 서울 파노라마", act: "CLIMAX", timecode: "01:12", desc: "도시 전경이 펼쳐지며 빛이 밝아온다, 숨을 고르는 러너", color: "#0a1020", accent: "#9B7EB4", aspectRatio: "16/9" },
      { scene: 11, title: "나이키 스우시 등장", act: "CLOSING", timecode: "01:24", desc: "검은 화면 위 스우시가 천천히 나타난다", color: "#080808", accent: "#ffffff", aspectRatio: "16/9" },
      { scene: 12, title: "엔딩 카피", act: "CLOSING", timecode: "01:27", desc: "Own the pace. Own the night. — Nike Night Run", color: "#060606", accent: "#C4704B", aspectRatio: "16/9" }
    ],
    nextAction: "Scenario 단계가 준비되면 콘티 생성이 가능합니다."
  }
];

export const seedFeedItems = [
  {
    id: "feed-1",
    type: "user_message",
    text: "러닝 브랜드 광고 방향을 탐색해줘"
  },
  {
    id: "feed-2",
    type: "system_message",
    text: "먼저 리서치와 드래프트 생성을 진행할 수 있습니다."
  },
  {
    id: "feed-3",
    type: "status",
    text: "Research running"
  },
  {
    id: "feed-4",
    type: "result_card",
    title: "Drafts Ready",
    body: "드래프트 3안이 준비되었습니다. 하나를 선택하거나 조합하도록 지시할 수 있습니다."
  },
  {
    id: "feed-5",
    type: "system_message",
    text: "현재 컨셉 승인을 기다리고 있습니다. 승인하거나 수정 방향을 지시하세요."
  }
];

export const seedFocusPanel = {
  eyebrow: "Current focus",
  title: "Selected Draft",
  body: "Own the pace. Own the night.",
  meta: [
    { label: "Stage", value: "Draft selection" },
    { label: "State", value: "Waiting for user" }
  ]
};

export const seedApproveGate = {
  summary: "Approve bar",
  detail: "현재 기준안을 승인하거나 수정 요청을 남길 수 있습니다."
};

export const seedComposer = {
  value: "",
  placeholder: "A와 B를 합쳐서 더 대담하게 가줘",
  actionLabel: "Send"
};

export const seedActiveSubAgents = [
  { id: "sub-1", name: "External Research Agent", task: "research", activity: "나이키 경쟁사 키워드 검색 중" },
  { id: "sub-2", name: "Reference DB Search", task: "research", activity: "레퍼런스 클러스터 인덱싱 중" },
  { id: "sub-3", name: "Memory Agent", task: "research", activity: "브랜드 히스토리 임베딩 저장 중" }
];

export const seedSessions = [
  {
    id: "session-1",
    label: "Session 1",
    timestamp: "오늘 오전 10:14",
    preview: "러닝 브랜드 광고 방향을 탐색해줘",
    status: "active",
    messageCount: 5
  },
  {
    id: "session-2",
    label: "Session 2",
    timestamp: "오늘 오전 9:02",
    preview: "Night Run 컨셉으로 더 어둡게 가줘",
    status: "done",
    messageCount: 12
  },
  {
    id: "session-3",
    label: "Session 3",
    timestamp: "어제 오후 4:47",
    preview: "초기 리서치 — 나이키 경쟁사 분석",
    status: "done",
    messageCount: 8
  }
];
