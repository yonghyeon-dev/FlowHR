# WI-0910 온보딩 자동 태스크 생성 API

## Scope
- 신규 admin 온보딩 태스크 API 추가:
  - `POST /api/admin/onboarding/tasks`
  - `GET /api/admin/onboarding/tasks?employeeId=...`
  - `PATCH /api/admin/onboarding/tasks/[taskId]`
- 파일:
  - `src/app/api/admin/onboarding/tasks/route.ts`
  - `src/app/api/admin/onboarding/tasks/[taskId]/route.ts`
- 권한:
  - 세 엔드포인트 모두 `admin`만 허용
  - 비-admin은 `403`
- 생성 동작:
  - `employeeId`를 받아 기본 온보딩 태스크 5개를 `PENDING`으로 생성
  - 기본 항목:
    1. 근로계약서 서명
    2. 급여계좌 등록
    3. 4대보험 가입 확인
    4. 사내 시스템 계정 발급
    5. 부서 OT 참석
- 데이터 계층:
  - `DataAccess`에 `onboardingTasks` 스토어 추가
  - `memoryDataAccess`에 `onboardingTasks` 컬렉션(Map) 추가
  - `prismaDataAccess`도 동일 인터페이스를 맞추기 위해 온보딩 태스크 스토어 구현

## Test
- 신규 e2e:
  - `scripts/tests/e2e-wi0910-onboarding-tasks.test.ts`
- 검증 항목:
  - 조직/직원 셋업
  - `POST` 호출 시 기본 태스크 5개 생성 확인
  - `GET` 호출 시 5개 반환 확인
  - `PATCH` 호출 시 1개 태스크 `COMPLETED` 변경 확인
  - `employee` 역할 호출 시 `403` 확인

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0910-onboarding-tasks.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
