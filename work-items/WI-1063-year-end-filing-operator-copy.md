# WI-1063: 연말정산 신고 운영 문구 정리

## 배경

- `WI-1062`로 연말정산/신고 화면의 raw 해시, ID, 코드 노출은 줄였지만, 운영자가 실제로 보는 입력 라벨과 필터 요약에는 아직 기술 중심 문구가 남아 있다.
- 특히 신고 화면에서 `ACK`, `hash`, `submissionId` 성격의 표현이 그대로 남아 있어 제품 언어와 운영 문구가 어긋난다.

## 목표

- 연말정산 신고 화면의 입력 라벨, 필터 요약, 상태 문구를 운영자 중심 제품 언어로 바꾼다.
- 내부 키 이름이나 기술 용어가 다시 사용자 표면에 새지 않도록 회귀 가드를 추가한다.

## 범위

- `src/components/payroll-year-end-filing/copy.ts`
- `src/components/payroll-year-end-filing/submission-state-helpers.ts`
- `scripts/tests/e2e-wi1063-year-end-filing-operator-copy.test.ts`

## 수용 기준

1. 신고 화면 입력/필터 라벨에서 `ACK`, `hash`, `submissionId` 같은 기술 중심 문구가 운영자 문구로 치환된다.
2. 활성 필터 요약이 `ackStatus=...`, `settlementHash=...`, `sort=...` 같은 내부 키 기반 문자열을 노출하지 않는다.
3. `npm run typecheck`, 신규 WI-1063 테스트, `npm run test:integration`, `npm test`가 통과한다.
