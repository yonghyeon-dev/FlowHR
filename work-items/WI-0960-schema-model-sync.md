# WI-0960: Prisma 스키마와 메모리 모델 동기화 검증

## 배경

`prisma/schema.prisma`와 `src/features/shared/data-access.ts`의 Entity 타입, 그리고
`src/features/shared/memory-data-access.ts` 구현 간에 필드 의미가 어긋나면
memory 기반 e2e 결과가 Prisma 기반 동작과 달라질 수 있다.

특히 `NoticeNotificationQueue`는 스키마에 `employeeId` 컬럼이 없는데,
memory 구현은 `employeeId`를 저장/필터링하고 있어 구현 편차가 발생한다.

## 범위

### 포함

- 스키마 모델/Entity 타입/메모리 구현 비교 검증 e2e 추가
- `noticeNotifications` memory 구현을 Prisma 스키마 동작에 맞게 조정
- 영향 받는 기존 e2e 기대값 정합성 보정

### 제외

- Prisma 스키마 변경
- `data-access.ts` Entity 타입 구조 변경
- API 계약 변경

## 구현 요약

- `src/features/shared/memory-data-access.ts`
  - `noticeNotifications.create`에서 `employeeId`를 저장하지 않고 `null`로 고정.
  - `noticeNotifications.list`에서 `employeeId` 필터를 적용하지 않도록 변경.
  - 결과적으로 memory 동작이 Prisma store/스키마(`NoticeNotificationQueue`)와 동일해짐.

- `scripts/tests/e2e-wi0960-schema-model-sync.test.ts` (신규)
  - `DataAccess` 키와 스키마 모델 매핑 커버리지를 검증.
  - 스키마 scalar 필드와 Entity 필드 차이를 전수 비교하고, 허용된 변환 차이만 통과:
    - `Employee.active` (파생 필드)
    - `ApprovalLineTemplate.approvalStagesJson <-> approvalStages` (JSON 구조화)
    - `NoticeNotificationQueue.employeeId` (호환 필드)
    - `AuditLog.id` (Entity 비노출)
  - runtime 검증으로 memory `noticeNotifications`가 `employeeId`를 저장/필터링하지 않음을 확인.

- `scripts/tests/e2e-wi0914-payslip-notification.test.ts`
  - notice queue `employeeId` 기대값을 스키마 정합 기준(`null`)으로 수정.

## 테스트

- `npx tsx scripts/tests/e2e-wi0914-payslip-notification.test.ts`
- `npx tsx scripts/tests/e2e-wi0960-schema-model-sync.test.ts`

## ADR

- Not required: 동작 정합성/테스트 보강 중심의 비파괴 변경이며, 아키텍처 경계/보안/크로스도메인 계약 변경이 없음.
