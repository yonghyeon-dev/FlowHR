"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/provider";

type OnboardingTaskTemplate = {
  id: string;
  organizationId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type OnboardingTaskTemplatePayload = {
  templates?: OnboardingTaskTemplate[];
  error?: string;
};

export function AdminOnboardingTaskTemplatePanel() {
  const { locale } = useI18n();
  const copy = useMemo(() => {
    if (locale === "ko") {
      return {
        title: "Onboarding Default Task Templates",
        subtitle: "Templates are auto-assigned when an employee becomes ACTIVE.",
        refresh: "Refresh",
        seedDefaults: "Seed default templates",
        loading: "Loading templates...",
        empty: "No templates are registered.",
        loadFailed: "Failed to load onboarding templates.",
        seedFailed: "Failed to seed default templates.",
        seeding: "Seeding..."
      };
    }
    return {
      title: "Onboarding Default Task Templates",
      subtitle: "Templates are auto-assigned when an employee becomes ACTIVE.",
      refresh: "Refresh",
      seedDefaults: "Seed default templates",
      loading: "Loading templates...",
      empty: "No templates are registered.",
      loadFailed: "Failed to load onboarding templates.",
      seedFailed: "Failed to seed default templates.",
      seeding: "Seeding..."
    };
  }, [locale]);

  const [templates, setTemplates] = useState<OnboardingTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/onboarding/task-templates", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as OnboardingTaskTemplatePayload;
      if (!response.ok) {
        throw new Error(payload.error ?? copy.loadFailed);
      }
      setTemplates(Array.isArray(payload.templates) ? payload.templates : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.loadFailed);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const seedDefaults = useCallback(async () => {
    setSeeding(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/onboarding/task-templates", {
        method: "POST"
      });
      const payload = (await response.json()) as OnboardingTaskTemplatePayload;
      if (!response.ok) {
        throw new Error(payload.error ?? copy.seedFailed);
      }
      setTemplates(Array.isArray(payload.templates) ? payload.templates : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.seedFailed);
    } finally {
      setSeeding(false);
    }
  }, [copy.seedFailed]);

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div>
          <h2>{copy.title}</h2>
          <p className="small muted">{copy.subtitle}</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => void loadTemplates()}>
            {copy.refresh}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={seeding}
            onClick={() => void seedDefaults()}
          >
            {seeding ? copy.seeding : copy.seedDefaults}
          </button>
        </div>
      </div>

      {error ? <p className="small fail">{error}</p> : null}
      {loading ? <p className="small muted">{copy.loading}</p> : null}
      {!loading && templates.length === 0 ? <p className="small muted">{copy.empty}</p> : null}
      {!loading && templates.length > 0 ? (
        <ul className="simple-list">
          {templates.map((template) => (
            <li key={template.id}>
              <strong>{template.title}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
