"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { bookingsApi, reviewsApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import type { Booking } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeBookingStatus } from "@/lib/bookingStatus";
import React from "react";
import { BookingCard } from "@/components/bookings/BookingCard";
import { ReviewDialog } from "@/components/bookings/ReviewDialog";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function BookingsPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.User} allowedPaths={["/profile", "/admin", "/manager"]}>
      <BookingsPageContent />
    </ProtectedRoute>
  );
}

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id || 0;
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "checked-in" | "completed" | "cancelled"
  >("all");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewHotelId, setReviewHotelId] = useState<number | null>(null);
  const [reviewHotelName, setReviewHotelName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(10);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewPositiveTags, setReviewPositiveTags] = useState<string[]>([]);
  const [reviewNegativeTags, setReviewNegativeTags] = useState<string[]>([]);
  const [existingReviews, setExistingReviews] = useState<Record<number, boolean>>({});
  const [bookingCodeSearch, setBookingCodeSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelCode, setCancelCode] = useState("");
  const [handledBookingCodeParam, setHandledBookingCodeParam] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { data: bookingsResponse, isLoading: bookingsLoading, error, refetch } = useQuery({
    queryKey: ['bookings', userId],
    queryFn: async () => {
      if (!userId || userId <= 0) {
        throw new Error('User ID is not available');
      }
      try {
        const response = await bookingsApi.getUserBookings(userId);
        return response;
      } catch (err: any) {
        console.error('[Bookings] API Error:', err);
        throw err;
      }
    },
    enabled: !authLoading && userId > 0,
    retry: 1,
    retryDelay: 1000,
  });

  const { data: reviewsResponse } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: () => reviewsApi.getByUser(userId),
    enabled: !authLoading && userId > 0,
  });

  const isLoading = authLoading || bookingsLoading;

  const bookings: Booking[] = React.useMemo(() => {
    if (!bookingsResponse) return [];
    if (Array.isArray(bookingsResponse)) return bookingsResponse;
    if (Array.isArray(bookingsResponse.data)) return bookingsResponse.data;
    if (bookingsResponse.data && Array.isArray(bookingsResponse.data)) return bookingsResponse.data;
    return [];
  }, [bookingsResponse]);

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => bookingsApi.cancel(bookingId, userId),
    onSuccess: () => {
      toast.success("Бронирование отменено");
      refetch();
    },
    onError: () => {
      toast.error("Ошибка при отмене бронирования");
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData: any) => reviewsApi.create(reviewData),
    onSuccess: () => {
      toast.success("Отзыв успешно отправлен на модерацию");
      setShowReviewDialog(false);
      setReviewRating(10);
      setReviewComment("");
      setReviewPositiveTags([]);
      setReviewNegativeTags([]);
      setReviewBookingId(null);
      setReviewHotelId(null);
      setReviewHotelName("");
      setExistingReviews(prev => ({ ...prev, [reviewBookingId!]: true }));
    },
    onError: (error: any) => {
      const firstError = error?.response?.data?.errors?.[0];
      const errorMessage =
        firstError ||
        error?.response?.data?.message ||
        error?.message ||
        "Ошибка при создании отзыва";
      toast.error(errorMessage);
    },
  });

  const bookingStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      "checked-in": 0,
      completed: 0,
      cancelled: 0,
    };
    bookings.forEach((b) => {
      const key = normalizeBookingStatus(b.status);
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [bookings]);

  const filteredBookings = React.useMemo(() => {
    const statusFiltered = bookings.filter((booking) => {
      if (filter === "all") return true;
      return normalizeBookingStatus(booking.status) === filter;
    });
    if (!bookingCodeSearch.trim()) {
      return statusFiltered;
    }
    const normalized = bookingCodeSearch.trim().toLowerCase();
    return statusFiltered.filter((booking) =>
      (booking.bookingCode || "").toLowerCase().includes(normalized) ||
      (booking.hotelName || "").toLowerCase().includes(normalized)
    );
  }, [bookings, filter, bookingCodeSearch]);
  
  useEffect(() => {
    if (reviewsResponse && Array.isArray(reviewsResponse.data)) {
      const reviewMap: Record<number, boolean> = {};
      (reviewsResponse.data as any[]).forEach((review: any) => {
        if (review.bookingId) {
          reviewMap[review.bookingId] = true;
        }
      });
      setExistingReviews(reviewMap);
    }
  }, [reviewsResponse]);
  
  const handleWriteReview = (bookingId: number, hotelId: number, hotelName: string) => {
    setReviewBookingId(bookingId);
    setReviewHotelId(hotelId);
    setReviewHotelName(hotelName);
    setReviewPositiveTags([]);
    setReviewNegativeTags([]);
    setShowReviewDialog(true);
  };
  
  const handleSubmitReview = () => {
    if (!reviewHotelId || !reviewBookingId) {
      toast.error("Не удалось определить отель/бронирование");
      return;
    }
    if (!reviewComment.trim() && reviewPositiveTags.length === 0 && reviewNegativeTags.length === 0) {
      toast.error("Добавьте хотя бы один тег или комментарий");
      return;
    }
    createReviewMutation.mutate({
      userId,
      hotelId: reviewHotelId,
      bookingId: reviewBookingId,
      rating: reviewRating,
      comment: reviewComment.trim(),
      positiveTags: reviewPositiveTags,
      negativeTags: reviewNegativeTags,
    });
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Bookings] Auth loading:', authLoading);
      console.log('[Bookings] User:', user);
      console.log('[Bookings] User ID:', userId);
      console.log('[Bookings] Response:', bookingsResponse);
      console.log('[Bookings] Error:', error);
      console.log('[Bookings] Parsed bookings:', bookings);
      console.log('[Bookings] Filter:', filter);
      console.log('[Bookings] Filtered bookings:', filteredBookings);
    }
  }, [bookingsResponse, bookings, userId, filter, filteredBookings, error, authLoading, user]);

  const getStatusLabel = (status: string): string => {
    const key = normalizeBookingStatus(status);
    if (key === "pending") return "Ожидание";
    if (key === "confirmed") return "Подтверждено";
    if (key === "checked-in") return "Заселен";
    if (key === "completed") return "Завершено";
    if (key === "cancelled") return "Отменено";
    return status;
  };

  const getStatusBadge = (status: string) => {
    const key = normalizeBookingStatus(status);
    if (key === "pending") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Ожидание</Badge>;
    }
    if (key === "confirmed") {
      return <Badge className="bg-green-500 hover:bg-green-600">Подтверждено</Badge>;
    }
    if (key === "checked-in") {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Заселен</Badge>;
    }
    if (key === "completed") {
      return <Badge className="bg-gray-500 hover:bg-gray-600">Завершено</Badge>;
    }
    if (key === "cancelled") {
      return <Badge variant="destructive">Отменено</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const key = normalizeBookingStatus(status);
    if (key === "pending") return "from-yellow-500/70 via-yellow-400/60 to-orange-400/60";
    if (key === "confirmed") return "from-green-500/70 via-green-400/60 to-emerald-400/60";
    if (key === "checked-in") return "from-blue-500/70 via-blue-400/60 to-cyan-400/60";
    if (key === "completed") return "from-gray-500/70 via-gray-400/60 to-slate-400/60";
    if (key === "cancelled") return "from-red-500/70 via-red-400/60 to-rose-400/60";
    return "from-primary/70 via-yellow-400/60 to-orange-400/60";
  };

  const canCancel = (booking: Booking) => {
    const status = normalizeBookingStatus(booking.status);
    if (status === "cancelled" || status === "completed" || status === "checked-in") return false;
    
    const isManager = user?.role === "manager" || user?.role === "admin";
    
    if (isManager && (status === "pending" || status === "confirmed")) return true;
    
    if (status === "pending") return false;
    
    if (status === "confirmed") {
      const checkIn = new Date(booking.checkInDate);
      const now = new Date();
      const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilCheckIn >= 24;
    }
    
    return false;
  };

  const citySlugByName: Record<string, string> = {
    "минск": "minsk",
    "беларусь, минск": "minsk",
    "брест": "brest",
    "витебск": "vitebsk",
    "гомель": "gomel",
    "гродно": "grodno",
    "могилев": "mogilev",
  };

  const getBookingHotelUrl = (booking: Booking) => {
    const citySlug = citySlugByName[(booking.cityName || "").toLowerCase()] || (booking.cityName || "").toLowerCase();
    return `/hotels/${citySlug}/${booking.hotelId}`;
  };

  useEffect(() => {
    const bookingCodeFromUrl = searchParams.get("bookingCode")?.trim() || "";
    if (!bookingCodeFromUrl || handledBookingCodeParam === bookingCodeFromUrl || bookings.length === 0) {
      return;
    }

    setBookingCodeSearch(bookingCodeFromUrl);
    const matchedBooking = bookings.find(
      (booking) => (booking.bookingCode || "").toLowerCase() === bookingCodeFromUrl.toLowerCase()
    );

    if (searchParams.get("action") === "cancel" && matchedBooking && canCancel(matchedBooking)) {
      setCancelBooking(matchedBooking);
      setCancelCode(matchedBooking.bookingCode || bookingCodeFromUrl);
      setCancelDialogOpen(true);
    }

    setHandledBookingCodeParam(bookingCodeFromUrl);
  }, [searchParams, handledBookingCodeParam, bookings, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen page-backdrop">
        <Header />
        <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Загрузка...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.response?.data?.message 
      || (error as any)?.message 
      || 'Неизвестная ошибка';
    
    return (
      <div className="min-h-screen page-backdrop">
        <Header />
        <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <Card className="p-12 text-center">
              <p className="text-xl text-destructive mb-4">Ошибка при загрузке бронирований</p>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()}>Попробовать снова</Button>
                <Button variant="outline" onClick={() => router.push('/hotels')}>
                  Найти отели
                </Button>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Мои бронирования
            </h1>
            <p className="text-muted-foreground">
              Управляйте своими бронированиями
            </p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { value: "all", label: "Все" },
              { value: "pending", label: "Ожидание" },
              { value: "confirmed", label: "Подтверждено" },
              { value: "checked-in", label: "Заселен" },
              { value: "completed", label: "Завершено" },
              { value: "cancelled", label: "Отменено" },
            ].map((filterOption) => (
              <Button
                key={filterOption.value}
                variant={filter === filterOption.value ? "default" : "outline"}
                onClick={() => setFilter(filterOption.value as any)}
                size="sm"
              >
                {filterOption.label}
                <Badge variant="secondary" className="ml-2">
                  {bookingStatusCounts[filterOption.value] ?? 0}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Input
                placeholder="Поиск по коду или названию отеля..."
                value={bookingCodeSearch}
                onChange={(e) => { setBookingCodeSearch(e.target.value); setCurrentPage(1); }}
                className="pr-10"
              />
              {bookingCodeSearch && (
                <button
                  type="button"
                  onClick={() => setBookingCodeSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label="Очистить поиск"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-xl text-muted-foreground mb-4">
                {bookingCodeSearch
                  ? "Бронь не найдена"
                  : (filter === "all" ? "У вас пока нет бронирований" : `Нет бронирований со статусом "${getStatusLabel(filter)}"`)}
              </p>
              <Button onClick={() => router.push("/hotels")}>
                Найти отели
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  existingReviews={existingReviews}
                  onViewHotel={(b) => router.push(getBookingHotelUrl(b))}
                  onCancel={(b) => {
                    setCancelBooking(b);
                    setCancelCode("");
                    setCancelDialogOpen(true);
                  }}
                  onWriteReview={(b) => handleWriteReview(b.id, b.hotelId, b.hotelName)}
                  canCancel={canCancel}
                  getStatusBadge={getStatusBadge}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
              {Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredBookings.length / ITEMS_PER_PAGE), p + 1))}
                        className={currentPage === Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        hotelName={reviewHotelName}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        comment={reviewComment}
        onCommentChange={setReviewComment}
        positiveTags={reviewPositiveTags}
        negativeTags={reviewNegativeTags}
        onPositiveTagsChange={setReviewPositiveTags}
        onNegativeTagsChange={setReviewNegativeTags}
        onSubmit={handleSubmitReview}
        isSubmitting={createReviewMutation.isPending}
      />

      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        booking={cancelBooking}
        cancelCode={cancelCode}
        onCancelCodeChange={setCancelCode}
        onConfirm={() => {
          if (!cancelBooking) return;
          if ((cancelBooking.bookingCode || "").toLowerCase() !== cancelCode.trim().toLowerCase()) {
            toast.error("Код бронирования не совпадает");
            return;
          }
          cancelMutation.mutate(cancelBooking.id);
          setCancelDialogOpen(false);
        }}
        isSubmitting={cancelMutation.isPending}
      />

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Детали бронирования</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{selectedBooking.bookingCode}</div>
              <div>Гость: {selectedBooking.userName}</div>
              <div>Отель: {selectedBooking.hotelName}</div>
              <div>Тип номера: {selectedBooking.roomType}</div>
              <div>Номер: {selectedBooking.roomName || "-"}</div>
              <div>Даты: {format(new Date(selectedBooking.checkInDate || ""), "d MMM yyyy", { locale: ru })} - {format(new Date(selectedBooking.checkOutDate || ""), "d MMM yyyy", { locale: ru })}</div>
              <div>Ночей: {Math.max(1, Math.ceil((new Date(selectedBooking.checkOutDate || "").getTime() - new Date(selectedBooking.checkInDate || "").getTime()) / (1000 * 60 * 60 * 24)))}</div>
              <div>Сумма: {selectedBooking.totalPrice.toLocaleString()} BYN</div>
              <div>Статус: {getStatusLabel(selectedBooking.status || "")}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
