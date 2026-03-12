import {
  FILING_STEP_DEFINITIONS,
  FILING_WORKFLOW_GATE_KEYS,
  FILING_WORKFLOW_STEPS,
  type FilingWorkflowGates,
  type FilingWorkflowMetadata,
  type FilingWorkflowStep
} from "@/components/payroll-year-end-filing/filing-types";
import { isAdminPayrollSource } from "@/app/admin/source-context";

const FILING_WORKFLOW_STEP_SEGMENTS: Record<FilingWorkflowStep, string> = {
  alert: "alert",
  checklist: "checklist-flow",
  review: "review",
  "close-off": "close-off",
  delivery: "delivery",
  archive: "archive",
  report: "report"
};

function parseBooleanQueryParam(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseOptionalInteger(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isFilingWorkflowStep(value: string): value is FilingWorkflowStep {
  return (FILING_WORKFLOW_STEPS as readonly string[]).includes(value);
}

export function resolveFilingWorkflowStepFromSegment(segment: string) {
  const normalized = segment.trim().toLowerCase();
  const byStep = FILING_WORKFLOW_STEPS.find((step) => step === normalized);
  if (byStep) {
    return byStep;
  }
  const bySegment = FILING_WORKFLOW_STEPS.find((step) => FILING_WORKFLOW_STEP_SEGMENTS[step] === normalized);
  return bySegment ?? null;
}

export function getFilingWorkflowStepSegment(step: FilingWorkflowStep) {
  return FILING_WORKFLOW_STEP_SEGMENTS[step];
}

export function buildDefaultFilingWorkflowGates(): FilingWorkflowGates {
  return FILING_WORKFLOW_GATE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as FilingWorkflowGates);
}

export function buildDefaultFilingWorkflowMetadata(
  partial?: Partial<FilingWorkflowMetadata>
): FilingWorkflowMetadata {
  return {
    metric: partial?.metric?.trim() || "pending",
    level: partial?.level === "critical" ? "critical" : "watch",
    ownerRole: partial?.ownerRole?.trim() || "manager",
    ownerActorId: partial?.ownerActorId?.trim() || "",
    value: partial?.value ?? null
  };
}

export function buildFilingWorkflowStateFromSearchParams(
  searchParams: { get: (key: string) => string | null },
  currentStep: FilingWorkflowStep
) {
  const metadata = buildDefaultFilingWorkflowMetadata({
    metric: searchParams.get("metric") ?? "pending",
    level: searchParams.get("level") === "critical" ? "critical" : "watch",
    ownerRole: searchParams.get("ownerRole") ?? "manager",
    ownerActorId: searchParams.get("ownerActorId") ?? "",
    value: parseOptionalInteger(searchParams.get("value"))
  });

  const gates = buildDefaultFilingWorkflowGates();
  for (const key of FILING_WORKFLOW_GATE_KEYS) {
    gates[key] = parseBooleanQueryParam(searchParams.get(key));
  }

  return {
    currentStep,
    metadata,
    gates
  };
}

export function buildFilingOpsStepHref(options: {
  step: FilingWorkflowStep;
  metadata: FilingWorkflowMetadata;
  gates: FilingWorkflowGates;
  source?: string | null;
}) {
  const query = new URLSearchParams({
    metric: options.metadata.metric,
    level: options.metadata.level
  });
  if (options.metadata.value !== null) {
    query.set("value", String(options.metadata.value));
  }
  if (options.metadata.ownerRole.trim().length > 0) {
    query.set("ownerRole", options.metadata.ownerRole.trim());
  }
  if (options.metadata.ownerActorId.trim().length > 0) {
    query.set("ownerActorId", options.metadata.ownerActorId.trim());
  }
  for (const key of FILING_WORKFLOW_GATE_KEYS) {
    query.set(key, options.gates[key] ? "1" : "0");
  }
  if (isAdminPayrollSource(options.source ?? null)) {
    query.set("source", "admin-payroll");
  }

  return `/admin/payroll-year-end-filing/ops/${getFilingWorkflowStepSegment(options.step)}?${query.toString()}`;
}

export function getNextFilingWorkflowStep(step: FilingWorkflowStep) {
  const index = FILING_WORKFLOW_STEPS.findIndex((candidate) => candidate === step);
  if (index < 0 || index >= FILING_WORKFLOW_STEPS.length - 1) {
    return step;
  }
  return FILING_WORKFLOW_STEPS[index + 1];
}

export function getPreviousFilingWorkflowStep(step: FilingWorkflowStep) {
  const index = FILING_WORKFLOW_STEPS.findIndex((candidate) => candidate === step);
  if (index <= 0) {
    return step;
  }
  return FILING_WORKFLOW_STEPS[index - 1];
}

export function summarizeFilingWorkflowGates(gates: FilingWorkflowGates) {
  const total = FILING_WORKFLOW_GATE_KEYS.length;
  const ready = FILING_WORKFLOW_GATE_KEYS.filter((key) => gates[key]).length;
  return {
    ready,
    total,
    ratio: ready / total
  };
}

export function getFilingStepDefinition(step: FilingWorkflowStep) {
  return FILING_STEP_DEFINITIONS.find((entry) => entry.step === step) ?? FILING_STEP_DEFINITIONS[0];
}
