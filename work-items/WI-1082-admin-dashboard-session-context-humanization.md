# WI-1082: 관리자 대시보드 세션 문맥 표면 정리

## 배경

- 관리자 온보딩, KPI, 인사 필터, 결재 실행 조건 패널이 devtools 모드에서 세션 조직 ID와 세션 액터 ID를 그대로 코드 블록으로 노출한다.
- 운영 점검용 문맥은 남겨야 하지만, 사용자 표면에서는 raw 식별자 대신 연결 상태 중심 문구로 보여주는 편이 맞다.

## 목표

- 관리자 대시보드 계열 핵심 패널에서 세션 조직/세션 액터 raw ID 노출을 제거하고, 연결 상태 기반 제품 문구로 치환한다.

## 범위

- `src/lib/product-language.ts`
- `src/components/admin-onboarding/AdminOnboardingSections.tsx`
- `src/components/admin-onboarding/AdminOnboardingDashboard.tsx`
- `src/components/admin-kpi/AdminKpiSections.tsx`
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `src/app/admin/people/page-view-directory-filters-panel.tsx`
- `src/app/admin/approval-executions/page-sections-work-conditions.tsx`
- `scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `scripts/tests/e2e-wi1082-admin-dashboard-session-context-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 온보딩/KPI/인사 필터/결재 실행 조건 패널의 devtools 문맥이 raw ID 대신 연결 상태 문구를 노출한다.
2. 온보딩 조직 목록이 devtools 모드에서도 조직 ID 꼬리표를 붙이지 않는다.
3. 관련 회귀 가드가 새 표면을 검증한다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
