"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar, CheckCircle, Edit, MapPin, Bed, Users } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Image from "next/image";
import type { Booking } from "@/types/api";
import { bookingsApi } from "@/lib/api";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { normalizeRoomImageUrl } from "@/lib/imageUtils";
import { normalizeBookingStatus } from "@/lib/bookingStatus";
import { isCheckInDayReached } from "@/lib/dateUtils";

interface ManagerBookingsTabProps {
  bookings: Booking[];
  statusCounts?: Record<string, number>;
  onEdit: (booking: Booking) => void;
  onAdd: () => void;
  refetch: () => void;
}

const ITEMS_PER_PAGE = 5;

const EDITABLE_BOOKING_STATUSES = new Set(["pending", "confirmed", "checked-in"]);

function canEditBooking(booking: Booking): boolean {
  return EDITABLE_BOOKING_STATUSES.has(normalizeBookingStatus(booking.status));
}

export function ManagerBookingsTab({ bookings, statusCounts, onEdit, onAdd, refetch }: ManagerBookingsTabProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "checked-in" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

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

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, bookingData }: { bookingId: number; bookingData: any }) =>
      bookingsApi.update(bookingId, bookingData),
    onSuccess: () => {
      toast.success("Бронирование обновлено");
      setStatusUpdatingId(null);
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.errors?.[0] || error?.message || "Ошибка при обновлении";
      toast.error(errorMessage);
      setStatusUpdatingId(null);
      refetch();
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: (bookingId: number) => bookingsApi.sendReminder(bookingId),
    onSuccess: () => toast.success("Напоминание отправлено клиенту"),
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "Не удалось отправить напоминание";
      toast.error(msg);
    },
  });

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return normalizeBookingStatus(booking.status) === filter;
  }).filter((booking) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (booking.bookingCode || "").toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
    <div>
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap items-center">
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
              {statusCounts && (
                <Badge variant="secondary" className="ml-2">
                  {statusCounts[filterOption.value] ?? 0}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <Button onClick={onAdd}>
          <Calendar className="w-4 h-4 mr-2" />
          Добавить бронирование
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative w-full max-w-xl">
          <Input
            placeholder="Поиск по коду бронирования..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Бронирования не найдены</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedBookings.map((booking: Booking) => (
              <Card key={booking.id} className="p-0 overflow-hidden border-border/70 bg-gradient-to-br from-card to-card/80 shadow-sm hover:shadow-lg transition-all">
                <div className={`h-1 w-full bg-gradient-to-r ${getStatusColor(booking.status || "pending")}`} />
                <div className="p-6 relative">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-200 md:w-56 md:h-auto md:min-h-[220px] self-stretch">
                      <ImageCarousel
                        images={booking.roomImageUrls?.length ? booking.roomImageUrls : [booking.roomImageUrl || ""]}
                        alt={`${booking.hotelName} - ${booking.roomType}`}
                        sizes="224px"
                        className="absolute inset-0 h-full w-full"
                        normalize={normalizeRoomImageUrl}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold">{booking.hotelName}</h3>
                          {getStatusBadge(booking.status || "pending")}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2 mt-1">
                          {booking.bookingCode && (
                            <button
                              type="button"
                              onClick={() => setDetailBooking(booking)}
                              className="mt-1 inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer"
                              title="Открыть детали бронирования"
                            >
                              {booking.bookingCode}
                            </button>
                          )}
                          <MapPin className="w-4 h-4" />
                          <span>{booking.cityName}</span>
                          <span>•</span>
                          <Bed className="w-4 h-4" />
                          <span>{booking.roomType || "Тип номера"} {booking.roomName ? `(${booking.roomName})` : ""}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{booking.userName}</span>
                        </div>
                        {booking.statusBy && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Статус изменил: {booking.statusBy}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Заезд</div>
                          <div className="font-semibold">
                            {format(new Date(booking.checkInDate), "d MMM yyyy", { locale: ru })}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Выезд</div>
                          <div className="font-semibold">
                            {format(new Date(booking.checkOutDate), "d MMM yyyy", { locale: ru })}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Гости</div>
                          <div className="font-semibold">{booking.guestCount}</div>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <div className="text-sm font-semibold mb-1">Особые пожелания:</div>
                          <div className="text-sm text-muted-foreground">{booking.specialRequests}</div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-4 border-t border-border">
                        {normalizeBookingStatus(booking.status) === "pending" && (
                          <Button
                            onClick={() => {
                              if (statusUpdatingId !== null) return;
                              setStatusUpdatingId(booking.id);
                              updateBookingMutation.mutate({
                                bookingId: booking.id,
                                bookingData: { status: "confirmed" },
                              });
                            }}
                            disabled={statusUpdatingId !== null}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Подтвердить
                          </Button>
                        )}
                        {normalizeBookingStatus(booking.status) === "confirmed" && (
                          <>
                            <Button
                              onClick={() => {
                                if (statusUpdatingId !== null) return;
                                setStatusUpdatingId(booking.id);
                                updateBookingMutation.mutate({
                                  bookingId: booking.id,
                                  bookingData: { status: "checked-in" },
                                });
                              }}
                              disabled={statusUpdatingId !== null || !isCheckInDayReached(booking.checkInDate)}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Заселить
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                if (statusUpdatingId !== null) return;
                                setStatusUpdatingId(booking.id);
                                updateBookingMutation.mutate({
                                  bookingId: booking.id,
                                  bookingData: { status: "cancelled" },
                                });
                              }}
                              disabled={statusUpdatingId !== null}
                              className="flex-1"
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {normalizeBookingStatus(booking.status) === "checked-in" && (
                          <Button
                            onClick={() => {
                              if (statusUpdatingId !== null) return;
                              setStatusUpdatingId(booking.id);
                              updateBookingMutation.mutate({
                                bookingId: booking.id,
                                bookingData: { status: "completed" },
                              });
                            }}
                            disabled={statusUpdatingId !== null}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Завершить
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48 flex-shrink-0">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        {canEditBooking(booking) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(booking)}
                            className="h-8 w-8"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-right mt-auto">
                        <div className="text-xl font-bold text-primary mb-2">
                          Итого: {booking.totalPrice.toLocaleString()} BYN
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>

      <Dialog open={!!detailBooking} onOpenChange={(open) => !open && setDetailBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Детали бронирования</DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">{detailBooking.hotelName}</h3>
                {getStatusBadge(detailBooking.status || "pending")}
              </div>
              <div className="text-2xl font-bold text-primary">{detailBooking.bookingCode}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Гость</div>
                  <div className="font-medium">{detailBooking.userName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Тип номера</div>
                  <div className="font-medium">{detailBooking.roomType || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Заезд</div>
                  <div className="font-medium">{format(new Date(detailBooking.checkInDate), "d MMM yyyy", { locale: ru })}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Выезд</div>
                  <div className="font-medium">{format(new Date(detailBooking.checkOutDate), "d MMM yyyy", { locale: ru })}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Гостей</div>
                  <div className="font-medium">{detailBooking.guestCount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Сумма</div>
                  <div className="font-bold text-primary">{detailBooking.totalPrice.toLocaleString()} BYN</div>
                </div>
              </div>
              {detailBooking.specialRequests && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-semibold mb-1">Особые пожелания:</div>
                  <div className="text-muted-foreground">{detailBooking.specialRequests}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
