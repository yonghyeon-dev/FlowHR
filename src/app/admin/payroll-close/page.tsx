import { redirect } from "next/navigation";

import {
  buildRedirectHref,
  getFirstSearchParamValue
} from "@/app/admin/payroll-route-query";

import AdminPayrollClosePageClient from "./page-client";

type AdminPayrollClosePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPayrollClosePage({
  searchParams
}: AdminPayrollClosePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const focus = getFirstSearchParamValue(resolvedSearchParams, "focus");

  if (focus === "previewed") {
    redirect(
      buildRedirectHref(
        "/admin/payroll-close/previewed",
        resolvedSearchParams,
        ["focus"]
      )
    );
  }

  if (focus === "undistributed") {
    redirect(
      buildRedirectHref(
        "/admin/payroll-payslip-delivery/undistributed",
        resolvedSearchParams,
        ["focus"]
      )
    );
  }

  return <AdminPayrollClosePageClient queueMode="all" />;
}
