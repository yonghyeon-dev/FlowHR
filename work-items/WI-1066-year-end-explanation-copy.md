# WI-1066: 연말정산 설명형 라벨 정리

## 배경

- `WI-1065` 이후에도 연말정산과 원천징수영수증 화면에는 설명형 라벨 수준의 기술 용어가 남아 있다.
- 대표적으로 `입력 벡터 해시`, `사유 코드`, `정산 해시` 같은 표현이 운영자와 직원 화면에 그대로 노출된다.

## 목표

- 연말정산/원천징수 표면의 설명형 라벨을 판단/기준 중심 제품 용어로 정리한다.
- 내부식 표현 없이도 운영자가 카드와 요약 항목을 이해할 수 있게 만든다.

## 범위

- `src/components/payroll-year-end/copy.ts`
- `src/components/withholding-receipt/copy-runtime.ts`
- `scripts/tests/e2e-wi1066-year-end-explanation-copy.test.ts`

## 수용 기준

1. 연말정산 카드 라벨에서 `벡터 해시`, `사유 코드` 표현이 제거된다.
2. 원천징수영수증 요약 라벨에서 `정산 해시` 표현이 제거된다.
3. `npm run typecheck`, 전용 WI 테스트, `npm run test:integration`, `npm test`가 통과한다.
