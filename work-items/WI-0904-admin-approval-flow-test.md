# WI-0904: 관리자 승인 흐름 통합 테스트

## 구현 범위
- `scripts/tests/e2e-wi0904-admin-approval-flow.test.ts` 추가
- `e2e-wi0001.test.ts` 패턴 유지
  - `node:assert/strict`
  - 테스트 런타임 환경변수 설정
  - `actorHeaders`, `jsonRequest`, `readJson` 헬퍼
  - `memoryDataAccess`, `resetMemoryDataAccess`
  - `tsx` 실행 가능한 `run()` 패턴

## 시나리오
1. 조직/직원 2명(직원A, 직원B)/관리자 메모리 데이터 셋업
2. 직원A `POST /api/attendance/records` 출근 기록 생성(201)
3. 직원B `POST /api/leave/requests` 휴가 신청 생성(201)
4. 직원 역할 승인 시도 2건 차단 확인
  - 직원A `POST /api/attendance/records/[recordId]/approve` -> 403
  - 직원B `POST /api/leave/requests/[requestId]/approve` -> 403
5. 관리자 `POST /api/attendance/records/[recordId]/approve` 승인(200)
6. 관리자 `POST /api/leave/requests/[requestId]/approve` 승인(200)
7. 직원A `POST /api/attendance/records` 추가 기록 생성(201)
8. 관리자 `POST /api/attendance/records/[recordId]/reject` 반려(200)
9. GET 조회로 상태 확인
  - 직원A `GET /api/attendance/records?...&state=APPROVED` -> 승인 상태 확인
  - 직원A `GET /api/attendance/records?...&state=REJECTED` -> 반려 상태 확인
  - 직원B `GET /api/leave/requests?...&state=APPROVED` -> 승인 상태 확인

## 검증 포인트 반영
- 관리자 역할(`manager`)로 승인/반려 동작 정상 검증
- 직원 역할(`employee`) 승인 시도 `403` 검증
- 승인 후 `APPROVED` 상태 전이 검증
- 반려 후 `REJECTED` 상태 전이 검증

## 실행 확인
- `npx.cmd tsx scripts/tests/e2e-wi0904-admin-approval-flow.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
