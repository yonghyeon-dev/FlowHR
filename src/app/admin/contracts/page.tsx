"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ContractTemplateCategory = "employment" | "amendment" | "nda";
type ContractTemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type ContractSortOption = "updated_desc" | "updated_asc" | "name_asc";

type ContractTemplateRow = {
  id: string;
  name: string;
  category: ContractTemplateCategory;
  status: ContractTemplateStatus;
  version: string;
  signerCount: number;
  clauseCoverageScore: number;
  updatedAt: string;
  detail: string;
};

type ContractReadinessTone = "ready" | "watch" | "risk";

type ContractSignatureReadinessCard = {
  key: string;
  label: string;
  tone: ContractReadinessTone;
  score: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

const CONTRACT_TEMPLATE_ROWS: ContractTemplateRow[] = [
  {
    id: "CT-001",
    name: "Employment Standard (KR)",
    category: "employment",
    status: "ACTIVE",
    version: "v2.4",
    signerCount: 2,
    clauseCoverageScore: 96,
    updatedAt: "2026-02-18T10:20:00+09:00",
    detail: "Base full-time employment contract with probation and overtime clauses."
  },
  {
    id: "CT-002",
    name: "Employment Part-time",
    category: "employment",
    status: "DRAFT",
    version: "v1.8",
    signerCount: 2,
    clauseCoverageScore: 82,
    updatedAt: "2026-02-19T15:40:00+09:00",
    detail: "Part-time contract draft with weekly-hour cap and holiday handling."
  },
  {
    id: "CT-003",
    name: "Compensation Amendment",
    category: "amendment",
    status: "ACTIVE",
    version: "v1.5",
    signerCount: 2,
    clauseCoverageScore: 91,
    updatedAt: "2026-02-20T09:10:00+09:00",
    detail: "Compensation change addendum for salary and allowance revisions."
  },
  {
    id: "CT-004",
    name: "Position Change Addendum",
    category: "amendment",
    status: "DRAFT",
    version: "v1.3",
    signerCount: 2,
    clauseCoverageScore: 78,
    updatedAt: "2026-02-17T12:30:00+09:00",
    detail: "Role/grade transition addendum pending legal review."
  },
  {
    id: "CT-005",
    name: "Employee NDA",
    category: "nda",
    status: "ACTIVE",
    version: "v3.0",
    signerCount: 2,
    clauseCoverageScore: 95,
    updatedAt: "2026-02-16T08:55:00+09:00",
    detail: "Standard NDA template covering source code and customer data."
  },
  {
    id: "CT-006",
    name: "Vendor NDA",
    category: "nda",
    status: "ARCHIVED",
    version: "v1.0",
    signerCount: 2,
    clauseCoverageScore: 70,
    updatedAt: "2025-12-10T14:05:00+09:00",
    detail: "Legacy NDA for external vendor contracts."
  }
];

function toDateValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function categoryLabel(value: ContractTemplateCategory) {
  if (value === "employment") {
    return "Employment";
  }
  if (value === "amendment") {
    return "Amendment";
  }
  return "NDA";
}

function statusTone(value: ContractTemplateStatus): ContractReadinessTone {
  if (value === "ACTIVE") {
    return "ready";
  }
  if (value === "DRAFT") {
    return "watch";
  }
  return "risk";
}

function readinessRank(value: ContractReadinessTone) {
  if (value === "risk") {
    return 3;
  }
  if (value === "watch") {
    return 2;
  }
  return 1;
}

export default function AdminContractsPage() {
  const [categoryFilter, setCategoryFilter] = useState<ContractTemplateCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ContractTemplateStatus | "all">("all");
  const [sortOption, setSortOption] = useState<ContractSortOption>("updated_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(CONTRACT_TEMPLATE_ROWS[0]?.id ?? "");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const contractTemplateRows = useMemo(() => CONTRACT_TEMPLATE_ROWS, []);

  const filteredContractTemplates = useMemo(() => {
    const rows = contractTemplateRows.filter((row) => {
      if (categoryFilter !== "all" && row.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (normalizedQuery.length === 0) {
        return true;
      }
      const haystack = `${row.id} ${row.name} ${row.detail}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    rows.sort((left, right) => {
      if (sortOption === "updated_desc") {
        return toDateValue(right.updatedAt) - toDateValue(left.updatedAt);
      }
      if (sortOption === "updated_asc") {
        return toDateValue(left.updatedAt) - toDateValue(right.updatedAt);
      }
      return left.name.localeCompare(right.name);
    });
    return rows;
  }, [categoryFilter, contractTemplateRows, normalizedQuery, sortOption, statusFilter]);

  const selectedTemplate =
    filteredContractTemplates.find((row) => row.id === selectedTemplateId) ?? filteredContractTemplates[0] ?? null;

  const contractSignatureReadinessCards = useMemo<ContractSignatureReadinessCard[]>(() => {
    const activeCount = filteredContractTemplates.filter((row) => row.status === "ACTIVE").length;
    const draftCount = filteredContractTemplates.filter((row) => row.status === "DRAFT").length;
    const avgCoverage =
      filteredContractTemplates.length === 0
        ? 0
        : Math.round(
            filteredContractTemplates.reduce((sum, row) => sum + row.clauseCoverageScore, 0) / filteredContractTemplates.length
          );

    const cards: ContractSignatureReadinessCard[] = [
      {
        key: "active-template-readiness",
        label: "active template readiness",
        tone: activeCount >= 2 ? "ready" : "watch",
        score: activeCount * 20 + 40,
        detail: `${activeCount} active template(s) are immediately available for signature flow.`,
        actionLabel: "open template library",
        targetSectionId: "contract-template-library"
      },
      {
        key: "draft-template-completion",
        label: "draft completion lane",
        tone: draftCount > 0 ? "watch" : "ready",
        score: draftCount > 0 ? 72 : 92,
        detail:
          draftCount > 0
            ? `${draftCount} draft template(s) need legal/policy completion before launch.`
            : "No blocking drafts in current filter scope.",
        actionLabel: "review drafts",
        targetSectionId: "contract-template-library"
      },
      {
        key: "clause-coverage-health",
        label: "clause coverage health",
        tone: avgCoverage >= 90 ? "ready" : avgCoverage >= 80 ? "watch" : "risk",
        score: avgCoverage,
        detail: `Average clause coverage score is ${avgCoverage}. Maintain 90+ before broad rollout.`,
        actionLabel: "inspect checklist",
        targetSectionId: "contract-signature-readiness"
      }
    ];

    return cards.sort((left, right) => {
      const toneDiff = readinessRank(right.tone) - readinessRank(left.tone);
      if (toneDiff !== 0) {
        return toneDiff;
      }
      return right.score - left.score;
    });
  }, [filteredContractTemplates]);

  function jumpToSection(sectionId: string) {
    if (typeof document === "undefined") {
      return;
    }
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }

  function runContractReadinessAction(card: ContractSignatureReadinessCard) {
    jumpToSection(card.targetSectionId);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">전자계약 템플릿</h1>
          <p className="page-subtitle">
            결재 이후 계약 서명 단계에서 사용하는 템플릿을 독립 화면에서 관리합니다.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin" className="btn btn-secondary">
            관리자 대시보드
          </Link>
          <Link href="/admin/approval-templates" className="btn btn-secondary">
            결재선 템플릿
          </Link>
        </div>
      </header>

      <section className="kpi-strip" aria-label="contract template summary">
        <article className="kpi-card">
          <span>전체 템플릿</span>
          <strong>{filteredContractTemplates.length}</strong>
        </article>
        <article className="kpi-card">
          <span>활성 템플릿</span>
          <strong>{filteredContractTemplates.filter((row) => row.status === "ACTIVE").length}</strong>
        </article>
        <article className="kpi-card">
          <span>평균 조항 커버리지</span>
          <strong>
            {filteredContractTemplates.length === 0
              ? "-"
              : `${Math.round(
                  filteredContractTemplates.reduce((sum, row) => sum + row.clauseCoverageScore, 0) /
                    filteredContractTemplates.length
                )}%`}
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article id="contract-template-library" className="panel panel-contract-template-library">
          <h2>Contract Template Library</h2>
          <div className="contract-template-filters" aria-label="contract template filter controls">
            <label>
              검색
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="template name / id"
              />
            </label>
            <label>
              카테고리
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as ContractTemplateCategory | "all")}
              >
                <option value="all">all</option>
                <option value="employment">employment</option>
                <option value="amendment">amendment</option>
                <option value="nda">nda</option>
              </select>
            </label>
            <label>
              상태
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ContractTemplateStatus | "all")}>
                <option value="all">all</option>
                <option value="ACTIVE">active</option>
                <option value="DRAFT">draft</option>
                <option value="ARCHIVED">archived</option>
              </select>
            </label>
            <label>
              정렬
              <select value={sortOption} onChange={(event) => setSortOption(event.target.value as ContractSortOption)}>
                <option value="updated_desc">latest first</option>
                <option value="updated_asc">oldest first</option>
                <option value="name_asc">name</option>
              </select>
            </label>
          </div>
          <ul className="contract-template-list" aria-label="contract template list">
            {filteredContractTemplates.map((row) => (
              <li key={row.id} className={`tone-${statusTone(row.status)}${selectedTemplate?.id === row.id ? " is-selected" : ""}`}>
                <div className="contract-template-head">
                  <strong>{row.name}</strong>
                  <span className="queue-history-chip">{row.status}</span>
                </div>
                <p>{row.detail}</p>
                <div className="contract-template-meta">
                  <span className="queue-history-chip">{row.id}</span>
                  <span className="queue-history-chip">{categoryLabel(row.category)}</span>
                  <span className="queue-history-chip">{row.version}</span>
                  <span className="queue-history-chip">coverage {row.clauseCoverageScore}</span>
                  <span className="queue-history-chip">updated {formatDateTime(row.updatedAt)}</span>
                </div>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => setSelectedTemplateId(row.id)}>
                  템플릿 선택
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="contract-signature-readiness" className="panel panel-contract-signature-readiness">
          <h2>Signature Readiness</h2>
          <p className="small">서명 런칭 전 템플릿 준비 상태를 빠르게 점검하는 카드입니다.</p>
          <ul className="contract-signature-readiness-list" aria-label="contract signature readiness list">
            {contractSignatureReadinessCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="contract-signature-readiness-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">score {card.score}</span>
                </div>
                <p>{card.detail}</p>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => runContractReadinessAction(card)}>
                  {card.actionLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-contract-template-detail">
          <h2>Selected Template Detail</h2>
          {!selectedTemplate ? (
            <p className="small muted">현재 필터 조건에서 선택 가능한 템플릿이 없습니다.</p>
          ) : (
            <>
              <p className="small muted">선택된 템플릿의 핵심 정보를 계약 런칭 전 확인합니다.</p>
              <ul className="contract-template-detail-list" aria-label="selected contract template detail">
                <li>
                  <span>ID</span>
                  <strong>{selectedTemplate.id}</strong>
                </li>
                <li>
                  <span>Version</span>
                  <strong>{selectedTemplate.version}</strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>{selectedTemplate.status}</strong>
                </li>
                <li>
                  <span>Category</span>
                  <strong>{categoryLabel(selectedTemplate.category)}</strong>
                </li>
                <li>
                  <span>Signer Flow</span>
                  <strong>{selectedTemplate.signerCount} signer(s)</strong>
                </li>
                <li>
                  <span>Clause Coverage</span>
                  <strong>{selectedTemplate.clauseCoverageScore}%</strong>
                </li>
              </ul>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
