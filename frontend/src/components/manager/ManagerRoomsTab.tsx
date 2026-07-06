"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Bed, Edit, CheckCircle, XCircle, Plus, Maximize, Users, Check, Coffee, Droplet, Tv, Wind, Lock, Sparkles, Utensils } from "lucide-react";
import type { Room, Booking } from "@/types/api";
import { roomsApi } from "@/lib/api";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { CatalogCheckMark } from "@/components/shared/CatalogCheckMark";
import { getRoomCarouselImages, normalizeRoomImageUrl } from "@/lib/imageUtils";

interface ManagerRoomsTabProps {
  roomsMap: Map<number, Room[]>;
  hotels: any[];
  bookings: Booking[];
  onEdit: (room: Room, hotelId: number) => void;
  onAdd: () => void;
  onBlock: (room: Room) => void;
  onUnblock: (room: Room) => void;
  refetch: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const ITEMS_PER_PAGE = 10;

const roomAmenityIcons: { [key: string]: any } = {
  "Чайник": Coffee,
  "Холодильник": Droplet,
  "Телевизор": Tv,
  "Кондиционер": Wind,
  "Сейф": Lock,
  "Фен": Sparkles,
};

export function ManagerRoomsTab({
  roomsMap,
  hotels,
  bookings,
  onEdit,
  onAdd,
  onBlock,
  onUnblock,
  refetch,
  search,
  onSearchChange,
}: ManagerRoomsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [roomToUnblock, setRoomToUnblock] = useState<Room | null>(null);

  const unblockRoomMutation = useMutation({
    mutationFn: (roomId: number) => roomsApi.unblock(roomId),
    onSuccess: () => {
      toast.success("Номер разблокирован");
      refetch();
    },
    onError: () => toast.error("Ошибка при разблокировке номера"),
  });

  const handleUnblockClick = (room: Room) => {
    setRoomToUnblock(room);
    setUnblockDialogOpen(true);
  };

  const confirmUnblock = () => {
    if (roomToUnblock) {
      unblockRoomMutation.mutate(roomToUnblock.id);
      setUnblockDialogOpen(false);
      setRoomToUnblock(null);
    }
  };

  const filteredRoomsMap = new Map<number, Room[]>();
  roomsMap.forEach((rooms, hotelId) => {
    const filteredRooms = rooms.filter((room) => {
      if (!search.trim()) return true;
      const s = search.trim().toLowerCase();
      const roomName = (room.name || room.roomNumber || `Номер ${room.id}`).toLowerCase();
      const roomType = (room.roomType || (room as any).type || "").toLowerCase();
      return roomName.includes(s) || roomType.includes(s);
    });
    if (filteredRooms.length > 0) {
      filteredRoomsMap.set(hotelId, filteredRooms);
    }
  });

  const allRooms = Array.from(filteredRoomsMap.values()).flat();
  const totalPages = Math.ceil(allRooms.length / ITEMS_PER_PAGE);
  const paginatedRooms = allRooms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginatedRoomsMap = new Map<number, Room[]>();
  paginatedRooms.forEach((room) => {
    const hotelRooms = paginatedRoomsMap.get(room.hotelId) || [];
    hotelRooms.push(room);
    paginatedRoomsMap.set(room.hotelId, hotelRooms);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Управление номерами</h2>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить номер
        </Button>
      </div>
      <div className="mb-4">
        <div className="relative max-w-md">
          <Input
            placeholder="Поиск по номеру или типу..."
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            className="pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      {allRooms.length === 0 ? (
        <Card className="p-12 text-center">
          <Bed className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Номера не найдены</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel: any) => {
            const hotelRooms = paginatedRoomsMap.get(hotel.id) || [];
            if (hotelRooms.length === 0) return null;
            return (
              <div key={hotel.id} className="space-y-3">
                {hotelRooms.map((room: Room) => {
                  const roomBookings = bookings.filter((b: Booking) => b.roomId === room.id);
                  const hasPendingBooking = roomBookings.some((b: Booking) => b.status === 'pending' || b.status === 'confirmed');
                  const displayImages = getRoomCarouselImages(room.images, room.imageUrl || room.image);
                  const hasRealImages = displayImages.some((img) => !img.includes("block.jpg"));
                  const hasMeal = room.mealLabel && room.mealLabel.length > 0;

                  return (
                    <Card key={room.id} className={`border rounded-lg p-5 transition-all ${room.isBlocked ? 'border-orange-400 bg-orange-50/5 opacity-80' : 'border-border/70 hover:border-primary/30'}`}>
                      <div className="flex flex-col md:flex-row items-stretch gap-4">
                        {hasRealImages && (
                          <div className="relative w-full md:w-56 min-h-[180px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 self-stretch">
                            <ImageCarousel
                              images={displayImages}
                              alt={room.name || room.roomNumber || `Номер ${room.id}`}
                              className="absolute inset-0 h-full w-full"
                              imageClassName="object-cover"
                              sizes="(max-width: 768px) 100vw, 320px"
                              normalize={normalizeRoomImageUrl}
                              fallback="/assets/rooms/block.jpg"
                            />
                            {room.isBlocked && (
                              <div className="absolute inset-0 bg-orange-900/60 flex flex-col items-center justify-center gap-1">
                                <XCircle className="w-8 h-8 text-white" />
                                <span className="text-white text-xs font-bold">Заблокирован</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-lg">{room.name || room.roomNumber || `Номер ${room.id}`}</h4>
                                <Badge variant="outline" className="text-xs">{room.roomType || "Без типа"}</Badge>
                                {room.isBlocked && <Badge variant="destructive" className="text-xs">Заблокирован</Badge>}
                              </div>
                              {room.blockReason && (
                                <p className="text-xs text-orange-600 mb-1">Причина: {room.blockReason}</p>
                              )}
                              {room.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm mb-3">
                                <div className="flex items-center gap-1">
                                  <Bed className="w-4 h-4 text-muted-foreground" />
                                  <span>{room.bedCount} {room.bedCount === 1 ? 'кровать' : room.bedCount && room.bedCount <= 4 ? 'кровати' : 'кроватей'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                  <span>до {room.maxGuests || room.capacity} {(room.maxGuests === 1 || room.capacity === 1) ? 'гостя' : 'гостей'}</span>
                                </div>
                                {room.size && (
                                  <div className="flex items-center gap-1">
                                    <Maximize className="w-4 h-4 text-muted-foreground" />
                                    <span>{room.size} м²</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => onEdit(room, hotel.id)} title="Редактировать">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {room.isBlocked ? (
                                  <Button variant="outline" size="sm" onClick={() => handleUnblockClick(room)}
                                    disabled={unblockRoomMutation.isPending}
                                    className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300" title="Разблокировать">
                                    <CatalogCheckMark checked size="sm" />
                                    <span className="sr-only sm:not-sr-only sm:inline text-xs font-medium">Разблок.</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onBlock(room)}
                                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300"
                                    title={hasPendingBooking ? "Нельзя заблокировать: есть активные бронирования" : "Заблокировать"}
                                    disabled={hasPendingBooking}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                          </div>
                            
                          {hasMeal && (
                            <div className="flex items-center gap-1.5 text-sm text-primary/80 font-medium">
                              <Utensils className="w-4 h-4" />
                              <span>{room.mealLabel}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border/50 flex items-end justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                              {room.amenities && room.amenities.length > 0 && room.amenities.map((amenity) => {
                                const Icon = roomAmenityIcons[amenity] || Check;
                                return (
                                  <div key={amenity} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Icon className="w-4 h-4 text-primary" />
                                    <span>{amenity}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-2xl font-bold text-primary mb-1">
                                {(room.price || room.pricePerNight || 0).toLocaleString()} BYN
                              </div>
                              <p className="text-sm text-muted-foreground">за сутки</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })}
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

      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-3xl font-semibold">Разблокировать номер?</AlertDialogTitle>
            <AlertDialogDescription>
              Номер "{roomToUnblock?.name || roomToUnblock?.roomNumber}" будет разблокирован и станет доступен для бронирования.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnblock}>
              Разблокировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
