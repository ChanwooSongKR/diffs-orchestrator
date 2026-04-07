# Runtime State Cleanup Design

## Goal

현재 PoC를 runtime 중심 구조에 맞게 정리해, 더 이상 사용하지 않는 mock seed 데이터와 레거시 state shape, demo fallback 렌더링을 제거한다.

## Scope

이번 정리는 다음을 포함한다.

1. 초기 launcher/workspace용 대규모 seed 데이터 제거
2. 현재 렌더/이벤트 흐름에서 쓰이지 않는 레거시 state 필드 제거
3. `render-workspace.js`의 demo fallback 제거
4. 테스트를 현재 runtime 계약 기준으로 정리

영속 저장, 서버 구조 변경, UI 기능 추가는 범위에서 제외한다.

## Current Problems

### 1. `data.js`에 더 이상 쓰지 않는 demo 데이터가 남아 있음

초기 launcher가 빈 상태로 바뀌었는데도 `seedProjects`, `seedTasks`, `seedFeedItems`, `seedFocusPanel`, `seedApproveGate`, `seedComposer`, `seedActiveSubAgents`, `seedSessions`가 파일에 그대로 남아 있다. 이 데이터는 현재 앱의 실제 진입 경로와 맞지 않는다.

### 2. `state.js`에 레거시 상태가 남아 있음

`agents`, `messages`, `selectedOutput`, `workspaceBadge`, `workspaceStatus`, `agentModalOpen`, `approveGate` 같은 필드는 현재 렌더와 이벤트 흐름에서 핵심적으로 사용되지 않는다. `createLegacyAgent`, `createLegacyMessages`도 같은 이유로 정리 대상이다.

### 3. `render-workspace.js`가 실제 state 없이도 demo를 그리도록 되어 있음

`getDefaultTasks()` 같은 fallback은 지금 구조와 어긋난다. 현재는 프로젝트를 열 때 `state.tasks`가 명시적으로 생성되므로, 렌더러가 별도의 demo 상태를 품을 필요가 없다.

## Recommended Approach

상태 계약을 현재 runtime 흐름 기준으로 다시 정의한다. 즉 launcher는 빈 상태에서 시작하고, workspace는 프로젝트 진입 시 생성되며, 렌더러는 오직 현재 state만 소비하도록 단순화한다.

이 접근은 코드량을 줄이고, UI가 실제 동작과 다른 “숨은 기본값”을 가지는 문제를 제거한다.

## Design

### `mockup/scripts/data.js`

유지:

- `createEmptyLauncherCollections()`

제거:

- 모든 `seed*` export

이 파일은 더 이상 demo 데이터 저장소가 아니라, launcher 초기화용 최소 helper만 가지는 방향으로 정리한다.

### `mockup/scripts/state.js`

유지:

- 프로젝트 생성/선택
- 세션 생성/선택
- feed/task/pipeline/history 관련 상태
- active agent 상태

제거:

- `createLegacyAgent`
- `createLegacyMessages`
- `agents`
- `messages`
- `selectedOutput`
- `workspaceBadge`
- `workspaceStatus`
- `agentModalOpen`
- `approveGate`

정리 후 state는 아래 성격만 가진다.

- launcher state
- workspace interaction state
- pipeline state
- artifact history state

### `mockup/scripts/render-workspace.js`

제거:

- `getDefaultTasks()`
- task rail demo fallback
- 오래된 state alias fallback 중 현재 구조와 무관한 부분

유지:

- 현재 task/session/feed/pipelineContext 기반 렌더
- approve gate 렌더
- storyboard/scenario/copy 상세 렌더

렌더러는 “state가 없으면 demo를 만든다”가 아니라 “state가 비어 있으면 빈 상태를 보여준다” 쪽으로 정리한다.

### Tests

업데이트 대상:

- `tests/state.test.js`
- `tests/renderer-smoke.test.js`

검증 포인트:

- 더 이상 seed 데이터에 의존하지 않는지
- workspace 렌더가 `state.tasks` 없이 demo task를 만들지 않는지
- 기존 pipeline/streaming/agent activity 동작이 회귀하지 않는지

## Error Handling

- `state.tasks`가 비어 있으면 task rail과 detail은 빈 상태로 렌더한다
- `selectedTaskId`가 없으면 task detail popup은 열리지 않는다
- `focusPanel`이 비어 있어도 context rail은 안전하게 렌더한다

## Success Criteria

- `data.js`에서 demo seed export가 제거된다
- `state.js`에서 레거시 state helper와 unused 필드가 제거된다
- `render-workspace.js`가 demo 기본 task 없이 동작한다
- 전체 테스트가 통과한다
