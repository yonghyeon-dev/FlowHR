"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type PositionItem = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  title: string;
  grade: number | null;
  description: string | null;
  active: boolean;
};

type EmployeeItem = {
  id: string;
  organizationId: string | null;
  positionId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
};

type ApiEnvelope = {
  error?: string;
  positions?: PositionItem[];
  employees?: EmployeeItem[];
  position?: PositionItem;
};

function buildQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value.trim().length > 0) {
      query.set(key, value.trim());
    }
  }
  const encoded = query.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

function normalizeIntegerField(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return "invalid";
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return "invalid";
  }
  return parsed;
}

export default function AdminPositionManagementWorkspace() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const text = useMemo(
    () =>
      isKoLocale
        ? {
            organizationContextRequired:
              "조직 컨텍스트가 필요합니다. 세션 또는 x-actor-organization-id를 확인해 주세요.",
            loadPositions: "직급 목록 조회",
            loadEmployees: "직원 목록 조회",
            loadWorkspaceFailed: "직급/직원 데이터를 불러오지 못했습니다.",
            titleRequired: "직급명을 입력해 주세요.",
            gradeMustBeInteger: "직급은 정수여야 합니다.",
            updatePosition: "직급 수정",
            updatePositionFailed: "직급 수정에 실패했습니다.",
            positionUpdated: "직급이 수정되었습니다.",
            createPosition: "직급 생성",
            createPositionFailed: "직급 생성에 실패했습니다.",
            positionCreated: "직급이 생성되었습니다.",
            deletePosition: "직급 삭제",
            deletePositionFailed: "직급 삭제에 실패했습니다.",
            positionDeleted: "직급이 삭제되었습니다.",
            deletePositionConfirm: (title: string) => `"${title}" 직급을 삭제하시겠습니까?`,
            pageTitle: "직급 관리",
            pageSubtitle: "직급을 생성, 조회, 수정, 삭제합니다.",
            refresh: "새로고침",
            addPosition: "직급 추가",
            title: "직급명",
            grade: "등급",
            description: "설명",
            employeeCount: "직원 수",
            actions: "작업",
            noPositionsFound: "등록된 직급이 없습니다.",
            edit: "수정",
            delete: "삭제",
            editPosition: "직급 수정",
            titlePlaceholder: "예: 시니어 소프트웨어 엔지니어",
            gradePlaceholder: "예: 4",
            descriptionPlaceholder: "예: 플랫폼 이니셔티브를 주도합니다.",
            cancel: "취소",
            save: "저장",
            create: "생성"
          }
        : {
            organizationContextRequired:
              "Organization context is required. Check session or x-actor-organization-id.",
            loadPositions: "Load positions",
            loadEmployees: "Load employees",
            loadWorkspaceFailed: "Failed to load positions/employees.",
            titleRequired: "Title is required.",
            gradeMustBeInteger: "Grade must be an integer.",
            updatePosition: "Update position",
            updatePositionFailed: "Failed to update position.",
            positionUpdated: "Position updated.",
            createPosition: "Create position",
            createPositionFailed: "Failed to create position.",
            positionCreated: "Position created.",
            deletePosition: "Delete position",
            deletePositionFailed: "Failed to delete position.",
            positionDeleted: "Position deleted.",
            deletePositionConfirm: (title: string) => `Delete "${title}" position?`,
            pageTitle: "Position Management",
            pageSubtitle: "Create, list, update, and delete job titles.",
            refresh: "Refresh",
            addPosition: "Add Position",
            title: "Title",
            grade: "Grade",
            description: "Description",
            employeeCount: "Employee Count",
            actions: "Actions",
            noPositionsFound: "No positions found.",
            edit: "Edit",
            delete: "Delete",
            editPosition: "Edit Position",
            titlePlaceholder: "e.g. Senior Software Engineer",
            gradePlaceholder: "e.g. 4",
            descriptionPlaceholder: "e.g. Leads platform initiatives.",
            cancel: "Cancel",
            save: "Save",
            create: "Create"
          },
    [isKoLocale]
  );
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const actorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const employeeCountByPositionId = useMemo(() => {
    const counters = new Map<string, number>();
    for (const employee of employees) {
      if (!employee.positionId) {
        continue;
      }
      counters.set(employee.positionId, (counters.get(employee.positionId) ?? 0) + 1);
    }
    return counters;
  }, [employees]);

  const callApi = useCallback(
    async (
      action: string,
      method: "GET" | "POST" | "PATCH" | "DELETE",
      path: string,
      payload?: Record<string, unknown>
    ) => {
      setPendingLabel(action);
      try {
        const headers: Record<string, string> = payload ? { "content-type": "application/json" } : {};
        if (usesBearerToken) {
          headers.authorization = `Bearer ${bearerToken}`;
        } else {
          headers["x-actor-role"] = "admin";
          headers["x-actor-id"] = actorId;
          headers["x-actor-organization-id"] = organizationId;
        }
        const response = await fetch(path, {
          method,
          headers,
          body: payload ? JSON.stringify(payload) : undefined
        });
        const text = await response.text();
        const parsed = text.trim().length > 0 ? (JSON.parse(text) as ApiEnvelope) : {};
        return { response, parsed };
      } finally {
        setPendingLabel(null);
      }
    },
    [actorId, bearerToken, organizationId, usesBearerToken]
  );

  const loadWorkspace = useCallback(async () => {
    if (!organizationId && !usesBearerToken) {
      setStatusMessage(text.organizationContextRequired);
      return;
    }

    const query = buildQuery({ organizationId });
    const [positionResult, employeeResult] = await Promise.all([
      callApi(text.loadPositions, "GET", `/api/people/positions${query}`),
      callApi(text.loadEmployees, "GET", `/api/people/employees${query}`)
    ]);

    if (!positionResult.response.ok || !employeeResult.response.ok) {
      setStatusMessage(text.loadWorkspaceFailed);
      return;
    }

    setPositions(Array.isArray(positionResult.parsed.positions) ? positionResult.parsed.positions : []);
    setEmployees(Array.isArray(employeeResult.parsed.employees) ? employeeResult.parsed.employees : []);
    setStatusMessage("");
  }, [callApi, organizationId, text, usesBearerToken]);

  useEffect(() => {
    if (autoLoadAttempted || (!organizationId && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadWorkspace();
  }, [autoLoadAttempted, loadWorkspace, organizationId, usesBearerToken]);

  function resetFormState() {
    setEditingPositionId(null);
    setFormTitle("");
    setFormGrade("");
    setFormDescription("");
  }

  function openCreateModal() {
    resetFormState();
    setIsFormOpen(true);
  }

  function openEditModal(position: PositionItem) {
    setEditingPositionId(position.id);
    setFormTitle(position.title || position.name);
    setFormGrade(position.grade === null ? "" : String(position.grade));
    setFormDescription(position.description ?? "");
    setIsFormOpen(true);
  }

  function closeModal() {
    setIsFormOpen(false);
    resetFormState();
  }

  async function submitPosition() {
    const normalizedTitle = formTitle.trim();
    if (!normalizedTitle) {
      setStatusMessage(text.titleRequired);
      return;
    }

    const normalizedGrade = normalizeIntegerField(formGrade);
    if (normalizedGrade === "invalid") {
      setStatusMessage(text.gradeMustBeInteger);
      return;
    }

    const normalizedDescription = formDescription.trim();
    const gradePayload = normalizedGrade === null ? null : normalizedGrade;
    const descriptionPayload = normalizedDescription.length > 0 ? normalizedDescription : null;

    if (editingPositionId) {
      const updateResult = await callApi(
        text.updatePosition,
        "PATCH",
        `/api/people/positions/${encodeURIComponent(editingPositionId)}`,
        {
          title: normalizedTitle,
          grade: gradePayload,
          description: descriptionPayload
        }
      );

      if (!updateResult.response.ok) {
        setStatusMessage(updateResult.parsed.error ?? text.updatePositionFailed);
        return;
      }

      setStatusMessage(text.positionUpdated);
      closeModal();
      await loadWorkspace();
      return;
    }

    const createPayload: Record<string, unknown> = {
      title: normalizedTitle
    };
    if (gradePayload !== null) {
      createPayload.grade = gradePayload;
    }
    if (descriptionPayload !== null) {
      createPayload.description = descriptionPayload;
    }

    const createResult = await callApi(
      text.createPosition,
      "POST",
      "/api/people/positions",
      createPayload
    );

    if (!createResult.response.ok) {
      setStatusMessage(createResult.parsed.error ?? text.createPositionFailed);
      return;
    }

    setStatusMessage(text.positionCreated);
    closeModal();
    await loadWorkspace();
  }

  async function deletePosition(position: PositionItem) {
    const title = position.title || position.name;
    const shouldDelete = window.confirm(text.deletePositionConfirm(title));
    if (!shouldDelete) {
      return;
    }

    const deleteResult = await callApi(
      text.deletePosition,
      "DELETE",
      `/api/people/positions/${encodeURIComponent(position.id)}`
    );

    if (!deleteResult.response.ok) {
      setStatusMessage(deleteResult.parsed.error ?? text.deletePositionFailed);
      return;
    }

    setStatusMessage(text.positionDeleted);
    await loadWorkspace();
  }

  return (
    <section id="positions" className="saas-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{text.pageTitle}</h1>
          <p className="page-subtitle">{text.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()}>
            {text.refresh}
          </button>
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            {text.addPosition}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>{text.title}</th>
                <th>{text.grade}</th>
                <th>{text.description}</th>
                <th>{text.employeeCount}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    {text.noPositionsFound}
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id}>
                    <td>{position.title || position.name}</td>
                    <td>{position.grade ?? "-"}</td>
                    <td>{position.description ?? "-"}</td>
                    <td>{employeeCountByPositionId.get(position.id) ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-small" type="button" onClick={() => openEditModal(position)}>
                          {text.edit}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          onClick={() => void deletePosition(position)}
                        >
                          {text.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}...</p> : null}
        {statusMessage ? <p className="small muted">{statusMessage}</p> : null}
      </div>

      {isFormOpen ? (
        <div className="approval-reject-modal-backdrop" role="dialog" aria-modal="true">
          <div className="approval-reject-modal">
            <h3>{editingPositionId ? text.editPosition : text.addPosition}</h3>
            <label>
              {text.title}
              <input
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder={text.titlePlaceholder}
              />
            </label>
            <label>
              {text.grade}
              <input
                value={formGrade}
                onChange={(event) => setFormGrade(event.target.value)}
                placeholder={text.gradePlaceholder}
              />
            </label>
            <label>
              {text.description}
              <textarea
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                placeholder={text.descriptionPlaceholder}
              />
            </label>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                {text.cancel}
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void submitPosition()}>
                {editingPositionId ? text.save : text.create}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
