"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ManagersPage() {
  const router = useRouter();
  const { isAdmin, isManager } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      router.replace("/admin");
      return;
    }
    if (isManager()) {
      router.replace("/manager");
      return;
    }
    router.replace("/");
  }, [router, isAdmin, isManager]);

  return null;
}
