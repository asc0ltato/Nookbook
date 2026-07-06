"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminReviewsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=reviews");
  }, [router]);

  return null;
}
