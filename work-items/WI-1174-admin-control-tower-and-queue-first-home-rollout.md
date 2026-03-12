# WI-1174: 관리자 컨트롤 타워 홈 개편

`/admin` 홈을 요약 카드 모음이 아니라 queue-first customer-admin operating station으로 전환한다.

## Background

- V2 셸은 들어왔지만 `/admin` 홈은 아직 pre-V2 hub 흔적이 강하다.
- 실제 운영자는 카드 탐색보다 오늘 처리할 대기열, 예외, lane entry를 먼저 봐야 한다.
- `flowhr_V2/flowhr-ui/admin/home.html`의 control tower 방향을 현재 앱 데이터와 route-first 구조에 맞춰 흡수해야 한다.

## Scope

1. 관리자 홈 상단을 V2 control tower summary row로 재배치한다.
2. 오늘의 대기열을 approvals / payroll / contracts 중심의 queue-first 카드로 재구성한다.
3. 운영 레인 entry를 people / operations / payroll / settings lane 기준으로 재배치한다.
4. org snapshot, exception monitor, documents/payroll watch를 side context rail로 정리한다.
5. 관련 current V2 regression guard를 추가하고 bundle에 연결한다.

## Non-Goals

- admin 전체 라우트를 한 WI에서 전부 리디자인하는 것
- domain API나 summary 계산 로직을 바꾸는 것
- ops 전용 surface를 고객용 home에 다시 노출하는 것

## Acceptance Criteria

1. `/admin`이 summary-card catalog보다 queue-first control tower로 보인다.
2. 오늘의 우선 처리, 대기열, 운영 레인, side context가 한 화면에서 명확히 분리된다.
3. 관리자 홈은 shared V2 workspace primitives 위에서 동작한다.
4. 신규 WI-1174 current regression guard가 추가되고 `ci-e2e-mvp-current`에 연결된다.
5. `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e:mvp:current`, `npm run test:integration:current`가 green이다.
