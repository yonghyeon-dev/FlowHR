"use client";

import LeaveAccrualAutoGrantConsole from "@/components/leave-accrual/LeaveAccrualAutoGrantConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminLeaveAccrualPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <LeaveAccrualAutoGrantConsole />;
}
