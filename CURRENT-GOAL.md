# Current Goal

현재 목표는 `작은 UI 수정 누적`이 아니라 `FlowHR를 UI/UX 중심의 실제 운영형 HR SaaS로 재정립하는 것`이다.

핵심 원칙:

1. UI/UX는 마감 단계가 아니라 제품 구조와 역할 모델을 결정하는 상위 기준이다.
2. 권한, 테넌트, 정보구조, 운영 설정은 모두 사용자 경험을 안정시키기 위한 구조 개편 대상으로 본다.
3. 개별 화면 수정은 반드시 상위 리팩토링 방향 아래에서만 진행한다.
4. 완료 기준은 `main 머지 + 원격 브랜치 삭제 + main CI green + production deploy green`이다.

우선 참조 문서:

- [docs/production-operating-plan.md](docs/production-operating-plan.md)
- [docs/ui-ux-first-refactor-blueprint.md](docs/ui-ux-first-refactor-blueprint.md)
- [docs/role-tenant-product-shell-blueprint.md](docs/role-tenant-product-shell-blueprint.md)
- [docs/production-operating-progress.md](docs/production-operating-progress.md)
- [docs/production-gap-inventory.md](docs/production-gap-inventory.md)

현재 실행 축:

- UI/UX 중심 제품 구조 재정립
- 역할/권한/테넌트 모델 정리
- admin/employee 정보구조 및 제품 셸 리팩토링
- 공통 workspace interaction 계약 정리
- 운영 설정 UI 제품화
