# WI-0105: Payroll KR Baseline 누진세/보험상한 고도화

## Background and Problem

현재 `statutory_kr_baseline` 모드는 단일 비율 계산만 지원합니다. 이 방식은 누진세 구간과 보험 산정 상한 같은 실무 규칙을 반영하기 어렵습니다.

## Scope

### In Scope

- `statutory_kr_baseline` 입력 확장:
  - `incomeTaxBrackets` (누진세 구간)
  - `nationalPensionCapKrw`
  - `healthInsuranceCapKrw`
  - `employmentInsuranceCapKrw`
- 누진세/보험상한 계산 로직 추가
- 관리자 급여 UI에서 법정공제 프리뷰 모드 및 상한 입력 지원
- e2e 회귀 테스트 추가

### Out of Scope

- 연말정산
- 실제 신고/납부 연동
- 법정 최신 고시값 자동 동기화

## User Scenarios

1. 급여 담당자가 누진세 구간을 전달하면 구간별 누진 계산으로 소득세가 산출된다.
2. 보험 상한을 전달하면 각 보험료가 상한 기반 산정 금액을 초과하지 않는다.
3. 관리자가 관리자 화면에서 총지급/법정공제 프리뷰 모드를 선택해 즉시 비교한다.

## Payroll Accuracy and Calculation Rules

- taxableBaseKrw = max(grossPayKrw - nonTaxableIncomeKrw, 0)
- 누진세 모드:
  - incomeTaxBrackets는 upToKrw 오름차순이어야 함
  - 마지막 구간은 open-ended(upToKrw=null) 이어야 함
  - 각 구간 금액에 rate를 적용한 합을 소득세로 계산
- 보험 상한:
  - 보험별 contributionBase = min(taxableBaseKrw, capKrw) (cap 미지정 시 taxableBaseKrw 사용)
- 라운딩:
  - 구성 항목별 원 단위 반올림 후 합산

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| 법정공제 프리뷰 실행 | Allow | Deny | Deny | Allow | N/A |
| 급여 확정 | Allow | Deny | Deny | Allow | N/A |
| 명세서 조회(본인) | Deny | Deny | Allow | Deny | N/A |

## Data Changes

- Schema 변경 없음
- Migration IDs: none
- Backward compatibility:
  - 기존 flat-rate baseline 입력은 그대로 동작
  - 신규 필드는 optional

## API and Event Changes

- Endpoint:
  - POST /payroll/runs/preview-with-deductions
- Additive payload:
  - statutory.incomeTaxBrackets
  - statutory.nationalPensionCapKrw
  - statutory.healthInsuranceCapKrw
  - statutory.employmentInsuranceCapKrw
- Existing event payload additive 확장:
  - payroll.deductions.calculated.v1

## Test Plan

- Unit:
  - 누진세 구간 계산
  - 보험 상한 적용 계산
- Integration:
  - statutory payload validation (구간 정렬/마지막 open-ended)
- Regression:
  - 기존 WI-0101 flat-rate baseline 계산 유지
- Authorization:
  - payroll_operator/admin 외 접근 차단

## Observability and Audit Logging

- Audit:
  - payroll.deductions_calculated (taxMethod, contributionBases, caps 포함)
- Metrics:
  - payroll_deductions_preview_latency_ms 재사용

## Rollback Plan

- Feature flags:
  - FLOWHR_PAYROLL_KR_BASELINE_V1 비활성화 시 신규 계산 경로 즉시 차단
- DB rollback:
  - 없음
- Recovery target:
  - 15m

## Definition of Ready (DoR)

- [x] 요구사항이 계산 규칙과 함께 명확함
- [x] 계약/테스트 영향 범위가 정의됨
- [x] 롤백 전략이 정의됨

## Definition of Done (DoD)

- [x] service/schema/UI 반영
- [x] WI-0105 e2e 테스트 통과
- [x] contract/api/test-cases/rfc 갱신
- [x] QA Spec Gate / Code Gate 통과
