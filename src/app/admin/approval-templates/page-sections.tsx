import Link from "next/link";

import {
  formatApprovalTemplateDateTime,
  formatApprovalTemplateKrw,
  type AdminApprovalTemplatesLocaleCopy
} from "@/app/admin/approval-templates/page-locale-helpers";
import type {
  ApiLog,
  ApprovalDomain,
  ApprovalGatePreviewDto,
  ApprovalLineTemplateDto
} from "@/app/admin/approval-templates/page-types";
import {
  formatActorRoleLabel,
  formatPublicEmployeeNumber
} from "@/lib/product-language";

type PreviewPanelProps = {
  copy: AdminApprovalTemplatesLocaleCopy;
  runtimeLocale: string;
  organizationId: string;
  actorRoles: ReadonlyArray<string>;
  domainOptions: ApprovalDomain[];
  previewDomain: ApprovalDomain;
  setPreviewDomain: (value: ApprovalDomain) => void;
  previewActorRole: string;
  setPreviewActorRole: (value: string) => void;
  previewActorId: string;
  setPreviewActorId: (value: string) => void;
  previewPayrollGrossPayKrw: string;
  setPreviewPayrollGrossPayKrw: (value: string) => void;
  gatePreview: ApprovalGatePreviewDto | null;
  runGatePreview: () => void;
};

type TemplateListPanelProps = {
  copy: AdminApprovalTemplatesLocaleCopy;
  runtimeLocale: string;
  templates: ApprovalLineTemplateDto[];
  onToggleTemplateActive: (template: ApprovalLineTemplateDto) => void;
};

type LogsPanelProps = {
  copy: AdminApprovalTemplatesLocaleCopy;
  stats: { total: number; success: number; fail: number };
  pendingLabel: string | null;
  logs: ApiLog[];
};

export function ApprovalTemplatePreviewPanel({
  copy,
  runtimeLocale,
  organizationId,
  actorRoles,
  domainOptions,
  previewDomain,
  setPreviewDomain,
  previewActorRole,
  setPreviewActorRole,
  previewActorId,
  setPreviewActorId,
  previewPayrollGrossPayKrw,
  setPreviewPayrollGrossPayKrw,
  gatePreview,
  runGatePreview
}: PreviewPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.preview.title}</h2>
      <p className="small">{copy.preview.description}</p>
      <label>
        {copy.preview.domain}
        <select value={previewDomain} onChange={(event) => setPreviewDomain(event.target.value as ApprovalDomain)}>
          {domainOptions.map((option) => (
            <option key={option} value={option}>
              {copy.domainLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {copy.preview.actorRole}
        <select value={previewActorRole} onChange={(event) => setPreviewActorRole(event.target.value)}>
          {actorRoles.map((role) => (
            <option key={role} value={role}>
              {formatActorRoleLabel(role, runtimeLocale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {copy.preview.actorIdOptional}
        <input value={previewActorId} onChange={(event) => setPreviewActorId(event.target.value)} />
      </label>
      {previewDomain === "PAYROLL" ? (
        <label>
          {copy.preview.payrollGross}
          <input
            type="number"
            min={0}
            value={previewPayrollGrossPayKrw}
            onChange={(event) => setPreviewPayrollGrossPayKrw(event.target.value)}
            placeholder={copy.preview.payrollGrossPlaceholder}
          />
        </label>
      ) : null}
      <div className="panel-actions">
        <button className="btn btn-secondary" onClick={runGatePreview} disabled={!organizationId.trim()}>
          {copy.preview.runPreview}
        </button>
      </div>
      {gatePreview ? (
        <div className="small" style={{ display: "grid", gap: 8 }}>
          <p>
            {copy.preview.result}: <strong>{gatePreview.allowed ? copy.preview.allowed : copy.preview.blocked}</strong> (
            {gatePreview.allowedReason}) / {copy.preview.expected}:{" "}
            {gatePreview.expectedRoles.map((role) => formatActorRoleLabel(role, runtimeLocale)).join(", ") || "-"} /{" "}
            {copy.preview.fallback}: {formatActorRoleLabel(gatePreview.fallbackRole, runtimeLocale)}
          </p>
          <p>
            {copy.preview.actor}: {formatActorRoleLabel(gatePreview.actorRole, runtimeLocale)}
            {gatePreview.actorId ? ` · ${formatPublicEmployeeNumber(gatePreview.actorId)}` : ""}
            {gatePreview.payrollGrossPayKrw !== null
              ? ` / ${copy.preview.gross} ${formatApprovalTemplateKrw(gatePreview.payrollGrossPayKrw, runtimeLocale)} KRW`
              : ""}
          </p>
          <p>
            {copy.preview.matchedTemplates}: {gatePreview.matchedTemplates.length}
          </p>
          {gatePreview.matchedTemplates.length > 0 ? (
            <ul className="simple-list">
              {gatePreview.matchedTemplates.map((template) => (
                <li key={template.id}>
                  {template.name} / {copy.templateList.roles}:{" "}
                  {template.approverRoles.map((role) => formatActorRoleLabel(role, runtimeLocale)).join(", ")} /{" "}
                  {copy.templateList.stages}: {template.approvalStages.length} / {copy.templateList.gross}{" "}
                  {formatApprovalTemplateKrw(template.payrollGrossPayMinKrw, runtimeLocale)} ~{" "}
                  {formatApprovalTemplateKrw(template.payrollGrossPayMaxKrw, runtimeLocale)}
                </li>
              ))}
            </ul>
          ) : null}
          {gatePreview.activeDelegations.length > 0 ? (
            <>
              <p>
                {copy.preview.delegations}: {gatePreview.activeDelegations.length}
              </p>
              <ul className="simple-list">
                {gatePreview.activeDelegations.map((delegation) => (
                  <li key={delegation.id}>
                    {formatActorRoleLabel(delegation.delegatorRole, runtimeLocale)} =&gt;{" "}
                    {formatPublicEmployeeNumber(delegation.delegateActorId)} /{" "}
                    {formatApprovalTemplateDateTime(delegation.startsAt, runtimeLocale)} ~{" "}
                    {formatApprovalTemplateDateTime(delegation.endsAt, runtimeLocale)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : (
        <p className="small muted">{copy.preview.noResult}</p>
      )}
    </article>
  );
}

export function ApprovalTemplateListPanel({
  copy,
  runtimeLocale,
  templates,
  onToggleTemplateActive
}: TemplateListPanelProps) {
  return (
    <article className="panel">
      <h2>
        {copy.templateList.title} ({templates.length})
      </h2>
      {templates.length === 0 ? (
        <p className="small">{copy.templateList.empty}</p>
      ) : (
        <ul className="simple-list">
          {templates.map((template) => (
            <li key={template.id}>
              <strong>{template.name}</strong>{" "}
              <span className="muted">
                [{copy.domainLabels[template.domain]}] / {copy.templateList.roles}:{" "}
                {template.approverRoles.map((role) => formatActorRoleLabel(role, runtimeLocale)).join(", ")} /{" "}
                {copy.templateList.stages}: {template.approvalStages.length} /{" "}
                {template.active ? copy.templateList.active : copy.templateList.inactive}
                {template.domain === "PAYROLL" &&
                (template.payrollGrossPayMinKrw !== null || template.payrollGrossPayMaxKrw !== null)
                  ? ` / ${copy.templateList.gross}: ${formatApprovalTemplateKrw(template.payrollGrossPayMinKrw, runtimeLocale)} ~ ${formatApprovalTemplateKrw(template.payrollGrossPayMaxKrw, runtimeLocale)}`
                  : ""}
              </span>
              <br />
              <span className="small">
                {copy.templateList.created} {formatApprovalTemplateDateTime(template.createdAt, runtimeLocale)} /{" "}
                {copy.templateList.updated} {formatApprovalTemplateDateTime(template.updatedAt, runtimeLocale)}
              </span>
              <div className="panel-actions">
                <button className="btn btn-secondary btn-small" onClick={() => onToggleTemplateActive(template)}>
                  {template.active ? copy.templateList.deactivate : copy.templateList.activate}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ApprovalTemplateLogsPanel({ copy, stats, pendingLabel, logs }: LogsPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.logs.title}</h2>
      <p className="small">
        {copy.logs.total} {stats.total} / {copy.logs.success} {stats.success} / {copy.logs.fail} {stats.fail}
        {pendingLabel ? ` / ${copy.logs.inProgress} ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{copy.logs.empty}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.logs.okBadge : copy.logs.failBadge}</span> {log.label} /{" "}
              {log.status} / {log.at}
            </li>
          ))}
        </ul>
      )}
      <div className="panel-actions">
        <Link href="/admin/approval-policy" className="btn btn-secondary">
          {copy.logs.toPolicy}
        </Link>
        <Link href="/admin" className="btn btn-secondary">
          {copy.logs.toAdmin}
        </Link>
      </div>
    </article>
  );
}
