# WI-1086: 직원 급여 세션 문구 제품화

## 배경

- 직원 급여명세 수신 확인, 원천징수영수증, 급여명세 조회 화면의 devtools 문맥에 여전히 raw 세션 조직/직원 식별자와 내부 세션 fallback 표현이 남아 있다.
- `WI-1085`에서 직원 대시보드와 연말정산 입력 화면의 세션 문맥은 정리했지만, 급여/원천징수 self-service 범위는 같은 기준으로 맞춰지지 않았다.

## 목표

- 직원 급여/원천징수 self-service 화면의 devtools 문맥에서 raw 세션 조직/직원 식별자와 userId fallback을 제거하고, 연결 상태와 로그인 계정 중심의 제품 문구로 통일한다.

## 범위

- `src/lib/product-language.ts`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/withholding-receipt/WithholdingReceiptInputPanel.tsx`
- `src/components/withholding-receipt/copy-runtime.ts`
- `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
- `src/components/payslip-receipts/copy.ts`
- `src/app/employee/payslips/page-view-filter-panel.tsx`
- `src/app/employee/payslips/page-locale-page-copy.ts`
- `scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `scripts/tests/e2e-wi1086-employee-session-copy-productization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 범위에 포함된 직원 급여/원천징수 화면의 devtools 세션 문맥이 raw 조직/직원/actor 식별자를 직접 노출하지 않는다.
2. 급여명세 조회 devtools 요약은 이메일 기반 로그인 계정, 권한, 작업 공간 상태, 직원 세션 상태만 보여주고 userId/organizationId/actorId fallback을 직접 노출하지 않는다.
3. 원천징수영수증/급여명세 수신 확인 copy는 `세션 조직/세션 직원` 대신 제품 문구를 사용한다.
4. 전용 회귀 가드가 추가되고 `test:integration`에 연결된다.
5. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
