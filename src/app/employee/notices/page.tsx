"use client";

import EmployeeNoticeBoard from "@/components/notices/EmployeeNoticeBoard";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function EmployeeNoticesPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <EmployeeNoticeBoard />;
}
