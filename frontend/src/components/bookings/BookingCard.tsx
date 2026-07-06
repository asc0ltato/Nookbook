"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Bed, X, Star } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Booking } from "@/types/api";
import { normalizeRoomImageUrl } from "@/lib/imageUtils";
import { ImageCarousel } from "@/components/shared/ImageCarousel";

interface BookingCardProps {
  booking: Booking;
  existingReviews: Record<number, boolean>;
  onViewHotel: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onWriteReview: (booking: Booking) => void;
  canCancel: (booking: Booking) => boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export function BookingCard({
  booking,
  existingReviews,
  onViewHotel,
  onCancel,
  onWriteReview,
  canCancel,
  getStatusBadge,
  getStatusColor,
  getStatusLabel,
}: BookingCardProps) {
  return (
    <Card className="p-0 overflow-hidden border-border/70 bg-gradient-to-br from-card to-card/80 shadow-sm hover:shadow-lg transition-all">
      <div className={`h-1 w-full bg-gradient-to-r ${getStatusColor(booking.status || "pending")}`} />
      <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr]">
        <div className="relative min-h-[12rem] md:min-h-full bg-gray-200">
          <ImageCarousel
            images={booking.roomImageUrls?.length ? booking.roomImageUrls : [booking.roomImageUrl || ""]}
            alt={`${booking.hotelName} - ${booking.roomType}`}
            sizes="288px"
            className="absolute inset-0 h-full w-full"
            imageClassName="object-cover"
            normalize={normalizeRoomImageUrl}
          />
        </div>

        <div className="p-6 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-4 gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-bold mb-2">{booking.hotelName}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.cityName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Bed className="w-4 h-4" />
                  <span className="font-medium">
                    {booking.roomType || "Тип номера"} {booking.roomName ? `(${booking.roomName})` : ""}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-2">
                  {booking.totalPrice.toLocaleString()} BYN
                </div>
                <div className="space-y-1">{getStatusBadge(booking.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Заезд</div>
                  <div className="font-semibold">
                    {format(new Date(booking.checkInDate), "d MMM yyyy", { locale: ru })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Выезд</div>
                  <div className="font-semibold">
                    {format(new Date(booking.checkOutDate), "d MMM yyyy", { locale: ru })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Гости</div>
                  <div className="font-semibold">{booking.guestCount}</div>
                </div>
              </div>
            </div>

            {booking.specialRequests && (
              <div className="mb-4 p-3 bg-muted rounded-lg min-w-0 overflow-hidden">
                <div className="text-sm font-semibold mb-1">Особые пожелания:</div>
                <div className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                  {booking.specialRequests}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Создано: {format(new Date(booking.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewHotel(booking)}
                  className="flex-1 sm:flex-initial"
                >
                  Посмотреть отель
                </Button>
                {canCancel(booking) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onCancel(booking)}
                    className="flex-1 sm:flex-initial"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отменить
                  </Button>
                )}
                {booking.status?.toLowerCase() === "completed" && !existingReviews[booking.id] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onWriteReview(booking)}
                    className="flex-1 sm:flex-initial text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Написать отзыв
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
    </Card>
  );
}
