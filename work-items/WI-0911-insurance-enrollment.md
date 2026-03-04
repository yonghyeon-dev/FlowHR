# WI-0911 4대보험 가입 상태 추적

## Scope
- 직원별 4대보험 가입 상태 조회/업데이트 Admin API 추가:
  - `GET /api/admin/insurance/enrollment?employeeId=...`
  - `POST /api/admin/insurance/enrollment`
- 파일:
  - `src/app/api/admin/insurance/enrollment/route.ts`
  - `src/features/shared/data-access.ts`
  - `src/features/shared/memory-data-access.ts`
  - `src/features/shared/prisma-data-access.ts`
- 권한:
  - 두 엔드포인트 모두 `admin` 역할만 허용
  - 비-admin 호출은 `403`
- 데이터 모델:
  - 보험 유형: `NPS | NHI | EI | WCI`
  - 상태: `ENROLLED | NOT_ENROLLED | PENDING`
  - `enrolledAt`은 선택값이며 응답에서는 값이 있을 때만 반환
- 저장소:
  - `DataAccess`에 `insuranceEnrollments` 스토어 추가
  - `memoryDataAccess`에 `insuranceEnrollments` 컬렉션(Map) 추가
  - `prismaDataAccess`에도 동일 스토어 추가 (현재는 파일 내부 메모리 상태 사용)

## API Behavior
- `GET`:
  - `employeeId` 쿼리 필수
  - 직원 존재/조직 소속 확인 후 가입 상태 목록 반환
  - 응답: `{ employeeId, enrollments: [...] }`
- `POST`:
  - body: `{ employeeId, type, status, enrolledAt? }`
  - 동일 `employeeId + type` 키 기준으로 생성/업데이트(upsert)
  - 응답: `{ employeeId, enrollment }`

## Test
- 신규 e2e:
  - `scripts/tests/e2e-wi0911-insurance-enrollment.test.ts`
- 검증 항목:
  - 조직/직원 셋업
  - `POST` 4건으로 NPS/NHI/EI/WCI 등록
  - `GET` 4건 반환 및 type/status/enrolledAt 확인
  - `employee` 역할 호출 시 `403` 확인

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0911-insurance-enrollment.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
