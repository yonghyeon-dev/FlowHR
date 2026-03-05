"use client";

import LeaveCalendarConsole from "@/components/leave-calendar/LeaveCalendarConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminLeaveCalendarPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <LeaveCalendarConsole />;
}
