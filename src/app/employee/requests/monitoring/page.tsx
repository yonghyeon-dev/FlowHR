import { getRequestLocale } from "@/lib/i18n/server";

import { EmployeeRequestsWorkspaceContent } from "../workspace-content";

type EmployeeRequestsMonitoringPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployeeRequestsMonitoringPage({
  searchParams
}: EmployeeRequestsMonitoringPageProps) {
  const locale = await getRequestLocale();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sourceParam = resolvedSearchParams.source;
  const source =
    typeof sourceParam === "string"
      ? sourceParam
      : Array.isArray(sourceParam)
        ? (sourceParam[0] ?? null)
        : null;

  return (
    <EmployeeRequestsWorkspaceContent
      locale={locale}
      source={source}
      sectionMode="monitoring"
    />
  );
}
