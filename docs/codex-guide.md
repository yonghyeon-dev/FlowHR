# Codex 작업 가이드

> Codex 세션 시작 시 반드시 읽을 것.

---

## 금지 규칙 (MUST NOT)

### 1. UX 적층 금지
- 동일 페이지에 "phase N+1" 형태의 WI를 반복 투입하지 않는다.
- 한 페이지에 3개 이상 연속 WI가 적용되면 중단.

### 2. 디렉토리 중첩 금지
- 라우트 경로 6단계 초과 금지, URL 파라미터 5개 초과 금지.

### 3. I18N One-Shot Guard (WI-0522)
- Korean i18n cleanup must be completed as a single sweep, then locked by CI.
- If i18n-only WIs are queued three times in a row, stop and switch to feature WIs.
- i18n WI 3개 연속 시 중단, 기능 WI로 전환.

### 4. 헬퍼 추출 연속 금지
- 헬퍼 추출 WI 3개 연속 시 중단. 서비스 파일 줄 수가 줄지 않으면 추출 금지.

### 5. 딥링크/소스컨텍스트 연속 금지
- 딥링크/소스컨텍스트 WI 5개 연속 시 중단.

### 6. 배치당 기능 WI 50% 의무
- 한 배치에서 기능 WI가 50% 미만이면 배치 거부.

### 7. Ops 과잉 구현 금지
- Ops 기능에 5개 이상 WI 연속 투입 금지.

### 8. 예측/인사이트 사전 구현 금지
- 백엔드 데이터 충분히 쌓인 후 대시보드 단위로 제공.

---

## Contract Governance CI (MUST)

migration 추가 시 반드시:
1. `work-items/WI-XXXX.md`에 `## Data Changes` 섹션 (migration ID + 테이블명)
2. `specs/{domain}/contract.yaml`의 `db_changes.migrations`에 ID 등록
3. `contract.yaml` version bump (patch 단위)
4. `specs/{domain}/api.yaml` version을 contract.yaml과 동기화

---

## PR Template CI (MUST)

### 체크박스 규칙
- Required Checklist + Quality Gate 항목 전부 `[x]`
- 체크박스 라벨 뒤에 괄호/추가 텍스트 금지 (regex: `- [x] {label}\s*$`)
- ADR 섹션: "ADR added" 또는 "Not required" 중 하나 이상 체크

### Delivery Balance
- "UI/UX surface changed"와 "Backend-only exception" 중 **하나만** 체크
- UI changed files는 같은 줄에 작성 (다음 줄 목록 불가)

### Break-Glass
- 일반 PR에서는 전부 `[ ]`, 필드 비움

### CI 재트리거
- `gh run rerun`은 이전 body 사용 → body 수정 후 empty commit push 필요

---

## 구현 원칙 (SHOULD)

1. **WI 1개 = 기능 1개** — 여러 기능을 한 WI에 묶지 않는다.
2. **새 기능은 새 라우트** — 기존 페이지에 섹션 추가 대신 새 라우트.
3. **컴포넌트 분리 우선** — 500줄+ JSX 직접 작성 금지.
4. **순환 개선 금지** — 한 기능을 여러 WI에 걸쳐 점진적 고도화 금지.
5. **기존 프로세스 준수** — Work Item → Spec → 구현 → 테스트 → PR → 머지.

---

## Codex 실행 플래그

```
push/PR 필요:  codex exec --dangerously-bypass-approvals-and-sandbox
push 불필요:   codex exec --full-auto
주의: --full-auto, --sandbox danger-full-access는 Windows에서 네트워크 차단
```
