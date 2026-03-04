# WI-0915 한국 표준 근로계약서 템플릿 시드

## Scope
- 계약 모듈에 조직별 기본 템플릿 시드 API를 추가한다.
- `POST /api/contracts/templates/seed-defaults` 호출 시 한국 표준 근로계약서 템플릿 3종을 생성한다.
- 이미 동일 템플릿이 존재하면 중복 생성하지 않고 스킵한다.
- employee 역할은 접근 불가(403)로 제한한다.

## API Behavior
- Endpoint: `POST /api/contracts/templates/seed-defaults`
- 권한:
  - 인증된 actor 필요
  - `admin` 역할만 허용
  - actor에 organizationId가 없으면 400 반환
- 시드 대상 템플릿(카테고리: `employment`, 상태: `ACTIVE`)
  - `정규직 근로계약서 (PERMANENT)`
  - `계약직 근로계약서 (CONTRACT)`
  - `인턴 근로계약서 (INTERN)`
- 각 템플릿 본문에는 다음 조항을 포함한다.
  - 근무 장소
  - 업무 내용
  - 근무 시간
  - 급여
  - 휴가
  - 계약 기간
- 응답에는 생성/스킵 요약과 시드 템플릿 목록을 반환한다.

## Implementation
- Added: `src/app/api/contracts/templates/seed-defaults/route.ts`
  - `readActor` 기반 인증/권한 검사(`admin` only)
  - 조직 범위 내 기존 템플릿 목록 조회
  - 이름 기준 중복 체크 후 미존재 템플릿만 생성
  - 재호출 시 idempotent 동작(`createdCount=0`, `skippedCount=3`)

## Test
- Added: `scripts/tests/e2e-wi0915-contract-template-seed.test.ts`
- 검증 항목:
  - 조직 셋업 후 seed-defaults 최초 호출 시 3개 생성
  - `GET /api/contracts/templates` 조회 시 3개 반환
  - 템플릿 본문에 필수 조항(근무 장소/업무 내용/근무 시간/급여/휴가/계약 기간) 포함 확인
  - 재호출 시 중복 생성 없이 3개 유지
  - employee 역할 호출 시 403 반환

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0915-contract-template-seed.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
