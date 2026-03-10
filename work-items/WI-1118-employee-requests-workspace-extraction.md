# WI-1118: 직원 요청 워크스페이스 추출

## 배경

`WI-1117`에서 `/employee/requests` route seam은 만들었지만, 실제 요청 상태 확인과 재제출 후속 조치 UI는 아직 Today 홈의 hidden-subpage 섹션에 남아 있었습니다.

그 결과:

- 직원 홈이 요약 화면이 아니라 과도하게 많은 작업면을 품고 있었고
- request 관련 deep-link가 홈 내부 섹션 존재 여부에 계속 의존했으며
- `/employee/requests`는 실제 업무 route가 아니라 링크 모음에 가까웠습니다.

## 목표

- 요청 피드백, 통합 검색, 타임라인, 재제출 후보 검토를 `/employee/requests` 아래의 실제 작업면으로 옮깁니다.
- Today 홈은 요약과 우선 처리, 근태/휴가 입력 폼만 남기고 request-heavy UI는 전용 route로 분리합니다.
- 기존 request focus deep-link는 새 route로 자연스럽게 넘기고, 재제출 handoff는 query 기반으로 이어집니다.
- route-first 구조 전환을 실제 화면 구현까지 연결합니다.

## 범위

### In Scope

- `/employee/requests` 아래 request monitoring / resubmit workspace 구현
- 직원 홈에서 request feedback / resubmit panels 제거
- request 관련 focus deep-link를 `/employee/requests`로 라우팅
- 재제출 후보를 홈 draft 폼으로 넘기는 query handoff 추가
- 정적 회귀 가드 추가

### Out of Scope

- 근태/휴가 입력 폼 자체의 대규모 재설계
- benefits / documents / payslips IA 개편
- admin shell 구조 변경
