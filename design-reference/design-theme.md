# DIFFS — Creative Agent Studio

## Design Theme: "Creative Warmth"

이 프로젝트의 모든 UI는 아래 디자인 규칙을 따른다. 기능 추가/수정 시 이 규칙을 반드시 적용할 것.

### Reference

- `design-reference/index.html` — 디자인 프로토타입. 새 컴포넌트를 만들 때 이 파일의 스타일을 참조할 것.

### Color System

Warm white 기반, warm black 텍스트. 포인트 컬러는 최소한으로.

```
Surface (배경):
  --surface-deep:    #F7F4F0   (앱 배경)
  --surface-base:    #FDFCFA   (메인 콘텐츠)
  --surface-raised:  #FFFFFF   (카드, 팝업)
  --surface-overlay: #F2EEE8   (hover, 오버레이)
  --surface-sidebar: #F0ECE6   (사이드바, 패널)

Text (텍스트):
  --text-primary:    #2C2825   (본문)
  --text-secondary:  #6B6560   (보조)
  --text-tertiary:   #9E9790   (힌트, 시간)

Accent (포인트 — 아주 적게 사용):
  --accent-primary:  #C4704B   (CTA 버튼, 활성 상태만)

Agent Colors (에이전트 구분 — 연하게 사용):
  --agent-research:  #6B8FA3   (리서치)
  --agent-visual:    #9B7EB4   (비주얼/시안)
  --agent-scenario:  #7BA67E   (시나리오)
  --agent-director:  #C4704B   (디렉터)
```

### Typography

세리프 디스플레이 + 산세리프 본문 + 손글씨 라벨.

```
Display (제목, 채널명):  'DM Serif Display', Georgia, serif
Body (본문, UI):         'DM Sans', -apple-system, sans-serif
Hand (라벨, 태그, 힌트): 'Caveat', cursive
```

- 제목: DM Serif Display, 자연스럽고 클래식한 느낌
- 본문: DM Sans, 깔끔하고 읽기 좋게
- 손글씨: Caveat, 섹션 타이틀이나 상태 라벨에 사용. 딱딱함을 풀어주는 역할

### Tone & Feel

- **따뜻하고 부드럽게**: 순수 흰색(#FFF)이나 순수 검정(#000) 사용 금지. 항상 warm tint 적용
- **포인트 컬러 최소화**: accent-primary는 CTA 버튼, 전송 버튼, active 상태에만. 그 외에는 회색 계열
- **손그림 느낌 유지**: 에이전트 아바타는 SVG 손그림 캐릭터. 아이콘도 가능하면 유기적으로
- **딱딱하지 않게**: border-radius는 넉넉하게 (12~24px), 그림자는 연하고 따뜻하게
- **여백 넉넉하게**: 요소 간 간격을 충분히 두어 답답하지 않은 레이아웃
- **애니메이션은 부드럽게**: ease-out 커브 사용, 빠르지 않게 (0.25~0.5s)

### Agent Characters

각 에이전트는 고유한 손그림 SVG 캐릭터를 가진다:
- **Research**: 안경 쓴 캐릭터 (분석적, 차분)
- **Visual**: 베레모 + 붓 든 캐릭터 (예술적, 감성적)
- **Scenario**: 곱슬머리 + 연필 든 캐릭터 (서사적, 활발)
- **Director**: 단정한 머리 캐릭터 (리더십, 따뜻)

새 에이전트 추가 시 같은 스타일(원형 배경 + 간단한 SVG 얼굴 + 소품)로 만들 것.

### Component Patterns

- **카드**: `surface-raised` 배경 + `border-default` 테두리 + `shadow-sm` + `radius-lg(18px)`
- **에이전트별 카드**: 해당 에이전트 컬러의 8% 배경 + 15% 테두리
- **입력창**: `radius-xl(24px)` 둥근 필 형태, 포커스 시 accent 테두리 + 은은한 glow
- **사이드바 항목**: 활성 시 흰색 배경 + 그림자 (accent 컬러 아님)
- **진행률 바**: 4px 높이, 에이전트 컬러, 둥근 끝
- **타이핑 인디케이터**: 부드럽게 바운스하는 점 3개

### 금지 사항

- 순수 검정/흰색 배경 사용 금지
- 진한 그라디언트나 네온 컬러 금지
- 각진 모서리 (border-radius: 0) 금지
- 딱딱한 대문자 라벨 (Caveat 손글씨 사용)
- 과한 포인트 컬러 사용 금지 — accent는 화면당 1~2곳만
