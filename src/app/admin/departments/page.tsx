"use client";

import AdminDepartmentManagementWorkspace from "@/components/departments/AdminDepartmentManagementWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminDepartmentsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminDepartmentManagementWorkspace />;
}
