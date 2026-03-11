import { redirect } from "next/navigation";

import {
  buildRedirectHref,
  getFirstSearchParamValue
} from "@/app/admin/payroll-route-query";

import AdminPayrollPayslipDeliveryPageClient from "./page-client";

type AdminPayrollPayslipDeliveryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPayrollPayslipDeliveryPage({
  searchParams
}: AdminPayrollPayslipDeliveryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const focus = getFirstSearchParamValue(resolvedSearchParams, "focus");

  if (focus === "undistributed") {
    redirect(
      buildRedirectHref(
        "/admin/payroll-payslip-delivery/undistributed",
        resolvedSearchParams,
        ["focus"]
      )
    );
  }

  return <AdminPayrollPayslipDeliveryPageClient queueMode="all" />;
}
