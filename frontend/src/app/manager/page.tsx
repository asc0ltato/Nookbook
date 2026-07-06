"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Bed,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManagerBookingsTab } from "@/components/manager/ManagerBookingsTab";
import { BookingDialog } from "@/components/manager/BookingDialog";
import { ManagerRoomsTab } from "@/components/manager/ManagerRoomsTab";
import { ManagerReviewsPanel } from "@/components/reviews/ManagerReviewsPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BlockReasonPicker, resolveBlockReason } from "@/components/shared/BlockReasonPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingsApi, roomsApi, hotelsApi, usersApi, API_BASE_URL } from "@/lib/api";
import type { Booking, Room } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { getRoomGalleryImages, normalizeRoomImageUrl } from "@/lib/imageUtils";
import { normalizeBookingStatus } from "@/lib/bookingStatus";
import { isBookableUser } from "@/lib/userUtils";
const MEAL_OPTIONS = [
  { value: "0", label: "с собственной кухней" },
  { value: "1", label: "завтрак включен" },
  { value: "2", label: "завтрак и ужин включены" },
] as const;

export default function ManagerPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.Manager} allowedPaths={["/manager", "/hotels"]}>
      <ManagerPageContent />
    </ProtectedRoute>
  );
}

function ManagerPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const invalidateBookingCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["manager-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["manager-available-rooms"] });
  };
  const [activeTab, setActiveTab] = useState("bookings");
  const [roomSearch, setRoomSearch] = useState("");
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedRoomForBlock, setSelectedRoomForBlock] = useState<Room | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(true);

  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: "",
    description: "",
    price: "",
    bedCount: "",
    maxGuests: "",
    size: "",
    images: [] as string[],
    hotelId: 0,
    roomTypeId: 0,
    amenityTypeIds: [] as number[],
    mealType: "0",
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [unblockRoomDialogOpen, setUnblockRoomDialogOpen] = useState(false);
  const [roomToUnblock, setRoomToUnblock] = useState<Room | null>(null);

  const { data: usersResponse } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => usersApi.getAll(),
    enabled: !!user?.id,
  });
  
  const allUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];

  const { data: managerHotelsResponse } = useQuery({
    queryKey: ['manager-hotels', user?.id],
    queryFn: () => hotelsApi.getManagerHotels(user?.id || 0),
    enabled: !!user?.id,
  });

  const hotels = Array.isArray(managerHotelsResponse?.data) ? managerHotelsResponse.data : [];
  const managerHotels = hotels;
  const managerHotelIds = managerHotels.map((h: any) => h.id);

  const { data: roomTypesResponse } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => roomsApi.getTypes(),
  });

  const roomTypes = Array.isArray(roomTypesResponse?.data) ? roomTypesResponse.data : [];

  const { data: roomAmenityTypesResponse } = useQuery({
    queryKey: ['room-amenity-types'],
    queryFn: () => roomsApi.getAmenityTypes(),
  });

  const roomAmenityTypes = Array.isArray(roomAmenityTypesResponse?.data) ? roomAmenityTypesResponse.data : [];

  const managerHotel = managerHotels.length > 0 ? managerHotels[0] : null;
  const [reviewsHotelId, setReviewsHotelId] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (managerHotel?.id && reviewsHotelId == null) {
      setReviewsHotelId(managerHotel.id);
    }
  }, [managerHotel?.id, reviewsHotelId]);

  const lockRoomTypeFields =
    !!editingRoom || (!editingRoom && roomFormData.roomTypeId > 0);

  const { data: bookingsResponse, refetch: refetchBookings } = useQuery({
    queryKey: ['manager-bookings', user?.id],
    queryFn: () => bookingsApi.getAll(),
  });

  const allBookings: Booking[] = (Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : []);
  const hotelBookings = allBookings.filter((b: Booking) => managerHotelIds.includes(b.hotelId));

  const clientUsers = useMemo(
    () => allUsers.filter((u) => isBookableUser(u)),
    [allUsers],
  );

  const bookingStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: hotelBookings.length,
      pending: 0,
      confirmed: 0,
      "checked-in": 0,
      completed: 0,
      cancelled: 0,
    };
    hotelBookings.forEach((b) => {
      const key = normalizeBookingStatus(b.status);
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [hotelBookings]);

  const filteredBookings = useMemo(() => {
    return hotelBookings.filter((booking) => {
      if (bookingFilter === "all") return true;
      return normalizeBookingStatus(booking.status) === bookingFilter;
    }).filter((booking) => {
      if (!bookingSearch) return true;
      const searchLower = bookingSearch.toLowerCase();
      return (booking.bookingCode || "").toLowerCase().includes(searchLower);
    });
  }, [hotelBookings, bookingFilter, bookingSearch]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "reviews" || tab === "bookings" || tab === "rooms") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddBooking = () => {
    setEditingBooking(null);
    setBookingsDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setBookingsDialogOpen(true);
  };

  const { data: roomsData, refetch: refetchRooms } = useQuery({
    queryKey: ['manager-rooms', managerHotels.map((h: any) => h.id).join(',')],
    queryFn: async () => {
      const roomTypeGroupsMap = new Map<number, any[]>();
      const roomsMap = new Map<number, Room[]>();
      await Promise.all(
        managerHotels.map(async (hotel: any) => {
          try {
            const response = await roomsApi.getRoomTypeGroups(hotel.id);
            if (response.success && Array.isArray(response.data)) {
              roomTypeGroupsMap.set(hotel.id, response.data);
            }
            const roomsResponse = await roomsApi.getByHotel(hotel.id);
            if (roomsResponse.success && Array.isArray(roomsResponse.data)) {
              roomsMap.set(hotel.id, roomsResponse.data as Room[]);
            }
          } catch (error) {
            console.error(`Error fetching rooms for hotel ${hotel.id}:`, error);
          }
        })
      );
      return { roomTypeGroupsMap, roomsMap };
    },
    enabled: managerHotels.length > 0,
    retry: false,
  });

  const roomsMap = roomsData?.roomsMap || new Map<number, Room[]>();

  const filteredRoomsMap = useMemo(() => {
    if (!roomSearch.trim()) return roomsMap;
    const filtered = new Map<number, Room[]>();
    roomsMap.forEach((rooms, hotelId) => {
      const filteredRooms = rooms.filter((room) => {
        const s = roomSearch.trim().toLowerCase();
        const roomName = (room.name || room.roomNumber || `Номер ${room.id}`).toLowerCase();
        const roomType = (room.roomType || (room as any).type || "").toLowerCase();
        return roomName.includes(s) || roomType.includes(s);
      });
      if (filteredRooms.length > 0) {
        filtered.set(hotelId, filteredRooms);
      }
    });
    return filtered;
  }, [roomsMap, roomSearch]);

  const createRoomMutation = useMutation({
    mutationFn: (roomData: any) => roomsApi.create(roomData),
    onSuccess: () => {
      toast.success("Номер создан");
      setRoomsDialogOpen(false);
      resetRoomForm();
      refetchRooms();
      invalidateBookingCaches();
    },
    onError: (error: any) => {
      console.error("Create room error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Ошибка при создании номера";
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        toast.error(validationErrors.join(", "));
      } else if (errorMessage && errorMessage !== "Request failed") {
        toast.error(errorMessage);
      } else {
        toast.error("Ошибка при создании номера");
      }
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, roomData }: { id: number; roomData: any }) => roomsApi.update(id, roomData),
    onSuccess: () => {
      toast.success("Номер обновлен");
      setRoomsDialogOpen(false);
      setEditingRoom(null);
      resetRoomForm();
      refetchRooms();
      invalidateBookingCaches();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Ошибка при обновлении номера";
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        toast.error(validationErrors.join(", "));
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const blockRoomMutation = useMutation({
    mutationFn: ({ roomId, reason }: { roomId: number; reason: string }) => 
      roomsApi.block(roomId, reason),
    onSuccess: () => {
      toast.success("Номер заблокирован");
      refetchRooms();
      setBlockDialogOpen(false);
      setBlockReason("");
      setCustomReason("");
      setSelectedRoomForBlock(null);
    },
    onError: (error: any) => {
      const d = error?.response?.data;
      const msg =
        d?.message ||
        d?.Message ||
        (Array.isArray(d?.errors) ? d.errors[0] : undefined) ||
        error?.message ||
        "Ошибка при блокировке номера";
      toast.error(msg);
    },
  });

  const unblockRoomMutation = useMutation({
    mutationFn: (roomId: number) => roomsApi.unblock(roomId),
    onSuccess: () => {
      toast.success("Номер разблокирован");
      refetchRooms();
    },
    onError: () => toast.error("Ошибка при разблокировке номера"),
  });

  const resetRoomForm = () => {
    setRoomFormData({
      roomNumber: "",
      description: "",
      price: "",
      bedCount: "",
      maxGuests: "",
      size: "",
      images: [],
      hotelId: managerHotel?.id || 0,
      roomTypeId: 0,
      amenityTypeIds: [],
      mealType: "0",
    });
    setEditingRoom(null);
  };

  const handleRoomImageChange = async (file: File) => {
    if (roomFormData.images.length >= 5) {
      toast.error("Максимальное количество фото - 5");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setRoomFormData((prev) => ({
      ...prev,
      images: [...prev.images, previewUrl],
    }));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/uploads/rooms`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();
      const isSuccess = data?.success === true || data?.Success === true;

      if (!response.ok || !isSuccess) {
        throw new Error(data?.message || data?.Message || "Ошибка загрузки изображения");
      }

      const imagePath = (data.data ?? data.Data) as string;
      setRoomFormData((prev) => ({
        ...prev,
        images: prev.images
          .map((img) => (img === previewUrl ? imagePath : img))
          .filter((image) => image !== "/assets/rooms/block.jpg"),
      }));
      toast.success("Фото добавлено");
    } catch (error: any) {
      console.error("Upload error", error);
      setRoomFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== previewUrl),
      }));
      toast.error(error?.message || "Не удалось загрузить изображение");
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveRoomImage = (index: number) => {
    setRoomFormData((prev) => {
      const removed = prev.images[index];
      if (removed?.startsWith("blob:")) {
        URL.revokeObjectURL(removed);
      }
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setRoomFormData((prev) => {
      const newImages = [...prev.images];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      return { ...prev, images: newImages };
    });
    toast.success("Главное фото изменено");
  };

  const resolveRoomImages = (room: Room): string[] =>
    getRoomGalleryImages(room.images, room.imageUrl || room.image);

  const handleEditRoom = (room: Room, hotelId: number) => {
    setEditingRoom(room);
    const roomType =
      room.roomTypeId && room.roomTypeId > 0
        ? roomTypes.find((rt: { id: number }) => rt.id === room.roomTypeId)
        : roomTypes.find(
            (rt: { id: number; name: string }) =>
              rt.name === room.roomType || rt.name === room.type
          );
    const amenityTypeIds = room.amenities
      ? room.amenities
          .map((amenityName: string) => {
            const amenityType = roomAmenityTypes.find((at: any) => at.name === amenityName);
            return amenityType?.id;
          })
          .filter((id: number | undefined): id is number => id !== undefined)
      : [];
    setRoomFormData({
      roomNumber: room.roomNumber || room.name || "",
      description: room.description || "",
      price: Math.round(room.price ?? room.pricePerNight ?? 0).toString(),
      bedCount: room.bedCount.toString(),
      maxGuests: room.maxGuests.toString(),
      size: room.size?.toString() || "",
      images: resolveRoomImages(room),
      hotelId: room.hotelId || hotelId,
      roomTypeId: room.roomTypeId || roomType?.id || 0,
      amenityTypeIds,
      mealType: String(room.mealType ?? 0),
    });
    setRoomsDialogOpen(true);
  };

  const handleUnblockRoom = (room: Room) => {
    setRoomToUnblock(room);
    setUnblockRoomDialogOpen(true);
  };

  const confirmUnblockRoom = () => {
    if (roomToUnblock) {
      unblockRoomMutation.mutate(roomToUnblock.id);
      setUnblockRoomDialogOpen(false);
      setRoomToUnblock(null);
    }
  };

  const handleBlockRoom = (room: Room) => {
    setSelectedRoomForBlock(room);
    setIsBlocking(true);
    setBlockReason("");
    setCustomReason("");
    setBlockDialogOpen(true);
  };

  const handleBlockDialogSubmit = () => {
    if (!selectedRoomForBlock) return;

    const finalReason = blockReason === "Другое" ? customReason.trim() : blockReason;
    if (!finalReason || finalReason.trim() === "") {
      toast.error("Укажите причину блокировки");
      return;
    }

    if (isBlocking) {
      blockRoomMutation.mutate({
        roomId: selectedRoomForBlock.id,
        reason: finalReason,
      });
    }
  };

  const predefinedReasons = [
    "Ремонт номер",
    "Технические работы",
    "Санитарная обработка",
    "По запросу владельца",
    "Другое",
  ];

  const handleSubmitRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!managerHotel) {
      toast.error("Отель не найден");
      return;
    }
    if (roomFormData.images.some((img) => img.startsWith("blob:"))) {
      toast.error("Дождитесь окончания загрузки всех фото");
      return;
    }

    if (!roomFormData.roomTypeId || roomFormData.roomTypeId <= 0) {
      toast.error("Выберите тип номера");
      return;
    }
    if (!roomFormData.roomNumber.trim()) {
      toast.error("Укажите номер комнаты");
      return;
    }
    if (roomFormData.description && roomFormData.description.trim().length > 500) {
      toast.error("Описание номера не должно превышать 500 символов");
      return;
    }
    if (!roomFormData.price || parseInt(roomFormData.price) <= 0) {
      toast.error("Цена должна быть больше 0");
      return;
    }
    if (!["0", "1", "2"].includes(roomFormData.mealType)) {
      toast.error("Укажите вариант питания");
      return;
    }
    if (parseInt(roomFormData.price) > 1000) {
      toast.error("Цена не должна превышать 1000 BYN");
      return;
    }
    if (!roomFormData.bedCount || parseInt(roomFormData.bedCount) < 1) {
      toast.error("Количество кроватей должно быть не менее 1");
      return;
    }
    if (parseInt(roomFormData.bedCount) > 20) {
      toast.error("Количество кроватей не должно превышать 20");
      return;
    }
    if (!roomFormData.maxGuests || parseInt(roomFormData.maxGuests) < 1) {
      toast.error("Максимальное количество гостей должно быть не менее 1");
      return;
    }
    if (parseInt(roomFormData.maxGuests) > 50) {
      toast.error("Максимальное количество гостей не должно превышать 50");
      return;
    }
    if (roomFormData.size && parseFloat(roomFormData.size) < 0) {
      toast.error("Площадь не может быть отрицательной");
      return;
    }
    if (roomFormData.size && parseFloat(roomFormData.size) > 150) {
      toast.error("Площадь не должна превышать 150 м²");
      return;
    }

    const roomData = {
      roomNumber: roomFormData.roomNumber.trim(),
      description: roomFormData.description.trim() || null,
      price: parseInt(roomFormData.price),
      bedCount: parseInt(roomFormData.bedCount),
      maxGuests: parseInt(roomFormData.maxGuests),
      size: roomFormData.size ? parseFloat(roomFormData.size) : null,
      images: roomFormData.images.filter(
        (img) => img && !img.startsWith("blob:") && !img.includes("block.jpg"),
      ),
      image:
        roomFormData.images.find(
          (img) => img && !img.startsWith("blob:") && !img.includes("block.jpg"),
        ) ?? null,
      hotelId: managerHotel.id,
      roomTypeId: roomFormData.roomTypeId,
      amenityTypeIds: roomFormData.amenityTypeIds,
      mealType: parseInt(roomFormData.mealType, 10),
    };

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, roomData });
    } else {
      createRoomMutation.mutate(roomData);
    }
  };

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Панель менеджера
            </h1>
            <p className="text-muted-foreground">
              Управление бронированиями
            </p>
            {managerHotel && (
              <div className="mt-3">
                <Link
                  href={`/hotels/${(() => {
                    const cityName = (typeof managerHotel.city === 'string' ? managerHotel.city : managerHotel.city?.name || '').toLowerCase();
                    const cityMap: Record<string, string> = {
                      'минск': 'minsk', 'брест': 'brest', 'витебск': 'vitebsk',
                      'гомель': 'gomel', 'гродно': 'grodno', 'могилев': 'mogilev'
                    };
                    return cityMap[cityName] || cityName;
                  })()}/${managerHotel.id}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  Перейти к странице отеля: {managerHotel.name}
                </Link>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Бронирования ({Array.isArray(filteredBookings) ? filteredBookings.length : 0})
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Номера
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Отзывы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <ManagerBookingsTab
                bookings={filteredBookings}
                statusCounts={bookingStatusCounts}
                onEdit={handleEditBooking}
                onAdd={handleAddBooking}
                refetch={refetchBookings}
              />
            </TabsContent>

            <TabsContent value="rooms">
              <ManagerRoomsTab
                roomsMap={filteredRoomsMap}
                hotels={managerHotels}
                bookings={hotelBookings}
                onEdit={handleEditRoom}
                onAdd={() => {
                  resetRoomForm();
                  setRoomsDialogOpen(true);
                }}
                onBlock={handleBlockRoom}
                onUnblock={handleUnblockRoom}
                refetch={refetchRooms}
                search={roomSearch}
                onSearchChange={setRoomSearch}
              />
            </TabsContent>

            <Dialog open={roomsDialogOpen} onOpenChange={(open) => {
              setRoomsDialogOpen(open);
              if (!open) {
                resetRoomForm();
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-playfair text-3xl font-semibold">
                    {editingRoom ? "Редактировать номер" : "Добавить номер"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitRoom} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Номер комнаты *</Label>
                    <Input
                      id="roomNumber"
                      value={roomFormData.roomNumber}
                      onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                      placeholder="101"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomTypeId">Тип номера *</Label>
                    <Select
                      value={roomFormData.roomTypeId ? String(roomFormData.roomTypeId) : ""}
                      onValueChange={(value) => {
                        const selectedTypeId = parseInt(value);
                        const fullRoomTypes = Array.isArray(roomTypesResponse?.data) ? roomTypesResponse.data : [];
                        const selectedType = fullRoomTypes.find((rt: any) => rt.id === selectedTypeId);
                        if (selectedType && !editingRoom) {
                          setRoomFormData({
                            ...roomFormData,
                            roomTypeId: selectedTypeId,
                            description: selectedType.description || roomFormData.description,
                            bedCount: selectedType.bedCount ? String(selectedType.bedCount) : roomFormData.bedCount,
                            maxGuests: selectedType.maxGuests ? String(selectedType.maxGuests) : roomFormData.maxGuests,
                            size: selectedType.size ? String(selectedType.size) : roomFormData.size,
                          });
                        } else {
                          setRoomFormData({ ...roomFormData, roomTypeId: selectedTypeId });
                        }
                      }}
                    >
                      <SelectTrigger
                        disabled={!!editingRoom}
                        className={editingRoom ? "bg-muted opacity-80" : ""}
                      >
                        <SelectValue placeholder="Выберите тип номера">
                          {roomFormData.roomTypeId
                            ? roomTypes.find((rt: { id: number }) => rt.id === roomFormData.roomTypeId)?.name ||
                              "Выберите тип номера"
                            : "Выберите тип номера"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((roomType: any) => (
                          <SelectItem key={roomType.id} value={String(roomType.id)}>
                            {roomType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!editingRoom && roomFormData.roomTypeId > 0 && (
                      <p className="text-xs text-amber-500 font-medium">Поля заполнены из типа номера и не редактируются. Для изменения выберите другой тип.</p>
                    )}
                    {editingRoom && (
                      <p className="text-xs text-muted-foreground">Тип номера и параметры, заданные при создании, нельзя менять здесь.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomDescription">
                      Описание номера
                    </Label>
                    <Textarea
                      id="roomDescription"
                      value={roomFormData.description}
                      onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                      rows={4}
                      placeholder="Опишите особенности номера, удобства, вид из окна..."
                      className={`resize-none ${lockRoomTypeFields ? 'bg-muted opacity-70' : ''}`}
                      disabled={lockRoomTypeFields}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomPrice">
                        Цена за сутки (BYN) *
                      </Label>
                      <Input
                        id="roomPrice"
                        type="number"
                        min="1"
                        max="1000"
                        value={roomFormData.price}
                        onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })}
                        placeholder="100"
                        required
                        disabled={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mealType">Питание *</Label>
                      <Select
                        value={roomFormData.mealType}
                        onValueChange={(value) => setRoomFormData({ ...roomFormData, mealType: value })}
                      >
                        <SelectTrigger id="mealType">
                          <SelectValue placeholder="Выберите питание">
                            {MEAL_OPTIONS.find((o) => o.value === roomFormData.mealType)?.label ||
                              "Выберите питание"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomSize">
                        Площадь (м²)
                      </Label>
                      <Input
                        id="roomSize"
                        type="number"
                        step="0.1"
                        min="0"
                        max="150"
                        value={roomFormData.size}
                        onChange={(e) => setRoomFormData({ ...roomFormData, size: e.target.value })}
                        placeholder="0.0"
                        disabled={lockRoomTypeFields}
                        className={lockRoomTypeFields ? 'bg-muted opacity-70' : ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedCount">
                        Количество кроватей *
                      </Label>
                      <Input
                        id="bedCount"
                        type="number"
                        min="1"
                        max="20"
                        value={roomFormData.bedCount}
                        onChange={(e) => setRoomFormData({ ...roomFormData, bedCount: e.target.value })}
                        placeholder="1"
                        required
                        disabled={lockRoomTypeFields}
                        className={lockRoomTypeFields ? 'bg-muted opacity-70' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxGuests">
                        Максимум гостей *
                      </Label>
                      <Input
                        id="maxGuests"
                        type="number"
                        min="1"
                        max="50"
                        value={roomFormData.maxGuests}
                        onChange={(e) => setRoomFormData({ ...roomFormData, maxGuests: e.target.value })}
                        disabled={lockRoomTypeFields}
                        className={lockRoomTypeFields ? 'bg-muted opacity-70' : ''}
                        placeholder="2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Удобства в номере</Label>
                    <div className="space-y-3 p-3 border rounded-md min-h-[60px]">
                      {roomAmenityTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Загрузка удобств...</p>
                      ) : (
                        roomAmenityTypes.map((amenityType: { id: number; name: string }) => {
                          const isSelected = roomFormData.amenityTypeIds.includes(amenityType.id);
                          return (
                            <div
                              key={amenityType.id}
                              className="flex items-center space-x-2 rounded-md px-2 py-1.5"
                            >
                              <Checkbox
                                id={`amenity-${amenityType.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setRoomFormData({
                                      ...roomFormData,
                                      amenityTypeIds: [...roomFormData.amenityTypeIds, amenityType.id],
                                    });
                                  } else {
                                    setRoomFormData({
                                      ...roomFormData,
                                      amenityTypeIds: roomFormData.amenityTypeIds.filter(
                                        (id) => id !== amenityType.id,
                                      ),
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`amenity-${amenityType.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {amenityType.name}
                              </Label>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-foreground font-semibold">Фотографии номера</Label>
                    
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleRoomImageChange(file);
                          }
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={roomFormData.images.length >= 5}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {roomFormData.images.length === 0
                          ? "Добавить фото"
                          : `Добавить фото (${roomFormData.images.length}/5)`}
                      </Button>
                      {roomFormData.images.length >= 5 && (
                        <span className="text-xs text-muted-foreground">Максимум 5 фото</span>
                      )}
                    </div>

                    {roomFormData.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {roomFormData.images.map((img, idx) => (
                          <div
                            key={`${img}-${idx}`}
                            className={`relative group aspect-square rounded-xl transition-all ${
                              idx === 0
                                ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background rounded-xl"
                                : ""
                            }`}
                          >
                            <div className={`relative w-full h-full rounded-xl overflow-hidden bg-gray-900/50 ${
                              idx !== 0 ? "border border-border" : ""
                            }`}>
                              <Image
                                src={normalizeRoomImageUrl(img)}
                                alt={`Фото ${idx + 1}`}
                                fill
                                unoptimized
                                sizes="160px"
                                className="object-cover transition-all duration-300"
                              />
                              
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[5]" />
                              
                              {idx === 0 && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                  Главное
                                </div>
                              )}
                            </div>
                            
                            {idx !== 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetMainImage(idx);
                                  }}
                                  className="w-9 h-9 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg pointer-events-auto"
                                  title="Сделать главным"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveRoomImage(idx);
                                  }}
                                  className="w-6 h-6 -mt-1 -mr-1 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg pointer-events-auto"
                                  title="Удалить фото"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {roomFormData.images.length > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          Желтая рамка — главное фото. Наведите на фото — затемнение, звезда по центру, крестик справа сверху.
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRoomsDialogOpen(false);
                        resetRoomForm();
                      }}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                    >
                      {createRoomMutation.isPending || updateRoomMutation.isPending
                        ? (editingRoom ? "Сохранение..." : "Создание...")
                        : (editingRoom ? "Сохранить изменения" : "Создать номер")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <TabsContent value="reviews">
              {managerHotel ? (
                <ManagerReviewsPanel
                  hotelId={reviewsHotelId ?? managerHotel.id}
                  hotelOptions={managerHotels.map((h: any) => ({ id: h.id, name: h.name }))}
                  onHotelChange={(id) => setReviewsHotelId(id)}
                />
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">Нет привязанного отеля</p>
                </Card>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </main>
      
      <Footer />

      <BookingDialog
        open={bookingsDialogOpen}
        onOpenChange={(open) => {
          setBookingsDialogOpen(open);
          if (!open) setEditingBooking(null);
        }}
        editingBooking={editingBooking}
        hotels={managerHotels}
        managerHotel={managerHotel}
        clientUsers={clientUsers}
        refetch={refetchBookings}
      />


      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">{isBlocking ? "Заблокировать номер" : "Разблокировать номер"}</DialogTitle>
          </DialogHeader>
          <BlockReasonPicker
            reasons={[...predefinedReasons]}
            selectedReason={blockReason}
            onSelectReason={setBlockReason}
            customReason={customReason}
            onCustomReasonChange={setCustomReason}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleBlockDialogSubmit}
              disabled={blockRoomMutation.isPending}
            >
              {blockRoomMutation.isPending ? "Блокировка..." : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unblockRoomDialogOpen} onOpenChange={setUnblockRoomDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Разблокировка номера</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите разблокировать этот номер?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnblockRoom}>
              Разблокировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
