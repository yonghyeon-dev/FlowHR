# WI-0126: Employee Self-Service Leave Calendar + Ops Isolation Reset

## Background and Problem

최근 WI-0120~0125는 연차촉진 운영 기능을 확장하면서 기본 관리자/직원 여정 대비 ops 성격의 기능 노출이 커졌습니다.
로드맵 우선순위를 다시 맞추기 위해, 운영 도구는 `/ops/*`로 격리하고 직원 셀프서비스 화면의 실제 사용성을 강화합니다.

## Scope

### In Scope

- 연차촉진 UI 노출 경로를 `admin` 기본 네비게이션에서 제거하고 `ops`로 격리:
  - `/ops/leave-promotion` 신규 노출
  - `/admin/leave-promotion`은 dev-tools 환경에서만 `ops` 경로로 리다이렉트
  - `/admin` 기본 사이드바에서 연차촉진 링크 제거
- 직원 포털(`/employee`) 셀프서비스 UX 강화:
  - 잔여/사용 연차 시각화(usage meter)
  - 월간 휴가 캘린더 패널(승인/대기 표시)
  - 출퇴근 정정 입력 보조(최근 기록 불러오기)
  - 직원 네비게이션에 휴가 캘린더 앵커 추가
- WI-0126 회귀 테스트 추가 및 e2e 스위트 연결.

### Out of Scope

- 연차촉진 재시도 스케줄러/백오프 정책 자동화.
- webhook/email-template 채널 추가 확장.
- 신규 cron/GitHub Actions 운영 인프라 추가.

## User Scenarios

1. 관리자는 기본 `/admin` 여정에서 운영성 연차촉진 화면을 보지 않고, 필요 시 dev-tools에서 `/ops/leave-promotion`으로 접근한다.
2. 직원은 `/employee`에서 잔여 연차 상태를 시각적으로 확인하고, 월간 휴가 캘린더로 승인/대기 일정을 빠르게 파악한다.
3. 직원은 최근 출퇴근 기록을 폼에 불러와 정정 요청 입력 단계를 줄인다.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| `/ops/leave-promotion` 접근(dev-tools) | Allow | Deny | Allow | Deny | Allow |
| 직원 휴가 캘린더/연차 시각화 조회 | Deny | Deny | Deny | Allow | Deny |

## Data and API Changes

- DB 스키마 변경 없음.
- API 계약 변경 없음.
- UI 라우팅/노출 정책 변경만 포함.

## Rollback Plan

- 필요 시 `/admin/leave-promotion` 직접 페이지 렌더링 방식으로 되돌립니다.
- 직원 캘린더/시각화 UI는 제거해도 기존 휴가 신청/취소 플로우에는 영향이 없습니다.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] 연차촉진 UI가 `/ops/leave-promotion`으로 격리되고 `/admin` 기본 네비게이션에서 제거된다.
- [x] `/admin/leave-promotion` 경로는 dev-tools 조건에서만 `ops` 경로로 리다이렉트된다.
- [x] `/employee`에 휴가 캘린더/연차 시각화/최근 출퇴근 기록 불러오기 UX가 반영된다.
- [x] WI-0126 테스트가 추가되고 e2e suite에 연결된다.
