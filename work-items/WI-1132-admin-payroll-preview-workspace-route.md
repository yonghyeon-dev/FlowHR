# WI-1132: 관리자 급여 프리뷰 작업면 경로 승격

## 배경

관리자 급여 프리셋 공유 링크는 아직 `/admin?...#payroll` 형태로 대시보드 모놀리스 상태에 의존합니다.

- 공유 링크가 전용 작업면이 아니라 관리자 홈의 내부 섹션으로 향합니다.
- 급여 프리뷰/확정 업무는 이미 `payrollAndFiling` lane 아래의 전용 워크스페이스 구조로 정리 중인데, 공유 재생만 예외로 남아 있습니다.
- 이 상태는 route-first IA와 맞지 않고, 대시보드 의존을 계속 유지하게 만듭니다.

## 목표

1. 급여 프리셋 공유 링크의 재생 목적지를 `/admin/payroll-close/preview-builder` 안정 경로로 승격합니다.
2. 새 경로에서 기존 급여 프리뷰/확정 폼과 공유 쿼리 재적용 흐름을 그대로 사용할 수 있게 만듭니다.
3. `/admin?...#payroll` 기대값을 가진 정적 가드와 문서도 새 경로 기준으로 맞춥니다.

## 범위

### In Scope

- `src/app/admin/payroll-close/preview-builder/page.tsx`
- `src/app/admin/payroll-close/preview-builder/page-client.tsx`
- `src/components/payroll/PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx`
- `scripts/tests/e2e-wi0231-payroll-kr-preset-payload-copy-share-ux.test.ts`
- 신규 회귀 가드 추가

### Out of Scope

- 급여 마감 콘솔 전체 재설계
- 관리자 대시보드 급여 패널 제거
- payrollAndFiling 내비게이션 전체 개편

## 완료 기준

1. 급여 프리셋 공유 링크가 `/admin/payroll-close/preview-builder?...`를 사용합니다.
2. 새 경로가 급여 프리뷰/확정 패널과 공유 쿼리 재적용 흐름을 제공합니다.
3. 기존 `/admin?...#payroll` 정적 기대값이 제거됩니다.
4. 신규 회귀 가드가 추가되고 `npm run typecheck`, `npm run test:integration`을 통과합니다.
