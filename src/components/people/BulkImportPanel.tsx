"use client";

import { useMemo, useState } from "react";

type BulkImportResult = {
  imported: number;
  failed: number;
  errors: string[];
};

type BulkImportEmployeePayload = {
  name: string;
  email: string;
  departmentId: string | null;
  positionId: string | null;
  hireDate: string;
};

type BulkImportPanelProps = {
  isKoLocale: boolean;
  usesBearerToken: boolean;
  bearerToken: string;
  adminActorId: string;
  organizationId: string;
  disabled?: boolean;
  onImported?: () => Promise<void>;
};

const CSV_HEADER = "name,email,departmentId,positionId,hireDate";

function isHeaderRow(line: string) {
  return line.replace(/\s+/g, "").toLowerCase() === CSV_HEADER.toLowerCase();
}

function normalizeNullableCell(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCsvEmployees(source: string): BulkImportEmployeePayload[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const hasHeader = isHeaderRow(lines[0]!);
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line, index) => {
    const csvLineNumber = hasHeader ? index + 2 : index + 1;
    const cells = line.split(",").map((cell) => cell.trim());
    if (cells.length !== 5) {
      throw new Error(`line ${csvLineNumber}: expected 5 columns`);
    }

    const [name, email, departmentId, positionId, hireDate] = cells;
    if (!name || !email || !hireDate) {
      throw new Error(`line ${csvLineNumber}: name, email, hireDate are required`);
    }

    return {
      name,
      email,
      departmentId: normalizeNullableCell(departmentId!),
      positionId: normalizeNullableCell(positionId!),
      hireDate
    };
  });
}

function hasImportResult(payload: unknown): payload is BulkImportResult {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.imported === "number" &&
    typeof candidate.failed === "number" &&
    Array.isArray(candidate.errors)
  );
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function BulkImportPanel({
  isKoLocale,
  usesBearerToken,
  bearerToken,
  adminActorId,
  organizationId,
  disabled = false,
  onImported
}: BulkImportPanelProps) {
  const [csvInput, setCsvInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const placeholder = useMemo(
    () =>
      [
        CSV_HEADER,
        "Jane Doe,jane@flowhr.dev,DEPT-001,POS-001,2026-03-01",
        "John Park,john@flowhr.dev,DEPT-001,POS-002,2026-03-01"
      ].join("\n"),
    []
  );

  const panelTitle = isKoLocale ? "\uC9C1\uC6D0 CSV \uC77C\uAD04 \uAC00\uC838\uC624\uAE30" : "Employee CSV bulk import";
  const importLabel = "\uAC00\uC838\uC624\uAE30";

  const handleImport = async () => {
    if (disabled) {
      return;
    }
    setErrorMessage(null);
    setResult(null);

    let employees: BulkImportEmployeePayload[];
    try {
      employees = parseCsvEmployees(csvInput);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "failed to parse csv");
      return;
    }

    if (employees.length === 0) {
      setErrorMessage("Please provide at least one CSV row.");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json"
      };

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch("/api/people/employees/bulk-import", {
        method: "POST",
        headers,
        body: JSON.stringify({ employees })
      });

      const body = await parseResponseBody(response);
      if (hasImportResult(body)) {
        setResult(body);
        if (response.ok && body.imported > 0) {
          await onImported?.();
        }
        return;
      }

      const fallbackMessage =
        typeof body === "string"
          ? body
          : "Bulk import request failed.";
      setErrorMessage(fallbackMessage);
    } catch {
      setErrorMessage("Request failed unexpectedly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="panel panel-bulk-import">
      <h2>{panelTitle}</h2>
      <p className="small muted">Format: name,email,departmentId,positionId,hireDate</p>
      <label>
        CSV text
        <textarea
          rows={8}
          value={csvInput}
          onChange={(event) => setCsvInput(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => void handleImport()} disabled={disabled || isSubmitting}>
          {isSubmitting ? "Importing..." : importLabel}
        </button>
      </div>

      {errorMessage ? <p className="small fail">{errorMessage}</p> : null}
      {result ? (
        <div className="small" aria-live="polite">
          <p>
            Import result: imported={result.imported}, failed={result.failed}
          </p>
          {result.errors.length > 0 ? (
            <ul>
              {result.errors.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
