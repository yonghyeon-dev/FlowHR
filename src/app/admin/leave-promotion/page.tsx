"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminLeavePromotionPage() {
  const router = useRouter();
  const { loading } = useSupabaseSession();

  useEffect(() => {
    if (loading) {
      return;
    }
    router.replace("/ops/leave-promotion");
  }, [loading, router]);

  if (loading) return null;

  return null;
}
