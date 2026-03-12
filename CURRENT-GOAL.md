# Current Goal

현재 목표는 `부분 UI 수정 누적`이 아니라 `FlowHR를 UI/UX 중심의 실제 운영형 HR SaaS로 수렴시키는 것`이다.

핵심 원칙:

1. UI/UX는 마감 단계가 아니라 상위 구조 개편의 기준선이다.
2. 권한, 테넌트, 정보구조, 운영 설정도 모두 사용자 경험을 성립시키기 위한 제품 구조로 다룬다.
3. 개별 화면 수정은 상위 리팩토링 축 아래에서만 진행한다.
4. 완료 기준은 `main 머지 + 원격 브랜치 삭제 + main CI green + production deploy green`이다.
5. V2 셸 전환 중에는 `quality-gates`도 현재 V2 baseline 기준으로 유지한다.

우선 참조 문서:

- [docs/production-operating-plan.md](docs/production-operating-plan.md)
- [docs/service-readiness-execution-map.md](docs/service-readiness-execution-map.md)
- [docs/ui-ux-first-refactor-blueprint.md](docs/ui-ux-first-refactor-blueprint.md)
- [docs/role-tenant-product-shell-blueprint.md](docs/role-tenant-product-shell-blueprint.md)
- [docs/v2-ci-baseline-reset.md](docs/v2-ci-baseline-reset.md)
- [docs/production-operating-progress.md](docs/production-operating-progress.md)
- [docs/production-gap-inventory.md](docs/production-gap-inventory.md)

현재 실행 축:

- V2 shell / workspace contract 정착
- customer-admin operating station 완성
- employee work home 완성
- role / tenant / capability 구조 정렬
- 운영 설정 제품화
- service-readiness launch gate 수렴
