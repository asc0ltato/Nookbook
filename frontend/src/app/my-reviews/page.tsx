"use client";

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ClientReviewsPanel } from "@/components/reviews/ClientReviewsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyReviewsPage() {
  const { isAuthenticated, isManager, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (isManager() || isAdmin()) {
      router.replace(isAdmin() ? "/admin" : "/manager");
    }
  }, [isAuthenticated, isManager, isAdmin, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Мои отзывы</h1>
            <p className="text-muted-foreground">
              Ваши отзывы об отелях и ответы менеджеров.
            </p>
          </div>
          <ClientReviewsPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
