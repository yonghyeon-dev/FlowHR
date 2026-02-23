# WI-0289: Contract Signature Evidence Read/Download

## Background

WI-0279에서 서명 증거 해시는 저장되지만, 서명 완료 문서의 증거 아티팩트를 조회/다운로드하는 API와
직원 UI 액션이 없어 실사용 검증과 감사 대응이 제한되었습니다.

## Scope

### In Scope

- API 추가: `GET /api/contracts/documents/{documentId}/signature-evidence`
  - query: `format=json|text` (default `json`)
  - signed 문서에 대해서만 반환
  - 반환 값: 파일명, content-type, `contentSha256`, 콘텐츠
- 권한 가드:
  - 문서 소유 employee 또는 계약 관리 권한 actor만 접근 허용
  - 비소유 employee 접근 시 `403`
- 직원 계약함 UI에 증거 읽기/다운로드 액션 추가
- contracts spec(`api.yaml`, `contract.yaml`, `test-cases.md`) 버전 `0.2.0` 반영

### Out of Scope

- 외부 공인전자서명 검증
- 증거 보관 스토리지 분리/보존주기 정책
- 대량 다운로드 배치

## Validation

- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd exec tsx scripts/tests/e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test.ts`
- `python scripts/ci/check_contracts.py`

