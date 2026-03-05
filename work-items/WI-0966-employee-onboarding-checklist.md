# WI-0966: 직원 본인용 온보딩 체크리스트

## 배경

직원이 본인 온보딩 태스크를 직접 확인하고 완료 처리할 수 있는 전용 화면이 필요하다.  
관리자 온보딩 태스크 API를 재사용하되, 직원은 본인 `employeeId` 범위에서만 조회/완료가 가능해야 한다.

## 범위

### 포함

- `src/app/employee/onboarding/page.tsx` 신규 추가
- 본인 `employeeId`로 `GET /api/admin/onboarding/tasks?employeeId=...` 호출
- 태스크 완료 체크(`PATCH /api/admin/onboarding/tasks/[taskId]`, `status: COMPLETED`)
- 진행률(완료/전체 + 프로그레스바) 표시
- 직원 네비게이션에 온보딩 체크리스트 링크 추가
- `GET/PATCH /api/admin/onboarding/tasks` 권한에 직원 본인 접근 허용
- 회귀 테스트 추가(`scripts/tests/e2e-wi0966-employee-onboarding-checklist.test.ts`)

### 제외

- 온보딩 태스크 데이터 모델/스키마 변경
- 관리자 온보딩 대시보드 기능 확장
- 신규 온보딩 API 라우트 추가

## 구현 요약

- `src/app/employee/onboarding/page.tsx`
  - 세션 기반으로 본인 `employeeId`와 토큰을 사용해 태스크 목록을 조회한다.
  - 태스크 체크박스로 완료 처리(`COMPLETED`)를 수행한다.
  - 완료 수량/전체 수량 및 퍼센트 진행률을 프로그레스바로 표시한다.
  - 로딩/오류/빈 목록 상태를 한국어 메시지로 노출한다.

- `src/app/api/admin/onboarding/tasks/route.ts`
  - `GET` 권한을 확장해 `admin` 또는 `employee 본인(employeeId===actor.id)` 요청을 허용한다.
  - `POST`는 기존과 동일하게 `admin`만 허용한다.

- `src/app/api/admin/onboarding/tasks/[taskId]/route.ts`
  - `PATCH` 권한을 확장해 `admin` 또는 `employee 본인(task.employeeId===actor.id)`을 허용한다.
  - 본인 외 직원 태스크 수정은 `403`으로 차단한다.

- `src/app/employee/layout.tsx`, `src/lib/i18n/messages.ts`
  - 직원 메뉴에 `/employee/onboarding` 링크 및 다국어 키(`employee.nav.onboardingChecklist`)를 추가한다.

- `scripts/tests/e2e-wi0966-employee-onboarding-checklist.test.ts`
  - 신규 페이지/내비게이션/문구 키/작업 문서 존재를 정적 검증한다.
  - 직원 본인 `GET/PATCH` 허용, 타 직원 접근 차단, 직원 `POST` 차단을 동작 검증한다.

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npx tsx scripts/tests/e2e-wi0966-employee-onboarding-checklist.test.ts`

## 검증 시나리오

- 직원 계정으로 `/employee/onboarding` 진입 시 본인 온보딩 태스크 목록이 표시된다.
- 미완료 태스크 체크 시 완료 상태로 변경되고 진행률이 즉시 갱신된다.
- 본인 태스크가 없으면 빈 상태 메시지가 보인다.
- 직원이 다른 직원 `employeeId`로 조회/완료 요청 시 `403`이 반환된다.

## 롤백 계획

- `src/app/employee/onboarding/page.tsx`를 제거한다.
- `src/app/employee/layout.tsx`, `src/lib/i18n/messages.ts`의 온보딩 메뉴 항목을 제거한다.
- `src/app/api/admin/onboarding/tasks/*` 권한 검사를 관리자 전용으로 되돌린다.
- `scripts/tests/e2e-wi0966-employee-onboarding-checklist.test.ts`를 제거한다.

## ADR

- Not required: 기존 온보딩 태스크 API의 권한 범위 조정과 직원 UI 추가이며, 신규 아키텍처 패턴/교차 도메인 계약/보안 경계 변경은 없다.
