# WI-0903: 직원 일상 흐름 통합 테스트

## 구현 범위
- `scripts/tests/e2e-wi0903-employee-daily-flow.test.ts` 추가
- `e2e-wi0001.test.ts` 패턴 유지
  - `node:assert/strict`
  - 테스트 런타임 환경변수 설정
  - `actorHeaders`, `jsonRequest`, `readJson` 헬퍼
  - `memoryDataAccess`, `resetMemoryDataAccess`
  - `tsx` 실행 가능한 `run()` 패턴

## 시나리오
1. 조직/직원 메모리 데이터 셋업 (직원 2명)
2. `POST /api/attendance/records` 출근(201)
3. `GET /api/attendance/records` 내 목록 조회(200)
4. `PATCH /api/attendance/records/[recordId]` 퇴근(200)
5. `POST /api/leave/requests` 연차 신청(내일~모레, 201)
6. `GET /api/leave/requests` 내 휴가 목록에서 `PENDING` 확인(200)
7. `POST /api/leave/requests/[requestId]/cancel` 취소(200)
8. `GET /api/leave/requests` 취소 후 `CANCELED` 확인(200)

## 검증 포인트 반영
- 단계별 HTTP 상태코드 검증
- 응답 바디 핵심 필드(`id`, `employeeId`, `state`, 날짜 필드 등) 검증
- `employee` 역할만 사용
- 다른 직원 리소스 접근 `403` 부정 테스트 1건 포함

## 실행 확인
- `npx.cmd tsx scripts/tests/e2e-wi0903-employee-daily-flow.test.ts`
  - 결과: `e2e-wi0903-employee-daily-flow.test passed`
- `npm.cmd run typecheck`
  - 결과: 통과
- `npm.cmd run lint`
  - 결과: 통과 (기존 경고만 존재, 신규 오류 없음)
