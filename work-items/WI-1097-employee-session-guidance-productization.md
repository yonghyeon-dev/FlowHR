# WI-1097: 직원 세션 안내 문구 제품화

## Background

- employee self-service 여러 화면에 로그인 세션 안내 문구가 화면별로 따로 박혀 있다.
- 일부 문구는 `/login` 경로와 production/runtime 같은 구현 관점을 직접 드러낸다.
- 온보딩 화면은 직원 번호 누락 안내도 별도 문구로 남아 있어 세션 복구 메시지 일관성이 깨진다.

## Scope

- employee self-service 전반의 로그인 세션 필요 안내를 공통 제품 문구로 통일한다.
- employee number 누락 안내를 공통 제품 문구로 통일한다.
- 복리후생, 가이드, 공지, 채용, 스케줄, 급여명세, 연말정산, 원천징수, 급여명세 수신확인 표면이 모두 같은 안내 체계를 사용하도록 정리한다.
- 회귀 가드를 추가해 raw production/login session 문구가 다시 들어오지 않게 막는다.

## Acceptance Criteria

- employee self-service 대상 화면에서 `프로덕션에서는 로그인 세션이 필요합니다`, `A login session is required in production` 같은 raw 문구가 남아 있지 않다.
- 공통 세션 안내는 `formatLoginSessionRequiredNotice`를 통해 노출된다.
- 온보딩의 직원 번호 누락 안내는 `formatEmployeeNumberRequiredNotice`를 통해 노출된다.
- 원천징수/급여명세 수신확인 copy 모듈도 같은 안내 문구를 사용한다.

## Files

- `src/lib/product-language.ts`
- `src/app/employee/page-helpers.ts`
- `src/app/employee/onboarding/page.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/employee-guide/useEmployeeGuideData.ts`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `src/components/scheduling/EmployeeScheduleBoard.tsx`
- `src/app/employee/payslips/page.tsx`
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/withholding-receipt/copy-runtime.ts`
- `src/components/payslip-receipts/copy.ts`
- `scripts/tests/e2e-wi1097-employee-session-guidance-productization.test.ts`

## Verification

- `npx tsx scripts/tests/e2e-wi1097-employee-session-guidance-productization.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run test:integration`
