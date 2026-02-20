# WI-0130: Admin Organization Chart and HR History UI

## Background and Problem

People 도메인 API(조직/부서/직급/직원)는 존재하지만 관리자가 구조를 한눈에 파악하고 직원 프로필 변경 이력을
추적하는 UI가 부족했습니다. 운영자가 직원 배치 변경과 이력 확인을 같은 흐름에서 처리할 수 있도록
관리자 전용 디렉터리 화면을 추가합니다.

## Scope

### In Scope

- 관리자 신규 화면 `/admin/people`
  - 조직도 트리뷰 (조직 → 부서 → 직원)
  - 직원 검색/활성 필터
  - 직원 2인 비교(조직/부서/직급/활성/최근 업데이트)
  - 선택 직원 프로필 업데이트(부서/직급/활성)
  - 선택 직원 인사 이력 카드(생성/프로필 변경)
- People API 확장
  - `GET /api/people/employees/{employeeId}/history?limit=...`
  - 생성/프로필 변경 이력 최신순 조회
- 관리자 사이드바 네비게이션에 `/admin/people` 연결
- 관련 Contract/API/Test-cases 문서 갱신
- WI-0130 회귀 테스트 추가 및 e2e suite 반영

### Out of Scope

- 조직도 drag-and-drop 편집
- 직원 이력의 별도 DB 모델 추가
- 모바일 앱 네이티브 화면 구현

## User Scenarios

1. 관리자는 조직도 트리에서 직원을 선택하고 현재 배치 상태를 빠르게 확인한다.
2. 관리자는 직원 두 명의 프로필을 비교해 배치 차이를 판단한다.
3. 관리자는 선택 직원의 부서/직급/활성 상태를 변경하고 이력 카드에서 변경 내역을 즉시 확인한다.

## Data and API Changes

- 신규 API
  - `GET /people/employees/{employeeId}/history` (optional `limit`)
- DB 스키마 변경 없음
- 기존 `Employee` 업데이트/감사 로그 흐름 재사용

## Rollback Plan

- `/admin/people` 페이지 및 `/people/employees/{employeeId}/history` 엔드포인트 제거
- 관리자 네비게이션 링크 롤백
- 계약/DB 파괴적 변경이 없어 프론트/라우트 단위 롤백 가능
- Recovery target: 30m

## Definition of Done (DoD)

- [x] `/admin/people`에서 조직도 트리/직원 비교/인사 이력 조회가 동작한다.
- [x] 직원 프로필 업데이트 후 인사 이력에 변경 사항이 반영된다.
- [x] `GET /people/employees/{employeeId}/history` 계약 문서와 구현이 일치한다.
- [x] WI-0130 e2e 회귀 테스트가 추가되고 스위트에 연결된다.

