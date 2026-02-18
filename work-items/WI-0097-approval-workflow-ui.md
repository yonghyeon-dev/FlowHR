# WI-0097: 관리자 승인 워크플로 UI 고도화

## Background and Problem

관리자 승인함은 현재 건별 버튼 클릭 중심이라, 대기 건수가 쌓일 때 처리 속도가 급격히 떨어집니다.
SaaS 운영 관점에서는 "여러 건을 선택해 한 번에 승인/반려"하는 기본 워크플로가 필요합니다.

## Scope

### In Scope

- `/admin#approvals`에 승인 워크플로 UI 추가
  - 출퇴근/휴가 큐에서 다건 선택(checkbox)
  - 선택 건 일괄 승인
  - 선택 건 일괄 반려(사유 입력 연동)
  - 큐별 선택 개수/대기 개수 표시

### Out of Scope

- 결재선(다단 승인) 엔진
- 위임 결재/전결 정책
- 범용 문서 결재 양식

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- (CI) `npm run test:integration`
- (CI) `npm run test:e2e:mvp`

