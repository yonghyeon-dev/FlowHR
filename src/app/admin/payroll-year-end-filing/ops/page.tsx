import { redirect } from "next/navigation";

import { isAdminPayrollSource, withAdminSource } from "@/app/admin/source-context";

type AdminPayrollYearEndFilingOpsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPayrollYearEndFilingOpsPage({
  searchParams
}: AdminPayrollYearEndFilingOpsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sourceValue = resolvedSearchParams.source;
  const source = Array.isArray(sourceValue) ? sourceValue[0] : sourceValue;

  redirect(
    isAdminPayrollSource(source ?? null)
      ? withAdminSource("/admin/payroll-year-end-filing/ops/alert", "admin-payroll")
      : "/admin/payroll-year-end-filing/ops/alert"
  );
}
