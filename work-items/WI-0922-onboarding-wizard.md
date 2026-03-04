# WI-0922 첫 로그인 조직 온보딩 위자드

## Scope
- 첫 로그인 관리자 대상 조직 온보딩 위자드(`/onboarding`)를 추가한다.
- 조직 초기 설정 저장 API(`/api/organizations/[organizationId]/setup`)를 추가한다.
- 온보딩 미완료 admin을 `/onboarding`으로 강제 이동하도록 `middleware.ts`를 확장한다.
- 온보딩 API 권한/유효성 회귀 테스트를 추가한다.

## Implemented
- `src/app/(protected)/onboarding/page.tsx`
  - 한국어 3단계 위자드 UI 추가
  - 1단계: 회사명, 사업자등록번호, 업종, 대표자명
  - 2단계: 기본 근무 시작/종료 시간, 근무일, 시간대
  - 3단계: 완료 안내 및 `/admin` 이동
  - 로그인 세션에서 조직 정보를 조회하고, 이미 완료된 조직이면 `/admin`으로 리다이렉트

- `src/app/api/organizations/[organizationId]/setup/route.ts`
  - `POST` 엔드포인트 추가
  - `admin` 역할만 허용
  - 필수 필드 검증 및 400/403/404 처리
  - 조직 레코드 온보딩 필드 업데이트
  - `isOnboardingComplete`를 `true`로 저장
  - `organization.onboarding.completed` 감사 로그 적재

- `src/middleware.ts`
  - 보호 경로에 `/onboarding` 매처 추가
  - 세션 검증 후 `app_metadata.role`/`organization_id` 판별
  - admin + 온보딩 미완료: `/admin` 접근 시 `/onboarding` 리다이렉트
  - admin + 온보딩 완료: `/onboarding` 접근 시 `/admin` 리다이렉트

- 데이터 모델/스토어 확장
  - `prisma/schema.prisma`의 `Organization`에 온보딩 필드 추가
  - `prisma/migrations/202603050003_wi0922_onboarding_wizard/migration.sql` 추가
  - `src/features/shared/data-access.ts`
    - `OrganizationEntity` 온보딩 필드 확장
    - `UpdateOrganizationInput` 및 `organizations.update` 추가
  - `src/features/shared/memory-data-access.ts`
    - 조직 생성 기본값/업데이트 구현 반영
  - `src/features/shared/prisma-data-access.ts`
    - 조직 온보딩 필드 매핑 및 `organizations.update` 구현 반영

- 테스트
  - `scripts/tests/e2e-wi0922-onboarding-wizard.test.ts` 추가
  - 검증 항목:
    - setup 엔드포인트 파일/POST 핸들러 존재
    - admin 허용, employee 403
    - 필수 필드 누락 시 400

## Verification
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npx tsx scripts/tests/e2e-wi0922-onboarding-wizard.test.ts`

## Data Changes
- Prisma model: `Organization`
- Migration: `202603050003_wi0922_onboarding_wizard`
