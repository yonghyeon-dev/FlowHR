"use client";

import { redirect } from "next/navigation";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminLeavePromotionPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  redirect("/ops/leave-promotion");
}
