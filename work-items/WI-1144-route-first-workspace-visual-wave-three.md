# WI-1144: route-first 워크스페이스 시각 파동 3

## 배경

- `WI-1142`, `WI-1143`로 대표 admin/employee route-first 작업면 두 쌍에 공통 workspace visual primitive를 적용했다.
- 급여 문서와 배포 흐름은 여전히 기존 `page-header`, `kpi-strip`, `panel` 조합 위주라 visual system이 route-first 작업면 전체로 퍼졌다고 보기 어렵다.
- `employee payslips`와 `admin payslip delivery`는 상태/요약/작업 패턴이 분명해서 세 번째 visual seam으로 적합하다.

## 목표

- `employee payslips`와 `admin payslip delivery`에 공통 workspace shell, header, summary strip, section-card 규칙을 적용한다.
- payslip 문서/검색/상태 피드백 작업면이 같은 workspace summary/section 체계로 정렬된다.
- 기존 급여 문서/배포 로직은 바꾸지 않고 visual structure와 layout class만 공통화한다.

## 범위

- `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`
- `src/app/employee/payslips/page-view.tsx`
- `src/app/employee/payslips/page-view-filter-panel.tsx`
- `src/app/employee/payslips/page-view-detail-panel.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi1144-route-first-workspace-visual-wave-three.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- payslip compare/search/status logic 변경
- payslip print sheet 디자인 재작성
- payslip delivery API payload 변경
- mobile-specific payslip layout 재배치

## 완료 기준

1. `employee payslips`와 `admin payslip delivery`가 공통 workspace shell과 visual primitive class를 사용한다.
2. payslip filter/detail/search/status surface가 같은 workspace summary/section 체계로 정렬된다.
3. 관련 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫는다.
