# Production PoC State And Routing Design

## Goal

현재 mockup 중심 상태를 실제 런타임 상태 중심으로 재정리해, 프로젝트 목록 화면이 빈 상태에서 시작하고, Current flow가 실제 에이전트 실행 상태를 반영하며, 프로젝트/세션별 URL로 직접 진입과 브라우저 이동이 가능한 PoC로 끌어올린다.

## Scope

이번 설계는 다음 세 가지를 함께 해결한다.

1. 초기 진입 프로젝트 관리 화면에서 mock 프로젝트 제거
2. Current flow의 에이전트 상태를 실제 실행 상태와 연결
3. 페이지별 URL 분리 및 뒤로가기/앞으로가기 복원

서버 영속 저장소 추가, 인증, 다중 사용자 동기화는 범위에서 제외한다.

## Current Problems

### 1. Launcher가 데모 데이터에 묶여 있음

`mockup/scripts/data.js`와 `mockup/scripts/state.js`가 seed project/task/feed/session 데이터를 기본 상태로 주입한다. 첫 화면부터 예시 프로젝트가 노출되고, 새 프로젝트를 열기 전부터 워크스페이스 관련 상태가 일부 채워져 있어 실제 제품 경험과 다르다.

### 2. Current flow가 실제 실행과 느슨하게 연결됨

에이전트 상태 표시는 seed data와 일부 task 업데이트에 의존한다. 따라서 화면에 보이는 “작동 중” 상태가 실제 서버 단계와 완전히 일치하지 않을 수 있다.

### 3. URL이 상태를 표현하지 못함

현재 앱은 메모리 상태만 사용하므로 프로젝트/세션별 직접 링크가 없고, 새로고침이나 브라우저 이동 시 사용자가 보고 있던 맥락을 복원할 수 없다.

## Recommended Approach

초기 mock 상태를 비우고, 워크스페이스 상태는 프로젝트 진입 시점에만 생성한다. Current flow는 런타임 이벤트에서 파생된 `activeSubAgents`로 구성한다. 라우터는 브라우저 History API 기반의 경량 클라이언트 라우터로 구현해 `/`, `/projects/:projectId`, `/projects/:projectId/sessions/:sessionId`를 지원한다.

이 접근은 현재 PoC 구조를 유지하면서도 “보여주기용 시드 상태”를 제거하고 “실제 실행 상태”를 기준으로 UI를 설명 가능하게 만든다.

## URL Design

### Routes

- `/`
  - 프로젝트 관리 화면
  - 빈 프로젝트 목록과 생성 진입점만 보여준다
- `/projects/:projectId`
  - 프로젝트 워크스페이스 기본 진입점
  - 활성 세션이 없으면 해당 프로젝트의 첫 세션 또는 새 기본 세션으로 연결한다
- `/projects/:projectId/sessions/:sessionId`
  - 특정 프로젝트의 특정 세션 워크스페이스
  - 세션 패널 및 채팅 피드의 현재 맥락을 직접 링크 가능하게 한다

### Navigation Rules

- 새 프로젝트 생성 시 즉시 새 프로젝트와 새 기본 세션을 만들고 해당 세션 URL로 이동한다
- 프로젝트 카드 클릭 시 해당 프로젝트의 활성 세션 URL로 이동한다
- 세션 전환 시 URL도 함께 변경된다
- `popstate` 발생 시 URL을 기준으로 상태를 복원한다
- 존재하지 않는 프로젝트는 `/`로 보낸다
- 존재하지 않는 세션은 해당 프로젝트의 기본 세션으로 교정한다

## State Design

### Initial State

`createInitialState()`는 더 이상 seed project/task/feed/session/activeSubAgents를 기본으로 넣지 않는다.

초기 상태의 핵심은 다음과 같다.

- `projects: []`
- `currentView: "launcher"`
- `selectedProjectId: null`
- `sessions: []`
- `activeSessionId: null`
- `tasks: []`
- `feedItems: []`
- `activeSubAgents: []`

프로젝트별 워크스페이스 기본 상태는 프로젝트를 생성하거나 선택할 때 초기화한다.

### Project Workspace State

각 프로젝트는 최소한 다음을 가진다.

- `id`
- `name`
- `summary`
- `updatedAt`
- `isNewProject`

프로젝트 진입 시 아래 워크스페이스 상태가 준비된다.

- 기본 세션 1개
- 빈 또는 초기 시스템 안내 수준의 `feedItems`
- 비활성 `activeSubAgents`
- 기본 `tasks`
- 기본 `composer`

mock 결과 카드, demo approve gate, demo focus panel은 초기 진입 상태에서 제거한다. 실제 파이프라인을 시작한 뒤에만 생긴다.

## Real Agent Activity Design

### Principle

Current flow는 seed data를 렌더하지 않는다. 서버에서 실제로 발생한 파이프라인 이벤트만을 근거로 `activeSubAgents`를 갱신한다.

### Event Model

현재 SSE 흐름에 맞춰 두 가지 방식 중 더 안정적인 쪽을 택한다.

1. `task_update`와 단계 이벤트를 해석해 파생
2. 서버에서 명시적인 `agent_activity` 이벤트를 추가

이번 구현에서는 2번을 사용한다. 문자열 기반 추론보다 안정적이고, UI가 task 레이블 문구 변경에 깨지지 않는다.

### `agent_activity` Event Shape

서버는 에이전트가 시작/완료/대기/실패할 때 아래 이벤트를 emit 한다.

```json
{
  "type": "agent_activity",
  "agent": "research",
  "status": "running",
  "label": "Research Agent",
  "detail": "브리프와 웹검색 결과를 분석 중입니다."
}
```

허용 status:

- `running`
- `waiting`
- `completed`
- `failed`

### Client Behavior

- `running` 또는 `waiting` 상태는 `activeSubAgents`에 반영한다
- `completed` 또는 `failed`는 해당 에이전트를 active 목록에서 제거하거나 최종 상태로 짧게 표시한 뒤 제거한다
- 중복 이벤트는 동일 agent key 기준으로 병합한다
- 세션이 바뀌면 현재 세션의 active agent만 보인다

### Agent Mapping

지원 에이전트:

- `research`
- `copy`
- `scenario`
- `storyboard`

향후 agent registry가 늘어나도 같은 이벤트 인터페이스를 재사용한다.

## UI Changes

### Launcher

- mock 프로젝트 카드 제거
- 빈 상태 카피와 프로젝트 생성 액션만 노출
- 첫 프로젝트를 만들기 전까지 워크스페이스 관련 시각 요소는 나타나지 않는다

### Workspace Current Flow

- 실제 active agents만 노출
- 아무도 작동 중이 아니면 idle/empty 상태 카피 표시
- agent label과 detail은 서버 이벤트 기반으로 갱신

### Sessions

- 세션 선택은 URL과 동기화된다
- 새 프로젝트 첫 진입 시 입력창 포커스는 유지한다

## Error Handling

- URL에 없는 프로젝트 ID가 오면 launcher로 복귀
- URL에 없는 세션 ID가 오면 프로젝트 기본 세션으로 교정
- agent_activity 이벤트 누락 시에도 task/feed 렌더는 계속 동작해야 한다
- SSE 중단 시 active agents를 모두 비우고 reconnect 또는 다음 실행 전까지 idle 상태로 둔다

## Testing Strategy

### State Tests

- 초기 상태에 프로젝트/세션/task/feed mock 데이터가 없는지 확인
- 새 프로젝트 생성 시 새 세션과 함께 workspace 상태가 초기화되는지 확인
- 세션 선택 시 URL 대상과 state가 일치하는지 확인

### Routing Tests

- `/` 진입 시 launcher 렌더
- `/projects/:projectId` 진입 시 해당 프로젝트 workspace 렌더
- `/projects/:projectId/sessions/:sessionId` 진입 시 해당 세션 선택
- 잘못된 project/session URL 교정
- `popstate`로 이전 화면 복원

### Renderer Tests

- Current flow가 seedActiveSubAgents 없이 빈 상태를 올바르게 렌더하는지 확인
- `agent_activity running` 수신 시 실제 에이전트가 표시되는지 확인
- `completed` 또는 `failed` 수신 시 Current flow에서 제거되는지 확인

### Integration Tests

- 채팅 시작 시 research agent가 표시되는지 확인
- research 완료 후 copy agent로 전환되는지 확인
- research clarification 대기 시 waiting 상태가 표시되는지 확인

## Implementation Notes

- 기존 state shape를 최대한 유지하되 seed 의존만 제거한다
- 라우터는 별도 경량 모듈로 분리해 `main.js`의 이벤트 핸들링과 분리한다
- `activeSubAgents` 갱신도 상태 전용 helper로 분리해 렌더러와 결합하지 않는다
- 서버 SSE 이벤트 추가는 기존 `task_update`, `feed`, `approve_gate` 계약을 깨지 않는 방향으로 한다

## Out Of Scope

- 서버 영속 DB 저장
- 새로고침 후 전체 프로젝트 목록 복원
- 사용자별 프로젝트 분리
- SEO 또는 서버 사이드 라우팅

## Success Criteria

- 앱 첫 진입 시 mock 프로젝트가 보이지 않는다
- 실제 파이프라인 실행 중인 에이전트만 Current flow에 나타난다
- 프로젝트/세션마다 고유 URL이 존재하고, 브라우저 이동으로 복원된다
- 기존 채팅 파이프라인, 연구 추가 정보 요청, 스트리밍 버블 UX가 회귀하지 않는다
