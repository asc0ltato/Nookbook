"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { hotelsApi } from "@/lib/api";
import { ManagerReviewsPanel } from "@/components/reviews/ManagerReviewsPanel";
import { ArrowLeft } from "lucide-react";

export default function ManagerReviewsPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.Manager} allowedPaths={["/manager/reviews", "/manager"]}>
      <ManagerReviewsContent />
    </ProtectedRoute>
  );
}

function ManagerReviewsContent() {
  const { user } = useAuth();
  const [selectedHotelId, setSelectedHotelId] = useState<number | undefined>();

  const { data: hotelsResponse } = useQuery({
    queryKey: ["manager-hotels-reviews", user?.id],
    queryFn: () => hotelsApi.getManagerHotels(user!.id),
    enabled: !!user?.id,
  });

  const hotels = Array.isArray(hotelsResponse?.data) ? hotelsResponse.data : [];
  const hotelId = selectedHotelId ?? hotels[0]?.id;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href="/manager"
          className="inline-flex items-center mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          К панели менеджера
        </Link>
        {hotelId ? (
          <ManagerReviewsPanel
            hotelId={hotelId}
            hotelOptions={hotels.map((h: { id: number; name: string }) => ({ id: h.id, name: h.name }))}
            onHotelChange={setSelectedHotelId}
          />
        ) : (
          <p className="text-muted-foreground">Нет привязанных отелей</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
