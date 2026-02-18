# FlowHR 작업 가이드 (Assistant Notes)

이 레포는 **FlowHR (HR SaaS)** 입니다. 다른 프로젝트 규칙(예: FlowConsult)을 섞지 않습니다.

## 제품 우선순위 (No Over-Engineering)

- SaaS 핵심 여정:
  - 직원: 출퇴근, 휴가 신청/취소, 내 스케줄, 급여 명세서 조회
  - 관리자: 승인 대기함(출퇴근/휴가), 근태 집계, 급여 프리뷰/확정, 휴가 정책
- UI/고객 가치가 없는 “운영 관제 심화” 기능은 MVP 범위 밖입니다.
  - 필요한 경우에도 `feature flag` + `/ops/*` 경로로만 제공하고, 기본 UI에서는 숨깁니다.

## Dev Tools 노출 규칙

- `/ops/*`는 개발/운영 검증용 도구입니다.
- `NEXT_PUBLIC_FLOWHR_DEV_TOOLS=true`일 때만 UI에서 링크를 노출합니다.

## 단일 소스 문서(SSoT)

- Work Item: `work-items/`
- Contract/Spec: `specs/*/(contract.yaml, api.yaml, test-cases.md)`
- Roadmap: `ROADMAP.md`
- QA Gate: `qa/gate.checklist.md`
- RACI/승인: `docs/raci.md`
- 데이터 소유권: `docs/data-ownership.md`
- Break-glass(긴급 머지): `docs/break-glass.md`

## Git / PR 규칙

- 브랜치: `feature/WI-xxxx-*`
- PR 템플릿 체크리스트(Work Item/Spec/ADR/QA)를 채우지 않으면 CI에서 차단됩니다.
- Required checks 통과 전 병합하지 않습니다.

## Windows/PowerShell 인코딩 메모

PowerShell에서 `Get-Content`로 UTF-8 파일을 읽을 때 한글이 깨지면 아래처럼 읽습니다.

```powershell
Get-Content path\\to\\file.md -Raw -Encoding UTF8
```

