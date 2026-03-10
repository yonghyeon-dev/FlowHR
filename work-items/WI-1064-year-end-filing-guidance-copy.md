# WI-1064: 연말정산 신고 안내 문구 정리

## 배경

- `WI-1062`, `WI-1063` 이후에도 연말정산/신고 실패 안내에는 아직 `ACK`, `acknowledged`, `hash mismatch` 같은 기술 중심 표현이 남아 있다.
- 신고 워크플로 요약 패널도 영어 고정 문구로 남아 있어 한국어 운영 화면과 톤이 어긋난다.

## 목표

- 연말정산/신고 실패 안내를 운영자 기준의 제품 언어로 정리한다.
- 신고 워크플로 요약 패널을 로케일 기반 문구로 바꾸고 영어 하드코딩을 제거한다.

## 범위

- `src/components/payroll-year-end/request-failure-guidance.ts`
- `src/components/payroll-year-end-filing/FilingExportBundle.tsx`
- `scripts/tests/e2e-wi1064-year-end-filing-guidance-copy.test.ts`

## 수용 기준

1. 연말정산/신고 실패 안내에 `ACK`, `acknowledged`, `hash mismatch` 같은 내부 용어가 그대로 노출되지 않는다.
2. 신고 워크플로 요약 패널이 한국어 로케일에서 한국어 운영 문구를 사용한다.
3. `npm run typecheck`, 신규 WI-1064 테스트, `npm run test:integration`, `npm test`가 통과한다.
