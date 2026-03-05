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
      setStatusMessage(
        isKoLocale
          ? "Organization context is required. Check session or x-actor-organization-id."
          : "Organization context is required. Check session or x-actor-organization-id."
      );
      return;
    }

    const query = buildQuery({ organizationId });
    const [positionResult, employeeResult] = await Promise.all([
      callApi(
        isKoLocale ? "Load positions" : "Load positions",
        "GET",
        `/api/people/positions${query}`
      ),
      callApi(
        isKoLocale ? "Load employees" : "Load employees",
        "GET",
        `/api/people/employees${query}`
      )
    ]);

    if (!positionResult.response.ok || !employeeResult.response.ok) {
      setStatusMessage(
        isKoLocale
          ? "Failed to load positions/employees."
          : "Failed to load positions/employees."
      );
      return;
    }

    setPositions(Array.isArray(positionResult.parsed.positions) ? positionResult.parsed.positions : []);
    setEmployees(Array.isArray(employeeResult.parsed.employees) ? employeeResult.parsed.employees : []);
    setStatusMessage("");
  }, [callApi, isKoLocale, organizationId, usesBearerToken]);

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
      setStatusMessage(isKoLocale ? "Title is required." : "Title is required.");
      return;
    }

    const normalizedGrade = normalizeIntegerField(formGrade);
    if (normalizedGrade === "invalid") {
      setStatusMessage(isKoLocale ? "Grade must be an integer." : "Grade must be an integer.");
      return;
    }

    const normalizedDescription = formDescription.trim();
    const gradePayload = normalizedGrade === null ? null : normalizedGrade;
    const descriptionPayload = normalizedDescription.length > 0 ? normalizedDescription : null;

    if (editingPositionId) {
      const updateResult = await callApi(
        isKoLocale ? "Update position" : "Update position",
        "PATCH",
        `/api/people/positions/${encodeURIComponent(editingPositionId)}`,
        {
          title: normalizedTitle,
          grade: gradePayload,
          description: descriptionPayload
        }
      );

      if (!updateResult.response.ok) {
        setStatusMessage(
          updateResult.parsed.error ??
            (isKoLocale ? "Failed to update position." : "Failed to update position.")
        );
        return;
      }

      setStatusMessage(isKoLocale ? "Position updated." : "Position updated.");
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
      isKoLocale ? "Create position" : "Create position",
      "POST",
      "/api/people/positions",
      createPayload
    );

    if (!createResult.response.ok) {
      setStatusMessage(
        createResult.parsed.error ??
          (isKoLocale ? "Failed to create position." : "Failed to create position.")
      );
      return;
    }

    setStatusMessage(isKoLocale ? "Position created." : "Position created.");
    closeModal();
    await loadWorkspace();
  }

  async function deletePosition(position: PositionItem) {
    const title = position.title || position.name;
    const shouldDelete = window.confirm(
      isKoLocale ? `Delete "${title}" position?` : `Delete "${title}" position?`
    );
    if (!shouldDelete) {
      return;
    }

    const deleteResult = await callApi(
      isKoLocale ? "Delete position" : "Delete position",
      "DELETE",
      `/api/people/positions/${encodeURIComponent(position.id)}`
    );

    if (!deleteResult.response.ok) {
      setStatusMessage(
        deleteResult.parsed.error ??
          (isKoLocale ? "Failed to delete position." : "Failed to delete position.")
      );
      return;
    }

    setStatusMessage(isKoLocale ? "Position deleted." : "Position deleted.");
    await loadWorkspace();
  }

  return (
    <section id="positions" className="saas-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "Position Management" : "Position Management"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "Create, list, update, and delete job titles."
              : "Create, list, update, and delete job titles."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()}>
            {isKoLocale ? "Refresh" : "Refresh"}
          </button>
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            {isKoLocale ? "Add Position" : "Add Position"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>{isKoLocale ? "Title" : "Title"}</th>
                <th>{isKoLocale ? "Grade" : "Grade"}</th>
                <th>{isKoLocale ? "Description" : "Description"}</th>
                <th>{isKoLocale ? "Employee Count" : "Employee Count"}</th>
                <th>{isKoLocale ? "Actions" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    {isKoLocale ? "No positions found." : "No positions found."}
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
                          {isKoLocale ? "Edit" : "Edit"}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          onClick={() => void deletePosition(position)}
                        >
                          {isKoLocale ? "Delete" : "Delete"}
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
            <h3>{editingPositionId ? "Edit Position" : "Add Position"}</h3>
            <label>
              {isKoLocale ? "Title" : "Title"}
              <input
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </label>
            <label>
              {isKoLocale ? "Grade" : "Grade"}
              <input
                value={formGrade}
                onChange={(event) => setFormGrade(event.target.value)}
                placeholder="e.g. 4"
              />
            </label>
            <label>
              {isKoLocale ? "Description" : "Description"}
              <textarea
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                placeholder="e.g. Leads platform initiatives."
              />
            </label>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                {isKoLocale ? "Cancel" : "Cancel"}
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void submitPosition()}>
                {editingPositionId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
